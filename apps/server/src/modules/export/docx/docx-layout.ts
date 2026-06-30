import { convertInchesToTwip } from 'docx';

export const FONT_FAMILY = 'Times New Roman';

/** 11pt body text */
export const BODY_SIZE = 22;
/** 14pt title */
export const TITLE_SIZE = 28;
/** 9pt footer */
export const FOOTER_SIZE = 18;

/** ~71pt margin matching PDF */
export const PAGE_MARGIN = convertInchesToTwip(71 / 72);

/** ~16pt question indent */
export const QUESTION_INDENT = convertInchesToTwip(16 / 72);

/** ~16pt option indent */
export const OPTION_INDENT = convertInchesToTwip(16 / 72);

/** Max image width ~300pt in pixels at 96dpi */
export const IMAGE_MAX_WIDTH_PX = 400;
export const IMAGE_MAX_HEIGHT_PX = 293;

/** pt → px at 96dpi */
export function ptToPx(pt: number): number {
  return Math.round((pt * 96) / 72);
}

export function scaleImageDimensions(
  naturalWidth: number,
  naturalHeight: number,
): { width: number; height: number } {
  const maxW = IMAGE_MAX_WIDTH_PX;
  const maxH = IMAGE_MAX_HEIGHT_PX;
  const ratio = naturalWidth / naturalHeight;

  let width = maxW;
  let height = Math.round(width / ratio);

  if (height > maxH) {
    height = maxH;
    width = Math.round(height * ratio);
  }

  return { width, height };
}
