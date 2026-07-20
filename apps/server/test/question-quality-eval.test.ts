import { describe, expect, it } from 'vitest';

import {
  fingerprintSet,
  structuralSimilarity,
  tagQuestion,
} from '../src/modules/generation/eval/fingerprint';
import {
  buildConceptualResearchAddon,
  buildSubjectGuidance,
  isConceptualScienceTopic,
  isQuantitativeTopic,
} from '../src/modules/generation/prompts/subject-guidance';

describe('fingerprint templates', () => {
  it('tags disebut / pasangan / pernyataan', () => {
    expect(
      tagQuestion({
        questionType: 'multiple_choice',
        questionText:
          'Bagian testis yang berperan dalam produksi sperma disebut ....',
        options: [
          { label: 'A', text: 'epididimis' },
          { label: 'B', text: 'vas deferens' },
          { label: 'C', text: 'vesikula' },
          { label: 'D', text: 'tubulus' },
        ],
      }).templateTags,
    ).toContain('disebut');

    expect(
      tagQuestion({
        questionType: 'multiple_choice',
        questionText:
          'Pasangan antara bagian alat reproduksi laki-laki dan fungsinya berikut ini yang benar adalah ....',
        options: [
          { label: 'A', text: 'skrotum berfungsi sebagai pembungkus testis' },
          { label: 'B', text: 'uretra tempat pematangan' },
          { label: 'C', text: 'vas deferens produksi' },
          { label: 'D', text: 'tubulus saluran keluar' },
        ],
      }).templateTags,
    ).toContain('pasangan');
  });

  it('scores identical sets near 100', () => {
    const qs = [
      {
        questionType: 'multiple_choice',
        questionText: 'Proses meluruhnya dinding rahim disebut ....',
        options: [
          { label: 'A', text: 'ovulasi' },
          { label: 'B', text: 'fertilisasi' },
          { label: 'C', text: 'implantasi' },
          { label: 'D', text: 'menstruasi' },
        ],
      },
    ];
    const score = structuralSimilarity(qs, qs).score;
    expect(score).toBeGreaterThan(95);
  });

  it('builds non-empty fingerprint for a small set', () => {
    const fp = fingerprintSet([
      {
        questionType: 'multiple_choice',
        questionText: 'Urutan tahapan pertumbuhan yang benar adalah ....',
        options: [
          { label: 'A', text: '2,1,3,4' },
          { label: 'B', text: '2,1,4,3' },
          { label: 'C', text: '3,2,1,4' },
          { label: 'D', text: '4,2,3,1' },
        ],
      },
    ]);
    expect(fp.templateHist.urutan).toBeGreaterThan(0);
    expect(fp.stemEllipsisRate).toBe(1);
  });
});

describe('subject guidance routing', () => {
  it('gives general conceptual guidance for any non-quant subject', () => {
    for (const topic of [
      'Nilai-Nilai Pancasila',
      'Interaksi Sosial dalam Masyarakat',
      'Teks Eksposisi',
      'Pergerakan Nasional Indonesia',
      'Sistem Reproduksi pada Manusia',
    ]) {
      const g = buildSubjectGuidance(topic, 'SMP', 'IX');
      expect(g).toMatch(/General assessment \/ Uji Kompetensi/);
      expect(g).toMatch(/do not force science metaphors/);
      expect(g).not.toMatch(/Prioritize problem-solving/);
      expect(isQuantitativeTopic(topic)).toBe(false);
    }
  });

  it('adds science extras only for IPA-like topics', () => {
    const ipa = buildSubjectGuidance(
      'Sistem Perkembangbiakan Tumbuhan dan Hewan',
      'SMP',
      'IX',
    );
    expect(ipa).toMatch(/Science-flavoured extras/);
    expect(isConceptualScienceTopic('Kemagnetan dan Pemanfaatannya')).toBe(
      true,
    );

    const ppkn = buildSubjectGuidance('Hak dan Kewajiban Warga Negara', 'SMP', 'VII');
    expect(ppkn).toMatch(/General assessment \/ Uji Kompetensi/);
    expect(ppkn).not.toMatch(/Science-flavoured extras/);
    expect(isConceptualScienceTopic('Hak dan Kewajiban Warga Negara')).toBe(
      false,
    );
  });

  it('keeps math topics quantitative', () => {
    expect(isQuantitativeTopic('Teorema Pythagoras')).toBe(true);
    expect(isConceptualScienceTopic('Teorema Pythagoras')).toBe(false);
    expect(isQuantitativeTopic('Pola Bilangan')).toBe(true);
    const g = buildSubjectGuidance('Persamaan Kuadrat', 'SMA', 'X');
    expect(g).toMatch(/Quantitative topic rules/);
  });

  it('research addon covers non-IPA conceptual topics', () => {
    const addon = buildConceptualResearchAddon('Demokrasi Pancasila');
    expect(addon.length).toBeGreaterThan(0);
    expect(addon).toMatch(/Assessment-ready facts/);
    expect(buildConceptualResearchAddon('Persamaan Kuadrat')).toBe('');
  });
});
