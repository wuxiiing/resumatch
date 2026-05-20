import type {
  AnnotationStatus,
  ReportSegment,
  ResumeAnnotation,
  SegmentStatus
} from "@/types/analysis";

type ReportViewerProps = {
  annotations?: ResumeAnnotation[];
  resumeOriginal?: string;
  segments: ReportSegment[];
};

const statusMeta: Record<
  SegmentStatus,
  {
    label: string;
    className: string;
  }
> = {
  relevant: {
    label: "匹配岗位要求",
    className: "border-emerald-200 bg-emerald-50"
  },
  optimize: {
    label: "可优化",
    className: "border-amber-200 bg-amber-50"
  },
  irrelevant: {
    label: "可考虑精简",
    className: "border-slate-200 bg-slate-50"
  }
};

const annotationMeta: Record<
  AnnotationStatus,
  {
    label: string;
    tone: string;
    text: string;
    badge: string;
    highlight: string;
    blockBorder: string;
    blockBg: string;
  }
> = {
  keep: {
    label: "建议保留并强化",
    tone: "border-emerald-200 bg-emerald-100/60",
    text: "text-emerald-800",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    highlight: "border-emerald-300 bg-emerald-100/70 text-emerald-800",
    blockBorder: "border-emerald-300",
    blockBg: "bg-emerald-50/60"
  },
  improve: {
    label: "建议优化",
    tone: "border-amber-200 bg-amber-100/60",
    text: "text-amber-900",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    highlight: "border-amber-300 bg-amber-100/70 text-amber-900",
    blockBorder: "border-amber-300",
    blockBg: "bg-amber-50/60"
  },
  remove: {
    label: "建议弱化",
    tone: "border-slate-200 bg-slate-200/60",
    text: "text-slate-600",
    badge: "border-slate-200 bg-slate-100 text-slate-500",
    highlight: "border-slate-300 bg-slate-200/70 text-slate-600",
    blockBorder: "border-slate-300",
    blockBg: "bg-slate-50/80"
  }
};

type TextPiece =
  | {
      text: string;
      type: "plain";
    }
  | {
      annotation: ResumeAnnotation;
      index: number;
      text: string;
      type: "annotation";
    };

function isValidAnnotationIndex(
  annotation: ResumeAnnotation,
  resumeOriginal: string
): boolean {
  return (
    Number.isInteger(annotation.startIndex) &&
    Number.isInteger(annotation.endIndex) &&
    annotation.startIndex !== undefined &&
    annotation.endIndex !== undefined &&
    annotation.startIndex >= 0 &&
    annotation.endIndex > annotation.startIndex &&
    annotation.endIndex <= resumeOriginal.length
  );
}

function categorizeAnnotations(
  resumeOriginal: string,
  annotations: ResumeAnnotation[]
): { valid: ResumeAnnotation[]; unlocated: ResumeAnnotation[] } {
  const indexable: ResumeAnnotation[] = [];
  const unlocated: ResumeAnnotation[] = [];

  for (const annotation of annotations) {
    if (isValidAnnotationIndex(annotation, resumeOriginal)) {
      indexable.push(annotation);
    } else {
      unlocated.push(annotation);
    }
  }

  const sorted = indexable.sort(
    (a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0)
  );

  const valid: ResumeAnnotation[] = [];
  let cursor = 0;

  for (const annotation of sorted) {
    const start = annotation.startIndex ?? 0;

    if (start >= cursor) {
      valid.push(annotation);
      cursor = annotation.endIndex ?? cursor;
    }
  }

  return { valid, unlocated };
}

function splitResumeText(
  resumeOriginal: string,
  annotations: ResumeAnnotation[]
): TextPiece[] {
  const pieces: TextPiece[] = [];
  let cursor = 0;

  annotations.forEach((annotation, index) => {
    const startIndex = annotation.startIndex ?? cursor;
    const endIndex = annotation.endIndex ?? startIndex;

    if (startIndex > cursor) {
      pieces.push({
        text: resumeOriginal.slice(cursor, startIndex),
        type: "plain"
      });
    }

    pieces.push({
      annotation,
      index,
      text: resumeOriginal.slice(startIndex, endIndex),
      type: "annotation"
    });

    cursor = endIndex;
  });

  if (cursor < resumeOriginal.length) {
    pieces.push({
      text: resumeOriginal.slice(cursor),
      type: "plain"
    });
  }

  return pieces;
}

function hasAnnotatedResume(
  resumeOriginal: string | undefined,
  annotations: ResumeAnnotation[] | undefined
) {
  return Boolean(resumeOriginal?.trim()) && Boolean(annotations?.length);
}

