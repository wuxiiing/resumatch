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
  }
> = {
  keep: {
    label: "建议保留",
    tone: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-800",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  improve: {
    label: "建议优化",
    tone: "border-amber-200 bg-amber-50",
    text: "text-amber-900",
    badge: "border-amber-200 bg-amber-50 text-amber-700"
  },
  remove: {
    label: "建议弱化或删除",
    tone: "border-slate-200 bg-slate-100",
    text: "text-slate-700",
    badge: "border-slate-200 bg-slate-50 text-slate-600"
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

function getValidAnnotations(
  resumeOriginal: string,
  annotations: ResumeAnnotation[] = []
): ResumeAnnotation[] {
  let cursor = 0;

  return annotations
    .filter(
      (annotation) =>
        Number.isInteger(annotation.startIndex) &&
        Number.isInteger(annotation.endIndex) &&
        annotation.startIndex !== undefined &&
        annotation.endIndex !== undefined &&
        annotation.startIndex >= 0 &&
        annotation.endIndex > annotation.startIndex &&
        annotation.endIndex <= resumeOriginal.length
    )
    .sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0))
    .filter((annotation) => {
      const startIndex = annotation.startIndex ?? 0;

      if (startIndex < cursor) {
        return false;
      }

      cursor = annotation.endIndex ?? cursor;
      return true;
    });
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

function AnnotatedResumeView({
  annotations,
  resumeOriginal
}: {
  annotations: ResumeAnnotation[];
  resumeOriginal: string;
}) {
  const validAnnotations = getValidAnnotations(resumeOriginal, annotations);
  const pieces = splitResumeText(resumeOriginal, validAnnotations);

  if (validAnnotations.length === 0) {
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
      </section>
    );
  }

  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <div className="border-b border-line pb-4">
        <h2 className="text-base font-semibold text-ink">简历原文批改</h2>
        <p className="mt-1 text-sm text-muted">
          按原文顺序标出需要保留、优化或弱化的内容，未命中的文本保持原样。
        </p>
      </div>

      <div className="mt-5 whitespace-pre-wrap break-words rounded-[12px] border border-line bg-slate-50/45 p-4 text-sm leading-7 text-slate-700">
        {pieces.map((piece, index) => {
          if (piece.type === "plain") {
            return <span key={`plain-${index}`}>{piece.text}</span>;
          }

          const meta = annotationMeta[piece.annotation.status];

          return (
            <mark
              className={`rounded-[6px] border px-1.5 py-0.5 ${meta.tone} ${meta.text}`}
              key={piece.annotation.id}
            >
              {piece.text}
              <sup className="ml-0.5 text-[10px] font-semibold">
                {piece.index + 1}
              </sup>
            </mark>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {validAnnotations.map((annotation, index) => {
          const meta = annotationMeta[annotation.status];

          return (
            <article
              className={`rounded-[12px] border p-4 ${meta.tone}`}
              key={annotation.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">
                  {index + 1}. {annotation.section || "简历原文"}
                </h3>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${meta.badge}`}
                >
                  {meta.label}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {annotation.reason}
              </p>
              {annotation.suggestion ? (
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  <span className="font-medium text-slate-800">建议：</span>
                  {annotation.suggestion}
                </p>
              ) : null}
              {annotation.status === "improve" && annotation.rewriteExample ? (
                <div className="mt-3 rounded-[10px] border border-amber-200 bg-white/80 p-3 text-sm leading-6 text-slate-700">
                  <p className="text-xs font-semibold text-amber-700">参考改写</p>
                  <p className="mt-2">{annotation.rewriteExample}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
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
    { color: "bg-emerald-500", text: "绿色：建议保留" },
    { color: "bg-amber-500", text: "黄色：展示问题、建议和参考改写" },
    { color: "bg-slate-400", text: "灰色：建议弱化或删除" }
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
