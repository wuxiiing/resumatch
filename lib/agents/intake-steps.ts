// 槽位状态机(纯逻辑,零依赖):研判需要「简历 + JD」两样,缺哪样只追问哪样。
// 前端(输入页对话框)与后端/脚本共用;文案即产品语气(新国风·轻军师腔),要改语气只改这里。

export type IntakeSlots = { hasResume: boolean; hasJd: boolean; goal?: string };
export type IntakeStep = { ready: boolean; ask: string };

export function nextIntakeStep(s: IntakeSlots): IntakeStep {
  if (s.hasResume && s.hasJd) return { ready: true, ask: "" };
  if (s.hasResume)
    return {
      ready: false,
      ask: "简历已收入案头。想投哪个岗位?把 JD 丢进来——截图、粘贴全文都行;还没有目标,就说「帮我定方向」。",
    };
  if (s.hasJd)
    return {
      ready: false,
      ask: "这份岗位我看过了。把你的简历给我——文件、截图、直接粘贴,都收。",
    };
  return {
    ready: false,
    ask: "把简历和心仪的岗位丢进来——文件、截图、一句话,都行。缺什么我会问你。",
  };
}
