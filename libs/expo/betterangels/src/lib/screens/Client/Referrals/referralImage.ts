import type { ReferralDocumentCopy } from './referralExport';
import { Colors } from '@monorepo/expo/shared/static';

export type ReferralImageLine = {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: '400' | '700';
  fontStyle: 'normal' | 'italic';
  color?: string;
};
export type ReferralImageLayout = {
  lines: readonly ReferralImageLine[];
  width: number;
  height: number;
  outputWidth: number;
  outputHeight: number;
};

const WIDTH = 720;
const MARGIN = 32;
const SCALE = 1.5;
const MAX_OUTPUT_HEIGHT = 8192;

/** Conservative wrapping without browser/canvas font measurement. Keeps every
 * code point and explicit line break; long tokens are wrapped, never clipped.
 * Generous glyph-width estimates leave room for bold, accented and wide text.
 */
export function wrapReferralImageText(
  text: string,
  maxUnits: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\t/g, '    ').split(/\r\n|\r|\n/)) {
    const characters = Array.from(paragraph);
    if (!characters.length) lines.push('');
    let start = 0;
    while (start < characters.length) {
      let end = start;
      let units = 0;
      let breakAt = start;
      while (end < characters.length) {
        const character = characters[end];
        let width = 1.2;
        if ((character.codePointAt(0) ?? 0) >= 0x1f000) width = 2;
        else if (/[MW@%&#mw]/.test(character)) width = 1;
        else if (/[ijlI.,:;!'| ()[\]]/.test(character)) width = 0.45;
        else if (/[A-Z]/.test(character)) width = 0.9;
        else if (/[a-z0-9]/.test(character)) width = 0.7;
        if (units + width > maxUnits && end > start) break;
        units += width;
        end += 1;
        if (/\s/u.test(characters[end - 1])) breakAt = end;
      }
      if (end < characters.length && breakAt > start) end = breakAt;
      lines.push(characters.slice(start, end).join(''));
      start = end;
    }
  }
  return lines;
}

export function layoutReferralImage(
  copy: ReferralDocumentCopy,
): ReferralImageLayout {
  const lines: ReferralImageLine[] = [];
  let y = MARGIN;
  const sizeError = () =>
    new Error(
      'Summary is too large for one image. Use text sharing for the complete copy.',
    );
  const wrapped = (text: string, width: number, fontSize: number) => {
    if (text.length > 20000) throw sizeError();
    return wrapReferralImageText(text, width / fontSize);
  };
  const checkHeight = () => {
    if (Math.ceil((y + MARGIN) * SCALE) > MAX_OUTPUT_HEIGHT) throw sizeError();
  };
  const add = (
    text: string,
    fontSize: number,
    bold = false,
    italic = false,
  ) => {
    for (const line of wrapped(text, WIDTH - 2 * MARGIN, fontSize)) {
      y += fontSize + 8;
      checkHeight();
      lines.push({
        text: line,
        x: MARGIN,
        y,
        fontSize,
        fontWeight: bold ? '700' : '400',
        fontStyle: italic ? 'italic' : 'normal',
      });
    }
    y += 8;
  };
  for (const block of copy.blocks) {
    if (block.kind === 'space') y += 12;
    else if (block.kind === 'field') {
      const labels = wrapped(`${block.label}:`, 300, 18);
      const values = wrapped(block.value, WIDTH - 2 * MARGIN - 324, 18);
      const top = y;
      y += Math.max(labels.length, values.length) * 26;
      checkHeight();
      for (const [index, text] of labels.entries())
        lines.push({
          text,
          x: MARGIN,
          y: top + (index + 1) * 26,
          fontSize: 18,
          fontWeight: '700',
          fontStyle: 'normal',
        });
      for (const [index, text] of values.entries())
        lines.push({
          text,
          x: MARGIN + 324,
          ...(block.tone === 'warning' ? { color: Colors.ERROR } : {}),
          y: top + (index + 1) * 26,
          fontSize: 18,
          fontWeight: '400',
          fontStyle: 'normal',
        });
      y += 12;
    } else if (block.kind === 'title') add(block.text, 24, true);
    else if (block.kind === 'heading') add(block.text, 20, true);
    else add(block.text, 16, false, true);
  }
  const height = Math.ceil(y + MARGIN);
  if (Math.ceil(height * SCALE) > MAX_OUTPUT_HEIGHT)
    throw new Error(
      'Summary is too large for one image. Use text sharing for the complete copy.',
    );
  return {
    lines,
    width: WIDTH,
    height,
    outputWidth: WIDTH * SCALE,
    outputHeight: Math.ceil(height * SCALE),
  };
}

export function captureReferralImage(
  svg: {
    toDataURL: (callback: (base64: string) => void, options: object) => void;
  },
  layout: ReferralImageLayout,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Image rendering timed out. Try text sharing.')),
      10000,
    );
    try {
      svg.toDataURL(
        (base64) => {
          clearTimeout(timer);
          resolve(base64);
        },
        { width: layout.outputWidth, height: layout.outputHeight },
      );
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}
