# Fonts for @react-pdf/renderer

Static TTF fonts for rendering Chinese text in generated PDFs (R2 template system).
`@react-pdf/renderer` requires one complete static file per weight — no variable fonts,
no woff2, no unicode-range-sliced subsets.

## Files

| File | Family | Weight | Glyphs |
|---|---|---|---|
| `NotoSansSC-Regular.ttf` | Noto Sans SC | Regular (400) | 31,036 |
| `NotoSansSC-Bold.ttf` | Noto Sans SC | Bold (700) | 31,036 |
| `NotoSerifSC-Regular.ttf` | Noto Serif SC | Regular (400) | 31,058 |
| `NotoSerifSC-Bold.ttf` | Noto Serif SC | Bold (700) | 31,058 |

Each file is a single complete font covering the full Simplified Chinese (+ Latin) repertoire —
not a partial/subset build.

## Source & provenance

Upstream Noto does **not** publish ready-made static `.ttf` files for these families —
only two forms exist officially:

- `google/fonts` repo (`ofl/notosanssc/`, `ofl/notoserifsc/`): variable font only
  (`NotoSansSC[wght].ttf`, `NotoSerifSC[wght].ttf`) — rejected per the no-variable-font constraint.
- `notofonts/noto-cjk` GitHub releases: static builds, but only as **OTF** (CFF outlines),
  not TTF.

So these files were built by downloading the official static OTF release assets and
converting OTF → TTF (CFF outlines → `glyf` outlines) with `fonttools`/`otf2ttf`
(the same standard conversion path font foundries use when submitting CFF-only fonts
to Google Fonts). This is a lossless outline-format conversion, not a re-hint or subset —
glyph count and shapes are unchanged.

- Noto Sans SC source: `18_NotoSansSC.zip` from
  https://github.com/notofonts/noto-cjk/releases/tag/Sans2.004
  (`NotoSansSC-Regular.otf`, `NotoSansSC-Bold.otf`)
- Noto Serif SC source: `14_NotoSerifSC.zip` from
  https://github.com/notofonts/noto-cjk/releases/tag/Serif2.003
  (`SubsetOTF/SC/NotoSerifSC-Regular.otf`, `SubsetOTF/SC/NotoSerifSC-Bold.otf`)

Verified after conversion (via `fontTools.ttLib`): `sfnt=0x00010000`, `glyf` table present,
no `CFF `, no `fvar` (confirms static, non-variable), correct `OS/2.usWeightClass`
(400/700) and `head.macStyle` bold flags. Also render-verified with
`@react-pdf/renderer` (`Font.register` + PDF output showing correct CJK glyphs in both
weights, no tofu).

## License

SIL Open Font License, Version 1.1 (OFL). Identical license text bundled in both
upstream zips. Full text: https://scripts.sil.org/OFL

OFL permits embedding/bundling in applications (including PDF font embedding) and
redistribution; it does not permit selling the font by itself.
