import type { AnalysisReport } from "@/types/analysis";

export const placeholderReport: AnalysisReport = {
  score: 87,
  summary:
    "这份简历与目标岗位的基础能力要求匹配度较高，项目经历能够支撑岗位方向。建议补充更多量化结果，并把部分通用表述改成更贴近 JD 的关键词表达。",
  jobDirection: [
    {
      label: "JD 关注点",
      description:
        "岗位更看重工具型产品的前端实现、信息结构拆解和数据辅助决策能力。"
    },
    {
      label: "老板想看到",
      description:
        "简历需要证明你能把模糊需求落到页面结构、组件规范和可交付结果上。"
    },
    {
      label: "最有支撑力的证据",
      description:
        "项目经历里的流程优化、用户反馈整理、指标表达和量化结果最能支撑匹配。"
    }
  ],
  matchedKeywords: [
    "Next.js",
    "数据分析",
    "用户研究",
    "组件化",
    "项目交付",
    "信息架构",
    "TypeScript",
    "跨角色协作",
    "报告呈现"
  ],
  missingKeywords: [
    "A/B 测试",
    "指标归因",
    "自动化流程",
    "漏斗分析",
    "增长实验",
    "质量监控"
  ],
  suggestions: [
    {
      label: "技能层面",
      description: "补足 JD 中反复出现但简历表达较弱的工具和方法词。",
      count: 2
    },
    {
      label: "项目经验",
      description: "把项目职责和岗位要求建立更直接的对应关系。",
      count: 3
    },
    {
      label: "成果量化",
      description: "将“提升效率”等概括表述替换为可判断的结果描述。",
      count: 2
    }
  ],
  history: [
    {
      id: "history-1",
      company: "某互联网公司",
      role: "前端产品工程师",
      time: "今天 09:20",
      score: 87,
      active: true
    },
    {
      id: "history-2",
      company: "智能招聘平台",
      role: "产品运营实习生",
      time: "昨天 18:42",
      score: 74
    },
    {
      id: "history-3",
      company: "数据工具团队",
      role: "数据分析助理",
      time: "05-12 14:08",
      score: 63
    }
  ],
  segments: [
    {
      id: "segment-1",
      section: "项目经历",
      original:
        "负责简历分析工具的页面结构设计，拆分上传、输入、报告展示等模块，并沉淀可复用的组件规范。",
      status: "relevant",
      comment: "与 JD 中的组件化和工具产品经验高度相关。",
      suggestion: ""
    },
    {
      id: "segment-2",
      section: "项目经历",
      original:
        "参与岗位匹配流程优化，整理用户反馈并推动页面信息层级调整，提升用户理解效率。",
      status: "optimize",
      comment: "内容有价值，但结果表达偏概括。",
      suggestion:
        "可以补充具体指标或观察口径，例如“根据 20 份用户反馈调整报告层级，使关键信息查找时间明显缩短”。"
    },
    {
      id: "segment-3",
      section: "校园经历",
      original:
        "组织社团活动并负责现场协调、物料准备和成员通知，保证活动按计划完成。",
      status: "irrelevant",
      comment: "与当前目标岗位关联度较低，可压缩篇幅。",
      suggestion: ""
    },
    {
      id: "segment-4",
      section: "技能能力",
      original:
        "熟悉 HTML、CSS、TypeScript 和基础数据处理流程，能够完成跨角色沟通和文档沉淀。",
      status: "optimize",
      comment: "技能覆盖面较好，但可以更贴近 JD 关键词。",
      suggestion:
        "建议把“基础数据处理流程”进一步说明为“指标拆解、数据清洗或分析结论整理”等更明确的能力。"
    }
  ]
};
