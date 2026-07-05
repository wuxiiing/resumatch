// CJK 断行助手（R2-1 spike 实测验证过的解法，所有中文正文都走它）。
//
// react-pdf 的坑：中文长段默认「不换行」——整段冲出右边界被切掉；而一旦给它断点
// （无论 ZWSP 还是 hyphenationCallback），它又会在断点补一个难看的连字符 "-"。
// 解法：把文本切成 token（汉字/全角标点逐字，连续的拉丁/数字/半角段各作一个 token），
// 每个 token 渲成独立 <Text>，塞进 flexDirection:row + flexWrap:wrap 的容器——
// 换行发生在「元素边界」而非「文字断字」，绕过连字符逻辑。拉丁词整体不切、不会断在词中。
import React from "react";
import { View, Text } from "@react-pdf/renderer";

// react-pdf 这版未导出单条样式类型，从组件 style prop 反推（排除数组形式）。
type Style = Exclude<NonNullable<React.ComponentProps<typeof View>["style"]>, unknown[]>;

// 中日韩统一表意文字 + 兼容表意文字 + CJK 标点 + 全角字符
const CJK = /[　-〿㐀-鿿豈-﫿＀-￯]/;

/** 汉字/全角标点逐字，其余连续段合并成一个 token。 */
export function tokenizeCJK(s: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (const ch of s) {
    if (CJK.test(ch)) {
      if (buf) {
        out.push(buf);
        buf = "";
      }
      out.push(ch);
    } else {
      buf += ch;
    }
  }
  if (buf) out.push(buf);
  return out;
}

const ROW: Style = { flexDirection: "row", flexWrap: "wrap" };

/**
 * 中文安全文本块：内部按 token 逐个换行，无连字符、无溢出。
 * @param text      文本内容
 * @param textStyle 施加到每个 token <Text>（字号/颜色/字重/lineHeight）
 * @param rowStyle  施加到外层行容器（如 flex:1 / marginBottom）
 */
export function CJKText(text: string, textStyle?: Style, rowStyle?: Style): React.ReactElement {
  return React.createElement(
    View,
    { style: rowStyle ? [ROW, rowStyle] : ROW },
    ...tokenizeCJK(text).map((tok, i) => React.createElement(Text, { key: i, style: textStyle }, tok)),
  );
}
