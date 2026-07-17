import { describe, expect, it } from 'vitest';

import { scrubImageLeadIns } from '@/modules/generation/scrub-image-lead-ins';

describe('scrubImageLeadIns', () => {
  it('strips common Indonesian image lead-ins', () => {
    expect(
      scrubImageLeadIns('Perhatikan gambar berikut. Apa fungsi kloroplas?'),
    ).toBe('Apa fungsi kloroplas?');
    expect(
      scrubImageLeadIns('Berdasarkan gambar di atas, hitung luasnya.'),
    ).toBe('hitung luasnya.');
    expect(scrubImageLeadIns('Lihat gambar: Manakah yang benar?')).toBe(
      'Manakah yang benar?',
    );
  });

  it('leaves text without lead-ins unchanged', () => {
    expect(scrubImageLeadIns('Jelaskan proses fotosintesis.')).toBe(
      'Jelaskan proses fotosintesis.',
    );
  });
});
