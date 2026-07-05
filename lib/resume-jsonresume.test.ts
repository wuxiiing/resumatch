import { describe, it } from "node:test";
import assert from "node:assert";
import { toJsonResume, fromJsonResume, type JsonResume } from "./resume-jsonresume.ts";
import { emptyResume, type StructuredResume } from "./resume-structured.ts";

// 字段顺序刻意与 toJsonResume/fromJsonResume 的重建顺序一致(个人总结→工作→教育→项目→技能;
// contacts 顺序 phone→email→其余),这样往返可以做精确 deepStrictEqual,不需要忽略顺序。
const REALISTIC: StructuredResume = {
  name: "张三",
  headline: "AI 产品经理 · 大模型应用方向",
  contacts: ["13800001111", "zhangsan@example.com", "北京"],
  sections: [
    {
      title: "个人总结",
      entries: [{ heading: "", meta: "", bullets: ["三年 AI 产品经验,主导过两款 LLM 应用从 0 到 1。"] }],
    },
    {
      title: "工作经历",
      entries: [
        {
          heading: "某某科技",
          meta: "2022.03 - 至今 · 高级产品经理",
          bullets: ["主导智能客服产品从 0 到 1,上线半年 DAU 破 10 万", "搭建 A/B 测试体系,迭代效率提升 30%"],
        },
      ],
    },
    {
      title: "教育背景",
      entries: [{ heading: "某某大学", meta: "2018 - 2022 · 计算机科学与技术", bullets: ["绩点 3.8/4.0", "ACM 校队"] }],
    },
    {
      title: "项目经历",
      entries: [
        {
          heading: "简历匹配 Agent",
          meta: "2026.01 - 至今 · 个人项目",
          bullets: ["基于 LangGraph 的多节点简历-JD 匹配分析工作流"],
        },
      ],
    },
    {
      title: "技能",
      entries: [{ heading: "工具", meta: "", bullets: ["Figma", "SQL", "Python"] }],
    },
  ],
};

describe("resume-jsonresume", () => {
  describe("round trip", () => {
    it("填满的真实感样例:fromJsonResume(toJsonResume(s)) 与原始 s 完全相等", () => {
      const j = toJsonResume(REALISTIC);
      const back = fromJsonResume(j);
      assert.deepStrictEqual(back, REALISTIC);
    });

    it("空白简历(emptyResume):往返后仍是空白结构,不产生多余字段", () => {
      const empty = emptyResume();
      const j = toJsonResume(empty);
      assert.deepStrictEqual(j, { basics: { name: "", label: "" } });
      const back = fromJsonResume(j);
      assert.deepStrictEqual(back, empty);
    });
  });

  describe("空/缺字段不炸", () => {
    it("toJsonResume: sections 为空数组、contacts 为空数组", () => {
      const s: StructuredResume = { name: "", headline: "", contacts: [], sections: [] };
      assert.doesNotThrow(() => toJsonResume(s));
    });

    it("toJsonResume: 板块存在但 entries 为空数组", () => {
      const s: StructuredResume = {
        name: "赵六",
        headline: "",
        contacts: [],
        sections: [{ title: "工作经历", entries: [] }],
      };
      const j = toJsonResume(s);
      assert.strictEqual(j.work, undefined, "没有 entry 的板块不应产生空的 work 数组");
    });

    it("fromJsonResume: 只有 basics 的最小 JsonResume 对象不报错", () => {
      const j: JsonResume = { basics: {} };
      const back = fromJsonResume(j);
      assert.deepStrictEqual(back, { name: "", headline: "", contacts: [], sections: [] });
    });

    it("fromJsonResume: work/education/skills/projects 缺省(undefined)不报错", () => {
      const j: JsonResume = { basics: { name: "只有姓名" } };
      assert.doesNotThrow(() => fromJsonResume(j));
      assert.strictEqual(fromJsonResume(j).name, "只有姓名");
    });
  });

  describe("联系方式识别", () => {
    it("email 和 phone 各自识别,无法识别的落进 location.address", () => {
      const s: StructuredResume = {
        name: "联系人测试",
        headline: "",
        contacts: ["hi@example.com", "159-1234-5678", "上海 · 浦东新区"],
        sections: [],
      };
      const j = toJsonResume(s);
      assert.strictEqual(j.basics.email, "hi@example.com");
      assert.strictEqual(j.basics.phone, "159-1234-5678");
      assert.strictEqual(j.basics.location?.address, "上海 · 浦东新区");
    });

    it("全部无法识别的 contacts 整体拼接,且可逆", () => {
      const s: StructuredResume = {
        name: "无联系方式测试",
        headline: "",
        contacts: ["随便一段自我描述文字", "另一条备注"],
        sections: [],
      };
      const j = toJsonResume(s);
      assert.strictEqual(j.basics.email, undefined);
      assert.strictEqual(j.basics.phone, undefined);
      assert.strictEqual(j.basics.location?.address, "随便一段自我描述文字 · 另一条备注");
      const back = fromJsonResume(j);
      assert.deepStrictEqual(back.contacts, s.contacts);
    });
  });

  describe("无法归类的板块", () => {
    it("标题无法归类的板块(如'荣誉奖项')被忽略,不影响其它板块", () => {
      const s: StructuredResume = {
        name: "王五",
        headline: "",
        contacts: [],
        sections: [
          { title: "荣誉奖项", entries: [{ heading: "国家奖学金", meta: "2021", bullets: [] }] },
          { title: "工作经历", entries: [{ heading: "公司A", meta: "", bullets: [] }] },
        ],
      };
      const j = toJsonResume(s);
      assert.strictEqual(j.work?.length, 1);
      assert.strictEqual(j.work?.[0].name, "公司A");
      assert.strictEqual(j.education, undefined);
      assert.strictEqual(j.skills, undefined);
      assert.strictEqual(j.projects, undefined);
    });
  });

  describe("个人总结多条 bullets(已知有损场景,不要求往返精确,但不应炸)", () => {
    it("多条 bullets 换行拼接成一段 summary", () => {
      const s: StructuredResume = {
        name: "李四",
        headline: "",
        contacts: [],
        sections: [{ title: "自我评价", entries: [{ heading: "", meta: "", bullets: ["第一段", "第二段"] }] }],
      };
      const j = toJsonResume(s);
      assert.strictEqual(j.basics.summary, "第一段\n第二段");

      const back = fromJsonResume(j);
      assert.strictEqual(back.sections.length, 1);
      assert.deepStrictEqual(back.sections[0].entries[0].bullets, ["第一段\n第二段"]);
    });
  });
});
