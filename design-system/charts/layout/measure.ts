import { FALLBACK_EM, GLYPH_WIDTHS } from "./glyph-widths.ts";

export const SAFETY = 1.1;

// Charts use Geist: serif optical sizing changes advances with the font size.
export type TextFont = {
  family: "sans";
  weight: 400 | 500 | 600 | 700;
  size: number;
  letterSpacing?: number;
};

function fontKey(font: TextFont): keyof typeof GLYPH_WIDTHS {
  return `sans-${font.weight}`;
}

export function textWidth(text: string, font: TextFont): number {
  const key = fontKey(font);
  const widths: Readonly<Record<string, number>> = GLYPH_WIDTHS[key];
  const characters = Array.from(text);
  const em = characters.reduce((sum, char) => sum + (widths[char] ?? FALLBACK_EM[key]), 0);
  const spacing = Math.max(0, characters.length - 1) * (font.letterSpacing ?? 0);
  return (em * font.size + spacing) * SAFETY;
}

export function lineCount(text: string, maxWidth: number, font: TextFont): number {
  if (text.length === 0) return 0;
  let lines = 0;
  for (const paragraph of text.split(/\r\n|\r|\n/u)) {
    const words = paragraph.trim().split(/[ \t]+/u).filter(Boolean);
    let current = "";
    lines += 1;
    for (const word of words) {
      if (textWidth(word, font) > maxWidth) return Infinity;
      const candidate = current ? `${current} ${word}` : word;
      if (current && textWidth(candidate, font) > maxWidth) {
        lines += 1;
        current = word;
      } else {
        current = candidate;
      }
    }
  }
  return lines;
}

export function fits(
  text: string,
  box: { width: number; height: number },
  font: TextFont,
  lineHeight: number,
): boolean {
  const lines = lineCount(text, box.width, font);
  return Number.isFinite(lines) && lines * lineHeight <= box.height;
}
