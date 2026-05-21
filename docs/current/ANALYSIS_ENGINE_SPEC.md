# ResuMatch Analysis Engine Spec

Status: SPEC-0002 baseline.

Scope: fix the target rules for SCORE-0001, annotation redesign, and prompt/schema follow-up work. This document is specification only and does not change business code by itself.

## 1. Text Ownership

- `resumeOriginal` is the original parsed resume text.
- It is server-owned data from the parsing/request pipeline, not something to trust from model output.
- It is used for traceability, fallback, safety comparison, and debugging.
- It is not the primary annotation base once a valid display text exists.
- `resumeDisplayText` is the result-page display base.
- It may normalize layout, line breaks, section headings, bullets, and spacing.
- It must not become a summary, polished rewrite, JD analysis, or generated resume.
- All `annotations.original` matching must be based on the final `resumeDisplayText`.
- If `resumeDisplayText` is absent or rejected, implementation may explicitly fall back to `resumeOriginal`.

## 2. JD Three-Layer Penetration

- The engine must understand the JD before matching resume evidence.
- Layer 1, text decomposition: extract business direction, core responsibilities, hard requirements, soft abilities, priority words, and limiting words.
- Priority words include required, preferred, familiar with, independently, high frequency, owner, plus, and similar signals.
- Limiting words include industry, user group, seniority, location, schedule, language, degree, tool, and delivery constraints.
- Layer 2, logical connection: infer role type, business scenario, work mode, and core objective.
- Role type may include product, data, operation, research, engineering, design, sales, or hybrid roles.
- Work mode may include project delivery, experiment iteration, user growth, service execution, research output, or cross-team collaboration.
- Layer 3, essence extraction: summarize the real screening standard behind the JD.
- The output must state what the resume needs to prove, not only what keywords it contains.
- `jobDirection` must reflect business essence, existing evidence, real gaps, and reinforcement direction.

## 3. Annotation Redesign

- The previous conservative fixed target of 4-6 annotations is deprecated.
- The new target is to return as much useful feedback as the resume evidence supports.
- Annotation count should be dynamic by resume length, section richness, and evidence density.
- Reference range: short resumes should usually return 5-8 annotations.
- Reference range: ordinary resumes should usually return 8-12 annotations.
- Reference range: content-rich resumes may return 12-15 annotations.
- The final hard upper limit is left to the implementation task.
- A real ordinary resume should not return only 1-3 annotations unless content is truly minimal.
- When output is unusually low, the report must explain the evidence limitation.
- Every annotation must have actual modification value, locate to a continuous slice in `resumeDisplayText`, and analyze only one thing.
- Do not join unrelated snippets into one `original`.
- Do not mechanically allocate quotas by section.
- Select by JD relevance and modification value.
- Covered objects include personal summary, self-evaluation, projects, paper projects, course design, and graduation thesis.
- Covered objects include internship, work, research, journal publication, campus experience, student union, clubs, volunteer service, and public service labor.
- Covered objects include competitions, awards, honors, certificates, and skills.
- Do not annotate contact information, ordinary school names, ordinary dates, ordinary locations, or harmless basic information.
- Skill lists should not be split into many low-value annotations.

## 4. Annotation Rewrite Method

- For `improve`, `rewriteExample` should follow STAR thinking: background/problem, action, ability used, and purpose/result.
- For project, internship, paper, and campus experience, suggestions should follow scenario-action-result-job value.
- The engine must not invent numbers when the source lacks real data.
- It must not invent users, accuracy, efficiency lift, conversion rate, ranking, revenue, award, or growth.
- When real data is missing, the rewrite may say: `可补充真实数据`.
- The rewrite can make existing facts clearer and more role-oriented.
- The rewrite cannot add a new company, project, tool, responsibility, or achievement absent from the source.
- `rewriteExample` should be directly useful, but still evidence-bound.

## 5. keep / improve / remove Triggers

- `keep` means the source text is strong JD evidence.
- A `keep` annotation should explain why to retain it and how to strengthen it.
- `improve` means the direction is relevant but the expression is weak.
- `improve` is the main annotation type.
- It should catch missing evidence, weak action verbs, unclear responsibility, missing business scenario, or missing result.
- `remove` means the text is weakly related, dilutes the focus, or consumes space.
- `remove` should be used sparingly.
- `remove` should not punish harmless basic information unless it takes valuable resume space.
- Reports scoring 75-89 must not contain only `keep`; they must include meaningful `improve` annotations.
- Mid and low scores should more clearly point out missing evidence, missing quantification, and missing business context.
- High scores should still identify optimization opportunities instead of becoming praise-only.

## 6. SCORE-0001 Direction

- DeepSeek should not output free numeric subscores.
- The model should output `rubricRatings` values: `strong`, `medium`, `weak`, or `missing`.
- The backend should compute the final score from fixed mappings.
- Recommended dimensions are `hardSkillMatch`, `evidenceStrength`, `businessContext`, `quantifiedResult`, and `resumeClarity`.
- `hardSkillMatch` measures explicit match to required skills, tools, domain knowledge, and must-have qualifications.
- `evidenceStrength` measures whether the resume proves the claim with concrete experience.
- `businessContext` measures whether the candidate connects work to the target role scenario.
- `quantifiedResult` measures whether results, scale, impact, or evidence are concrete and truthful.
- `resumeClarity` measures structure, readability, section clarity, and action-result expression.
- Mapping and weighting belong to SCORE-0001 implementation.

## 7. Acceptance Standards

- Annotations must not be too few for real ordinary resumes.
- A real ordinary resume should not return only 1-3 annotations unless the content is extremely limited and the report says why.
- Every `annotations.original` must locate inside the final `resumeDisplayText`.
- Server-side validation should reject or filter unlocatable annotations.
- `rewriteExample` must not fabricate data.
- `rewriteExample` must preserve source facts and mark missing real data instead of inventing it.
- `jobDirection` must reflect role business essence, evidence, gaps, and reinforcement direction.
- The engine must keep full resumes, full JDs, API keys, and raw model responses out of logs and documentation.
- SPEC-0002 is accepted when this document exists at `docs/current/ANALYSIS_ENGINE_SPEC.md`.
- SPEC-0002 is accepted when the document stays around 80-140 lines.
- SPEC-0002 is accepted when no business-code files are modified by the documentation task.
