export function JDInput() {
  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">岗位 JD 输入</h2>
          <p className="mt-1 text-sm text-muted">
            粘贴目标岗位描述，正式版本将限制在 1000 字以内。
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-muted">
          0 / 1000
        </span>
      </div>

      <textarea
        aria-label="岗位 JD 输入占位"
        className="mt-5 min-h-56 w-full resize-none rounded-[12px] border-line bg-slate-50 text-sm leading-6 text-slate-500 placeholder:text-slate-400 focus:border-brand focus:ring-brand"
        placeholder="请将目标岗位的职位描述粘贴到这里"
        readOnly
      />

      <button
        className="mt-4 w-full rounded-[12px] bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
        disabled
        type="button"
      >
        开始分析（阶段 1 占位）
      </button>
    </section>
  );
}
