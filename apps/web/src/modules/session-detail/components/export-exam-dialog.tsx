import { Button } from '@questgen/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@questgen/ui/components/dialog';
import { Field, FieldLabel } from '@questgen/ui/components/field';
import { Input } from '@questgen/ui/components/input';
import { useEffect, useId, useState } from 'react';

import type { SessionDetail } from '@/services/sessions/detail';

import {
  buildClassLabel,
  DEFAULT_DOCUMENT_TITLE,
  defaultSemester,
  type ExportExamInput,
} from '../export-exam-schema';

type ExportExamDialogProps = {
  variant: 'pdf' | 'docx';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionDetail;
  dirtyCount: number;
  isGenerating: boolean;
  onDownload: (input: ExportExamInput) => void;
  onPreview?: (input: ExportExamInput) => void;
};

function buildDefaultForm(session: SessionDetail): ExportExamInput {
  const { config, title } = session;
  return {
    documentTitle: DEFAULT_DOCUMENT_TITLE,
    schoolName: '',
    subject: title,
    classLabel: buildClassLabel(config.grade, config.classGrade),
    semester: defaultSemester(),
  };
}

function normalizeInput(form: ExportExamInput): ExportExamInput {
  return {
    ...form,
    documentTitle: form.documentTitle.trim(),
    schoolName: form.schoolName?.trim() || undefined,
    classLabel: form.classLabel?.trim() || undefined,
    semester: form.semester?.trim() || undefined,
  };
}

const COPY = {
  pdf: {
    title: 'Ekspor PDF',
    description:
      'Atur judul lembar soal dan identitas sekolah. Pratinjau atau unduh langsung.',
    download: 'Unduh PDF',
  },
  docx: {
    title: 'Ekspor DOCX',
    description:
      'Atur judul lembar soal dan identitas sekolah, lalu unduh dokumen Word.',
    download: 'Unduh DOCX',
  },
} as const;

export function ExportExamDialog({
  variant,
  open,
  onOpenChange,
  session,
  dirtyCount,
  isGenerating,
  onDownload,
  onPreview,
}: ExportExamDialogProps) {
  const formId = useId();
  const [form, setForm] = useState<ExportExamInput>(() =>
    buildDefaultForm(session),
  );
  const copy = COPY[variant];

  useEffect(() => {
    if (open) {
      setForm(buildDefaultForm(session));
    }
  }, [open, session]);

  const updateField = <K extends keyof ExportExamInput>(
    key: K,
    value: ExportExamInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (action: 'preview' | 'download') => {
    const input = normalizeInput(form);
    if (action === 'preview') {
      onPreview?.(input);
      return;
    }
    onDownload(input);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(85vh,720px)] w-[min(96vw,40rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-border border-b px-6 py-5">
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          {dirtyCount > 0 && (
            <div
              role="status"
              className="border border-accent/40 bg-accent/5 px-4 py-3 text-sm leading-relaxed"
            >
              Simpan perubahan dulu agar ekspor sesuai tampilan terbaru.
            </div>
          )}

          <form
            id={formId}
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (variant === 'pdf') {
                handleSubmit('preview');
                return;
              }
              handleSubmit('download');
            }}
          >
            <Field>
              <FieldLabel htmlFor="documentTitle">Judul Lembar Soal</FieldLabel>
              <Input
                id="documentTitle"
                value={form.documentTitle}
                onChange={(e) => updateField('documentTitle', e.target.value)}
                placeholder="Contoh: ULANGAN HARIAN"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="schoolName">Nama Sekolah</FieldLabel>
              <Input
                id="schoolName"
                value={form.schoolName ?? ''}
                onChange={(e) => updateField('schoolName', e.target.value)}
                placeholder="Tampil di kop kanan bawah setiap halaman"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="subject">Mata Pelajaran</FieldLabel>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="classLabel">Kelas</FieldLabel>
              <Input
                id="classLabel"
                value={form.classLabel ?? ''}
                onChange={(e) => updateField('classLabel', e.target.value)}
                placeholder="Contoh: Kelas 6"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="semester">Semester</FieldLabel>
              <Input
                id="semester"
                value={form.semester ?? ''}
                onChange={(e) => updateField('semester', e.target.value)}
                placeholder="Contoh: Semester Ganjil"
              />
            </Field>
          </form>
        </div>

        <DialogFooter className="shrink-0 border-border border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          {variant === 'pdf' && onPreview && (
            <Button
              type="submit"
              form={formId}
              variant="outline"
              disabled={isGenerating}
            >
              {isGenerating ? 'Memproses…' : 'Pratinjau'}
            </Button>
          )}
          <Button
            type={variant === 'docx' ? 'submit' : 'button'}
            form={variant === 'docx' ? formId : undefined}
            disabled={isGenerating}
            onClick={
              variant === 'pdf' ? () => handleSubmit('download') : undefined
            }
          >
            {isGenerating ? 'Memproses…' : copy.download}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
