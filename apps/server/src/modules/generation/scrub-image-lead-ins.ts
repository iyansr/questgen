/** Lead-ins the model may emit even when no image is attached. */
const IMAGE_LEAD_IN_RE =
  /^(?:Perhatikan\s+gambar(?:\s+berikut)?|Berdasarkan\s+gambar(?:\s+di\s+atas)?|Amati\s+ilustrasi(?:\s+tersebut)?|Cermati\s+diagram(?:\s+berikut)?|Dari\s+grafik(?:\s+di\s+atas)?|Lihat\s+gambar(?:\s+berikut)?)[!.,:\s]*/i;

/**
 * Strip common Indonesian image lead-in openers from question/option text.
 * ponytail: phrase list covers known prompt examples; extend if new leaks appear.
 */
export function scrubImageLeadIns(text: string): string {
  let result = text.trim();
  // Repeat in case the model stacked multiple lead-ins.
  for (let i = 0; i < 3; i++) {
    const next = result.replace(IMAGE_LEAD_IN_RE, '').trim();
    if (next === result) break;
    result = next;
  }
  return result;
}
