import { execFileSync } from "node:child_process";
import fs from "node:fs";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "resumatch-deepseek-"));
const outDir = path.join(tempDir, "dist");
const tsconfigPath = path.join(tempDir, "tsconfig.json");
const nodeShimPath = path.join(tempDir, "node-shim.d.ts");

fs.writeFileSync(
  nodeShimPath,
  "declare const process: { env: Record<string, string | undefined> };\n"
);

fs.writeFileSync(
  tsconfigPath,
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        module: "CommonJS",
        moduleResolution: "Node",
        lib: ["ES2020", "DOM"],
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        noEmitOnError: false,
        rootDir,
        outDir,
        baseUrl: rootDir,
        paths: {
          "@/*": ["*"]
        }
      },
      include: [
        path.join(rootDir, "lib/deepseek-client.ts"),
        path.join(rootDir, "lib/analysis-schema.ts"),
        path.join(rootDir, "lib/analysis-prompt.ts"),
        path.join(rootDir, "lib/segment-original-validator.ts"),
        path.join(rootDir, "types/analysis.ts"),
        nodeShimPath
      ]
    },
    null,
    2
  )
);

const tscBin = path.join(rootDir, "node_modules", "typescript", "bin", "tsc");

execFileSync(process.execPath, [tscBin, "--project", tsconfigPath], { stdio: "pipe" });

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return path.join(outDir, `${request.slice(2)}.js`);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const require = createRequire(import.meta.url);
const { analyzeWithDeepSeek, DeepSeekClientError } = require(
  path.join(outDir, "lib", "deepseek-client.js")
);

const env = {
  DEEPSEEK_API_KEY: "fake-key",
  DEEPSEEK_MODEL: "fake-model",
  DEEPSEEK_API_BASE_URL: "https://example.invalid"
};

const request = {
  resumeText: [
    "Alex Chen",
    "Built React dashboard for SQL reporting.",
    "Led user feedback analysis."
  ].join("\n"),
  jobDescription: "Need React, SQL, and user feedback analysis.",
  resumeFileType: "txt"
};

function completionFromContent(content, finishReason = "stop") {
  return {
    choices: [
      {
        finish_reason: finishReason,
        message: { content }
      }
    ]
  };
}

function jsonCompletion(report, finishReason = "stop") {
  return completionFromContent(JSON.stringify(report), finishReason);
}

function fakeResponse(body) {
  return {
    ok: true,
    json: async () => {
      if (body instanceof Error) {
        throw body;
      }

      return body;
    }
  };
}

function makeFetcher(responses) {
  let calls = 0;

  return {
    fetcher: async () => {
      const index = Math.min(calls, responses.length - 1);
      calls += 1;
      return fakeResponse(responses[index]);
    },
    get calls() {
      return calls;
    }
  };
}

function makeReport(overrides = {}) {
  return {
    score: 0,
    rubricRatings: {
      hardSkillMatch: { level: "medium", evidence: "React and SQL", gap: "Needs depth" },
      evidenceStrength: { level: "medium", evidence: "Project evidence", gap: "Needs metrics" },
      businessContext: { level: "medium", evidence: "User feedback", gap: "Needs context" },
      quantifiedResult: { level: "weak", evidence: "", gap: "No numbers" },
      resumeClarity: { level: "strong", evidence: "Readable", gap: "" }
    },
    requirementChecks: [
      {
        label: "SQL",
        priority: "must",
        status: "present",
        evidence: "Built React dashboard for SQL reporting.",
        note: "Evidence found."
      }
    ],
    summary: "Mock summary.",
    resumeOriginal: "",
    resumeDisplayText: request.resumeText,
    jobDirection: [{ label: "React SQL", description: "Mock direction." }],
    matchedKeywords: ["React", "SQL"],
    missingKeywords: [],
    suggestions: [{ label: "Metrics", description: "Add real metrics.", count: 1 }],
    history: [
      {
        id: "history-1",
        company: "Target",
        role: "Role",
        time: "Now",
        score: 0,
        active: true
      }
    ],
    annotations: [
      {
        id: "annotation-1",
        original: "Built React dashboard for SQL reporting.",
        status: "keep",
        relatedJdNeed: "React SQL",
        reason: "Matches the JD need.",
        suggestion: "Keep this evidence.",
        section: "Experience"
      }
    ],
    segments: [
      {
        id: "segment-1",
        section: "Experience",
        original: "Built React dashboard for SQL reporting.",
        status: "relevant",
        comment: "Relevant evidence.",
        suggestion: "Keep it."
      }
    ],
    ...overrides
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectDeepSeekError(name, responses, expectedMessagePart) {
  const { fetcher } = makeFetcher(responses);

  try {
    await analyzeWithDeepSeek(request, { env, fetcher });
  } catch (error) {
    assert(error instanceof DeepSeekClientError, `${name}: expected DeepSeekClientError`);
    assert(
      error.message.includes(expectedMessagePart),
      `${name}: expected message to include ${expectedMessagePart}`
    );
    console.log(`ok - ${name}`);
    return;
  }

  throw new Error(`${name}: expected failure`);
}

await expectDeepSeekError(
  "finish_reason length returns clear truncation error",
  [completionFromContent("{", "length")],
  "finish_reason: length"
);

await expectDeepSeekError(
  "non JSON upstream body returns clear error",
  [new SyntaxError("not json")],
  "不是合法 JSON"
);

{
  const invalidThenValid = makeFetcher([
    jsonCompletion(makeReport({ summary: 123 })),
    jsonCompletion(makeReport())
  ]);
  const report = await analyzeWithDeepSeek(request, { env, fetcher: invalidThenValid.fetcher });
  assert(report.score >= 0, "invalid report repair path should return a valid report");
  assert(invalidThenValid.calls === 2, "invalid report should trigger one repair retry");
  console.log("ok - invalid report retries and recovers");
}

{
  const legal = makeFetcher([jsonCompletion(makeReport())]);
  const report = await analyzeWithDeepSeek(request, { env, fetcher: legal.fetcher });
  assert(report.annotations?.length === 1, "legal report should keep matched annotation");
  assert(legal.calls === 1, "legal report should pass without retry");
  console.log("ok - legal mock report passes");
}

{
  const badAnnotation = makeFetcher([
    jsonCompletion(
      makeReport({
        annotations: [
          {
            id: "annotation-miss",
            original: "Not present in resume text.",
            status: "keep",
            relatedJdNeed: "React SQL",
            reason: "Mock reason.",
            suggestion: "Mock suggestion."
          }
        ]
      })
    )
  ]);
  const report = await analyzeWithDeepSeek(request, { env, fetcher: badAnnotation.fetcher });
  assert(report.annotations?.length === 0, "unmatched annotation should be filtered");
  assert(badAnnotation.calls === 1, "unmatched annotation should not trigger a model retry");
  console.log("ok - unmatched annotation filters locally without retrying");
}

fs.rmSync(tempDir, { recursive: true, force: true });
