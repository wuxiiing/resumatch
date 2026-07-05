// 简历 PDF 的中文字体注册（服务端渲染用）。
// 为什么服务端渲染：中文全量 TTF 每个约 10MB，4 个共 ~40MB。若走浏览器 pdf().toBlob()，
// 用户浏览器要下 40MB 字体才能出一张 PDF —— 不可接受。故 PDF 统一走服务端 renderToBuffer，
// 字体从本地 public/fonts 直接读文件。本模块因此是「服务端 only」（用了 node:path / process.cwd）。
import { Font } from "@react-pdf/renderer";
import { join } from "node:path";

export const FONT_SANS = "Noto Sans SC";
export const FONT_SERIF = "Noto Serif SC";

let registered = false;

/** 幂等注册 4 个 Noto 字重。首次渲染时调用（放在模板渲染函数里，不在 import 时触发副作用）。 */
export function registerResumeFonts(): void {
  if (registered) return;
  const dir = join(process.cwd(), "public", "fonts");
  Font.register({
    family: FONT_SANS,
    fonts: [
      { src: join(dir, "NotoSansSC-Regular.ttf"), fontWeight: "normal" },
      { src: join(dir, "NotoSansSC-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  Font.register({
    family: FONT_SERIF,
    fonts: [
      { src: join(dir, "NotoSerifSC-Regular.ttf"), fontWeight: "normal" },
      { src: join(dir, "NotoSerifSC-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  registered = true;
}
