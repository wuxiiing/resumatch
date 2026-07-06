type LogoProps = {
  size?: "default" | "large";
};

export function Logo({ size = "default" }: LogoProps) {
  const wordmarkSize = size === "large" ? "text-[32px]" : "text-[22px]";
  const subtitleSize = size === "large" ? "text-[11px]" : "text-[10px]";

  return (
    <div className="leading-none">
      <div className={`${wordmarkSize} font-semibold tracking-normal text-ink`}>
        Resu<span className="text-brand">Match</span>
      </div>
      <div
        className={`mt-1 ${subtitleSize} font-medium uppercase tracking-[0.18em] text-slate-400`}
      >
        Resume · JD Analysis
      </div>
    </div>
  );
}