function InlineSuggestion({
  annotation,
  index
}: {
  annotation: ResumeAnnotation;
  index: number;
}) {
  const meta = annotationMeta[annotation.status];

  return (
    <div
      className={`ml-2 border-l-2 ${meta.blockBorder} ${meta.blockBg} my-2 rounded-r-[8px] px-3 py-2 text-sm leading-6`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
        >
          {meta.label}
        </span>
        <span className="text-[11px] text-slate-400">#{index + 1}</span>
      </div>

      {annotation.reason ? (
        <p className="mt-1.5 text-slate-700">{annotation.reason}</p>
      ) : null}

      {annotation.suggestion ? (
        <p className="mt-1.5 text-slate-600">
          <span className="font-medium text-slate-700">建议：</span>
          {annotation.suggestion}
        </p>
      ) : null}

      {annotation.status === "improve" && annotation.rewriteExample ? (
        <div className="mt-2 rounded-[10px] border border-amber-200 bg-white/80 p-3 text-sm leading-6 text-slate-700">
          <p className="text-xs font-semibold text-amber-700">参考改写</p>
          <p className="mt-1">{annotation.rewriteExample}</p>
        </div>
      ) : null}
    </div>
  );
}

function UnlocatedAnnotations({
  annotations
}: {
  annotations: ResumeAnnotation[];
}) {
  if (annotations.length === 0) return null;

  return (
    <div className="mt-5 rounded-[12px] border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="text-sm font-semibold text-slate-600">
        未定位批改建议
        <span className="ml-1.5 text-xs font-normal text-slate-400">
          （{annotations.length} 条无法映射到原文位置）
        </span>
      </h3>
      <div className="mt-3 space-y-3">
        {annotations.map((annotation) => {
          const meta = annotationMeta[annotation.status];

          return (
            <div
              className={`rounded-[10px] border p-3 ${meta.tone}`}
              key={annotation.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
                >
                  {meta.label}
                </span>
                <span className="text-xs text-slate-400">
                  {annotation.section || "未归类"}
                </span>
              </div>
              {annotation.original ? (
                <p className="mt-2 text-[13px] leading-6 text-slate-500">
                  <span className="font-medium text-slate-500">原文片段：</span>
                  {annotation.original.length > 120
                    ? `${annotation.original.slice(0, 120)}…`
                    : annotation.original}
                </p>
              ) : null}
              {annotation.reason ? (
                <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                  {annotation.reason}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnnotatedResumeView({
  annotations,
  resumeOriginal
}: {
  annotations: ResumeAnnotation[];
  resumeOriginal: string;
}) {
  const { valid, unlocated } = categorizeAnnotations(
    resumeOriginal,
    annotations
  );
  const pieces = splitResumeText(resumeOriginal, valid);

  if (valid.length === 0) {
    return (
      <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
        <div className="border-b border-line pb-4">
          <h2 className="text-base font-semibold text-ink">简历原文批改</h2>
          <p className="mt-1 text-sm text-muted">
            已保留简历原文，但本次报告没有可定位的批改标注。
          </p>
        </div>
        <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
          {resumeOriginal}
        </div>
        <UnlocatedAnnotations annotations={unlocated} />
      </section>
    );
  }

  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <div className="border-b border-line pb-4">
        <h2 className="text-base font-semibold text-ink">简历原文批改</h2>
        <p className="mt-1 text-sm text-muted">
          按原文顺序阅读，高亮片段为分析命中位置，批改意见紧附其后。
        </p>
      </div>

      <div className="mt-5 whitespace-pre-wrap break-words rounded-[12px] border border-line bg-slate-50/45 p-4 text-sm leading-7 text-slate-700">
        {pieces.map((piece, idx) => {
          if (piece.type === "plain") {
            return <span key={`plain-${idx}`}>{piece.text}</span>;
          }

          const meta = annotationMeta[piece.annotation.status];

          return (
            <span key={piece.annotation.id}>
              <mark
                className={`rounded-[6px] border px-1.5 py-0.5 ${meta.highlight}`}
              >
                {piece.text}
                <sup className="ml-0.5 text-[10px] font-semibold opacity-70">
                  {piece.index + 1}
                </sup>
              </mark>
              <InlineSuggestion
                annotation={piece.annotation}
                index={piece.index}
              />
            </span>
          );
        })}
      </div>

      <UnlocatedAnnotations annotations={unlocated} />
    </section>
  );
}

function SegmentFallbackView({ segments }: { segments: ReportSegment[] }) {
  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <div className="border-b border-line pb-4">
        <h2 className="text-base font-semibold text-ink">简历分析详情</h2>
        <p className="mt-1 text-sm text-muted">
          以下为根据本次分析整理的简历内容与优化建议。
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {segments.map((segment) => {
          const meta = statusMeta[segment.status];

          return (
            <article
              className={`rounded-[12px] border p-4 ${meta.className}`}
              key={segment.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{segment.section}</h3>
                <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
                  {meta.label}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {segment.original}
              </p>
              {segment.status === "optimize" ? (
                <div className="mt-4 rounded-[10px] border border-amber-200 bg-white/75 p-4">
                  <p className="text-xs font-semibold text-amber-700">问题说明</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {segment.comment}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-amber-700">
                    修改建议
                  </p>
                  <div className="mt-2 rounded-[10px] border border-line bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                    {segment.suggestion}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ReportViewer({
  annotations,
  resumeOriginal,
  segments
}: ReportViewerProps) {
  if (hasAnnotatedResume(resumeOriginal, annotations)) {
    return (
      <AnnotatedResumeView
        annotations={annotations ?? []}
        resumeOriginal={resumeOriginal ?? ""}
      />
    );
  }

  return <SegmentFallbackView segments={segments} />;
}

export function ReportLegend() {
  const items = [
    { color: "bg-emerald-500", text: "绿色：与 JD 高度相关，建议保留并强化" },
    { color: "bg-amber-500", text: "黄色：内容有价值，建议优化表达" },
    { color: "bg-slate-400", text: "灰色：与目标岗位关联度较低，建议弱化" }
  ];

  return (
    <section className="rounded-[12px] border border-line bg-white px-4 py-3">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item) => (
          <span
            className="inline-flex items-center gap-2 text-xs leading-5 text-muted"
            key={item.text}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            {item.text}
          </span>
        ))}
      </div>
    </section>
  );
}
