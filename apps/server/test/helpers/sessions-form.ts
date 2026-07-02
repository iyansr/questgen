const DEFAULT_COUNTS = JSON.stringify([{ type: 'multiple_choice', count: 2 }]);

export function webSessionForm(
  overrides: Record<string, string | undefined> = {},
): FormData {
  const fd = new FormData();
  fd.set('topic', overrides.topic ?? 'Matematika Dasar');
  fd.set('questionTypeCounts', overrides.questionTypeCounts ?? DEFAULT_COUNTS);
  fd.set('webQuery', overrides.webQuery ?? 'persamaan kuadrat');
  fd.set('curriculum', overrides.curriculum ?? 'Kurikulum Merdeka');
  fd.set('grade', overrides.grade ?? 'SMA');
  fd.set('classGrade', overrides.classGrade ?? 'X IPA 1');

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      fd.delete(key);
    } else if (
      ![
        'topic',
        'questionTypeCounts',
        'webQuery',
        'curriculum',
        'grade',
        'classGrade',
      ].includes(key)
    ) {
      fd.set(key, value);
    }
  }

  return fd;
}

export function fileSessionForm(file: File): FormData {
  const fd = new FormData();
  fd.set('topic', 'Dokumen Soal');
  fd.set('questionTypeCounts', DEFAULT_COUNTS);
  fd.set('file', file);
  return fd;
}

export function documentSessionForm(documentId: string): FormData {
  const fd = new FormData();
  fd.set('topic', 'Dari Dokumen');
  fd.set('questionTypeCounts', DEFAULT_COUNTS);
  fd.set('documentId', documentId);
  return fd;
}
