export function FileUploader() {
  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">简历上传</h2>
          <p className="mt-1 text-sm text-muted">
            支持 .pdf / .docx / .xlsx，阶段 1 仅展示上传区域占位。
          </p>
        </div>
        <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-medium text-brand-dark">
          占位
        </span>
      </div>

      <div className="mt-5 flex min-h-56 flex-col items-center justify-center rounded-[12px] border border-dashed border-cyan-200 bg-slate-50/70 px-6 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-100 bg-white text-xl font-semibold text-brand">
          +
        </div>
        <p className="mt-4 text-sm font-medium text-ink">点击或拖拽简历文件到这里</p>
        <p className="mt-2 max-w-sm text-xs leading-5 text-muted">
          本阶段不读取文件内容，不进行解析，也不会上传到任何接口。
        </p>
      </div>

      <div className="mt-4 rounded-[12px] border border-line bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-slate-700">文件状态</span>
          <span className="text-muted">等待用户选择文件</span>
        </div>
      </div>
    </section>
  );
}
