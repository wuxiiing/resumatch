import { describe, it } from "node:test";
import assert from "node:assert";
import { nextIntakeStep, type IntakeSlots } from "./intake-steps.ts";

describe("nextIntakeStep", () => {
  describe("四种槽位组合(缺 X 问 X)", () => {
    it("都缺:同时追问简历和岗位,ready=false", () => {
      const step = nextIntakeStep({ hasResume: false, hasJd: false });
      assert.strictEqual(step.ready, false);
      assert.match(step.ask, /简历/);
      assert.match(step.ask, /岗位/);
      assert.match(step.ask, /^把简历和心仪的岗位丢进来/);
    });

    it("只有简历,缺 JD:追问岗位/JD,且不重复索要简历", () => {
      const step = nextIntakeStep({ hasResume: true, hasJd: false });
      assert.strictEqual(step.ready, false);
      assert.match(step.ask, /^简历已收入案头/);
      assert.match(step.ask, /JD|岗位/);
      assert.doesNotMatch(step.ask, /把你的简历给我/);
    });

    it("只有 JD,缺简历:追问简历,且不重复索要 JD", () => {
      const step = nextIntakeStep({ hasResume: false, hasJd: true });
      assert.strictEqual(step.ready, false);
      assert.match(step.ask, /^这份岗位我看过了/);
      assert.match(step.ask, /简历/);
      assert.doesNotMatch(step.ask, /把 JD 丢进来/);
    });

    it("两样都有:ready=true,ask 为空字符串", () => {
      const step = nextIntakeStep({ hasResume: true, hasJd: true });
      assert.strictEqual(step.ready, true);
      assert.strictEqual(step.ask, "");
    });
  });

  describe("槽位逐个补齐 -> 最终齐活", () => {
    it("空白 -> 补简历 -> 补 JD,每一步的追问都对应当前缺的东西,最终 ready", () => {
      let slots: IntakeSlots = { hasResume: false, hasJd: false };
      let step = nextIntakeStep(slots);
      assert.strictEqual(step.ready, false);
      assert.match(step.ask, /简历/);
      assert.match(step.ask, /岗位/);

      slots = { ...slots, hasResume: true };
      step = nextIntakeStep(slots);
      assert.strictEqual(step.ready, false);
      assert.match(step.ask, /JD|岗位/);

      slots = { ...slots, hasJd: true };
      step = nextIntakeStep(slots);
      assert.strictEqual(step.ready, true);
      assert.strictEqual(step.ask, "");
    });

    it("反过来先补 JD 再补简历,同样能收尾到 ready", () => {
      let slots: IntakeSlots = { hasResume: false, hasJd: false };
      slots = { ...slots, hasJd: true };
      let step = nextIntakeStep(slots);
      assert.strictEqual(step.ready, false);
      assert.match(step.ask, /简历/);

      slots = { ...slots, hasResume: true };
      step = nextIntakeStep(slots);
      assert.strictEqual(step.ready, true);
      assert.strictEqual(step.ask, "");
    });
  });

  describe("边界情况", () => {
    it("空输入(两样都没有)不报错", () => {
      assert.doesNotThrow(() => nextIntakeStep({ hasResume: false, hasJd: false }));
    });

    it("已齐活后重复调用保持 ready,不回退重新追问(幂等)", () => {
      const slots: IntakeSlots = { hasResume: true, hasJd: true };
      const first = nextIntakeStep(slots);
      const second = nextIntakeStep(slots);
      assert.deepStrictEqual(first, second);
      assert.strictEqual(second.ready, true);
    });

    it("换料(若支持):当前实现按布尔快照判定,不区分'首次提供'与'替换内容'——" +
      "只要 hasResume/hasJd 仍为 true,replace 材料内容不会让状态机回退重新询问", () => {
      // IntakeSlots 只有 hasResume/hasJd 两个布尔槽位,没有"内容版本"概念;
      // 如果产品希望换料时重新确认,需要额外状态字段,这里如实记录当前行为,不做假设性修改。
      const step = nextIntakeStep({ hasResume: true, hasJd: true });
      assert.strictEqual(step.ready, true);
    });

    it("goal 字段不参与 ready 判定(符合文件头注释:此状态机只管简历+JD 两样)", () => {
      const withGoal = nextIntakeStep({ hasResume: true, hasJd: false, goal: "AI 产品经理" });
      const withoutGoal = nextIntakeStep({ hasResume: true, hasJd: false });
      assert.deepStrictEqual(withGoal, withoutGoal);
    });
  });
});
