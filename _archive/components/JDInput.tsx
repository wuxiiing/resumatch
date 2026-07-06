"use client";

export const JD_CHAR_LIMIT = 1000;
const JD_LIMIT_ERROR = "岗位描述超过 1000 字，请精简后再分析。";

type JDInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function JDInput({ value, onChange }: JDInputProps) {
  const charCount = value.length;
  const isOverLimit = charCount > JD_CHAR_LIMIT;

  return (
    <section className="bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-brand-dark">步骤 2</p>
          <h2 className="mt-0.5 text-base font-semibold text-ink">
            粘贴目标岗位描述 / 招聘要求
          </h2>
        </div>
        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${
            isOverLimit
              ? "border-red-100 bg-red-50 text-red-600"
              : "border-slate-200 bg-white text-muted"
          }`}
        >
          {charCount} / {JD_CHAR_LIMIT}
        </span>
      </div>

      <textarea
        aria-label="目标岗位描述或招聘要求输入"
        className="mt-3 min-h-32 w-full resize-none rounded-[12px] border-line bg-slate-50 text-sm leading-6 text-slate-700 placeholder:text-slate-400 focus:border-brand focus:ring-brand sm:min-h-36"
        onChange={(event) => onChange(event.target.value)}
        placeholder="粘贴招聘启事里的岗位职责、任职要求或加分项，最多 1000 字"
        value={value}
      />

      {isOverLimit ? (
        <p className="mt-2 text-xs font-medium leading-5 text-red-600" role="alert">
          {JD_LIMIT_ERROR}
        </p>
      ) : null}
    </section>
  );
}
