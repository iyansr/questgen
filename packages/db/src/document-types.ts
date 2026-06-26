export const DOCUMENT_FILE_TYPES = [
  'pdf',
  'docx',
  'ppt',
  'pptx',
] as const;

export type DocumentFileType = (typeof DOCUMENT_FILE_TYPES)[number];

export const MIME_BY_FILE_TYPE: Record<DocumentFileType, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export const ALLOWED_DOCUMENT_MIME_TYPES = Object.values(
  MIME_BY_FILE_TYPE,
) as [
  (typeof MIME_BY_FILE_TYPE)['pdf'],
  (typeof MIME_BY_FILE_TYPE)['docx'],
  (typeof MIME_BY_FILE_TYPE)['ppt'],
  (typeof MIME_BY_FILE_TYPE)['pptx'],
];

const MIME_TO_FILE_TYPE = Object.fromEntries(
  Object.entries(MIME_BY_FILE_TYPE).map(([fileType, mime]) => [
    mime,
    fileType,
  ]),
) as Record<string, DocumentFileType>;

export function mimeToDocumentFileType(
  mime: string,
): DocumentFileType | undefined {
  return MIME_TO_FILE_TYPE[mime];
}

export const ACCEPTED_DOCUMENT_MIME_TYPES = ALLOWED_DOCUMENT_MIME_TYPES.join(
  ',',
);
