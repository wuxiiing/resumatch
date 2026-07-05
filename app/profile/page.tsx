"use client";

// 简配 2.0 · 个人简历(长期档案)。管理简历 + 求职意愿,存 localStorage(jianpei:profile)。
// 一处设好处处用:研判、小简、简历修改都读这份档案。

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AppNav } from "@/components/AppNav";
import { JIANPEI_PROFILE_KEY, type JianpeiProfile } from "@/lib/agent-report";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="font-serifcn text-[14px] font-medium text-gf-ink">{label}</span>
        {hint && <span className="text-[11.5px] text-gf-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [targetDirection, setTargetDirection] = useState("");
  const [hardNoText, setHardNoText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(JIANPEI_PROFILE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as JianpeiProfile;
        setResumeText(p.resumeText ?? "");
        setResumeName(p.resumeName ?? "");
        setTargetDirection(p.intent?.targetDirection ?? "");
        setHardNoText((p.intent?.hardNo ?? []).join("\n"));
      }
    } catch {
      /* 坏数据当没有 */
    }
    setLoaded(true);
  }, []);

  function save() {
    const profile: JianpeiProfile = {
      resumeText,
      resumeName: resumeName.trim() || "简历",
      intent: {
        targetDirection: targetDirection.trim(),
        hardNo: hardNoText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      }
    };
    try {
      localStorage.setItem(JIANPEI_PROFILE_KEY, JSON.stringify(profile));
      setNote("已保存。研判、小简、简历修改都会用这份档案。");
    } catch {
      setNote("保存失败(本地存储可能已满)。");
    }
  }

  if (!loaded) return null;

  const inputCls = "w-full rounded-md border border-gf-rule bg-gf-surface px-3 py-2 text-[13.5px] text-gf-ink outline-none transition-colors focus:border-gf-green";

  return (
    <AppShell tone="bg-[#f7f1e3]" brand={<span className="truncate text-[13.5px] text-gf-soft">个人简历</span>} nav={<AppNav current="profile" />}>
      <div className="gf-rise mx-auto max-w-[760px] px-5 py-8 sm:px-8">
        <header className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-[12px] font-medium tracking-wide text-gf-green">
            <span className="inline-block h-3 w-[5px] rounded-[2px] bg-gf-green" /> 个人简历
          </div>
          <h1 className="font-serifcn text-[26px] font-semibold text-gf-ink">长期档案</h1>
          <p className="mt-1.5 max-w-[60ch] text-[12.5px] leading-relaxed text-gf-faint">
            你的简历和求职意愿——<strong className="text-gf-soft">一处设好,处处都用</strong>:研判、小简、简历修改都读这份档案,换岗位不用重贴。
          </p>
        </header>

        <section className="mb-7">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-3 w-[5px] rounded-[2px] bg-gf-green" />
            <h2 className="font-serifcn text-[16px] font-semibold text-gf-ink">求职意愿</h2>
            <span className="h-px flex-1 bg-gf-rule" />
          </div>
          <Field label="目标方向" hint="你想去的方向">
            <input className={inputCls} value={targetDirection} onChange={(e) => setTargetDirection(e.target.value)} placeholder="例如:AI 产品经理" />
          </Field>
          <Field label="绝不接受" hint="每行一条,会被研判和小简当硬约束">
            <textarea
              className={`${inputCls} min-h-[80px] resize-y leading-relaxed`}
              value={hardNoText}
              onChange={(e) => setHardNoText(e.target.value)}
              placeholder={"纯数据运营\n纯执行、没有产品参与空间的角色"}
            />
          </Field>
        </section>

        <section className="mb-7">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-3 w-[5px] rounded-[2px] bg-gf-green" />
            <h2 className="font-serifcn text-[16px] font-semibold text-gf-ink">简历</h2>
            <span className="h-px flex-1 bg-gf-rule" />
          </div>
          <Field label="简历名" hint="导出文件名用">
            <input className={inputCls} value={resumeName} onChange={(e) => setResumeName(e.target.value)} placeholder="例如:麦桐_简历" />
          </Field>
          <Field label="简历正文">
            <textarea
              className={`${inputCls} min-h-[300px] resize-y font-sans leading-relaxed`}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              spellCheck={false}
              placeholder="把你的简历正文贴在这里……"
            />
          </Field>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-gf-green px-5 py-2.5 font-serifcn text-[15px] text-white transition-colors hover:bg-gf-greend"
          >
            保存档案
          </button>
          {note && <span className="text-[12.5px] text-gf-soft">{note}</span>}
        </div>
      </div>
    </AppShell>
  );
}
