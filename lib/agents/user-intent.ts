// 用户意图（第三个输入维度："你想要什么"）。
// 现在先作为结构化输入；混合方案里的"对话采集"留到接前端时做。

export type UserIntent = {
  targetDirection: string; // 目标方向
  hardNo: string[]; // 绝不接受的
};
