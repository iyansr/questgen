import { zodResolver } from '@hookform/resolvers/zod';
import {
  FloppyDisk,
  Image as ImageIcon,
  PencilSimple,
  Trash,
  UploadSimple,
  X,
} from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@questgen/ui/components/dialog';
import { Field, FieldError, FieldLabel } from '@questgen/ui/components/field';
import { Input } from '@questgen/ui/components/input';
import { cn } from '@questgen/ui/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { QUESTION_TYPE_LABELS } from '@/modules/new-session/schema';
import type { QuestionPatch } from '@/services/sessions/update-questions';
import type { QuestionOption, StreamedQuestion } from '@/types/session-message';

import { RichTextEditorField } from './rich-text-editor-field';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

const optionSchema = z.object({
  label: z.string().min(1).max(2),
  text: z.string().trim().min(1, 'Teks opsi wajib diisi'),
});

const editSchema = z
  .object({
    questionText: z.string().trim().min(1, 'Teks soal wajib diisi'),
    options: z.array(optionSchema).nullable(),
    correctAnswer: z.string().trim().min(1, 'Jawaban wajib diisi'),
    suggestedAnswer: z.string().trim().nullable(),
  })
  .refine(
    (d) => {
      if (!d.options) return true;
      const labels = d.options.map((o) => o.label.toUpperCase());
      return labels.includes(d.correctAnswer.trim().toUpperCase());
    },
    { message: 'Pilih label opsi yang benar', path: ['correctAnswer'] },
  )
  .refine(
    (d) => {
      if (!d.options) return true;
      const labels = d.options.map((o) => o.label.toUpperCase());
      return new Set(labels).size === labels.length;
    },
    { message: 'Label opsi tidak boleh duplikat', path: ['options'] },
  );

type EditFormValues = z.infer<typeof editSchema>;

export type EditQuestionSubmitPayload = {
  patch: QuestionPatch;
  imageFile: File | null;
  removeImage: boolean;
};

type EditQuestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: StreamedQuestion | null;
  onApply: (payload: EditQuestionSubmitPayload) => void;
};

const TRUE_FALSE_OPTIONS: QuestionOption[] = [
  { label: 'A', text: 'Benar' },
  { label: 'B', text: 'Salah' },
];

function isMultipleChoice(type: StreamedQuestion['questionType']): boolean {
  return type === 'multiple_choice' || type === 'true_false';
}

function defaultOptionsFor(
  type: StreamedQuestion['questionType'],
  existing: QuestionOption[] | null,
): QuestionOption[] {
  if (type === 'true_false') return TRUE_FALSE_OPTIONS;
  if (existing && existing.length > 0) return existing;
  return [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EditQuestionDialog({
  open,
  onOpenChange,
  question,
  onApply,
}: EditQuestionDialogProps) {
  const isMc = question ? isMultipleChoice(question.questionType) : false;
  const defaultOptions = useMemo(
    () =>
      question
        ? defaultOptionsFor(question.questionType, question.options)
        : [],
    [question],
  );

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    mode: 'onBlur',
    defaultValues: {
      questionText: question?.questionText ?? '',
      options: isMc ? defaultOptions : null,
      correctAnswer: question?.correctAnswer ?? '',
      suggestedAnswer: question?.suggestedAnswer ?? '',
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open || !question) return;
    form.reset({
      questionText: question.questionText,
      options: isMultipleChoice(question.questionType)
        ? defaultOptionsFor(question.questionType, question.options)
        : null,
      correctAnswer: question.correctAnswer,
      suggestedAnswer: question.suggestedAnswer ?? '',
    });
    setImageFile(null);
    setImagePreview(question.imageUrl);
    setRemoveImage(false);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    question?.id,
    question?.options,
    question?.suggestedAnswer,
    question?.imageUrl,
    form.reset,
    question?.questionText,
    question?.questionType,
    question?.correctAnswer,
    question,
  ]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Format gambar harus PNG, JPEG, WEBP, atau GIF.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`Ukuran gambar maksimal ${formatBytes(MAX_IMAGE_BYTES)}.`);
      event.target.value = '';
      return;
    }
    setImageError(null);
    setRemoveImage(false);
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit(values: EditFormValues) {
    if (!question) return;
    const patch: QuestionPatch = {
      id: question.id,
      questionText: values.questionText,
      options: isMc ? values.options : null,
      correctAnswer: values.correctAnswer,
      suggestedAnswer: values.suggestedAnswer ? values.suggestedAnswer : null,
      removeImage: !imageFile && removeImage ? true : undefined,
    };
    onApply({
      patch,
      imageFile,
      removeImage: !imageFile && removeImage,
    });
    onOpenChange(false);
  }

  if (!question) return null;
  const typeLabel =
    QUESTION_TYPE_LABELS[question.questionType] ?? question.questionType;
  const isTf = question.questionType === 'true_false';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <PencilSimple
              className="size-4 text-muted-foreground"
              weight="regular"
              aria-hidden
            />
            <p className="text-muted-foreground text-sm uppercase tracking-wide">
              Edit Soal
            </p>
          </div>
          <DialogTitle className="font-serif text-lg">{typeLabel}</DialogTitle>
          <DialogDescription className="text-base">
            Perubahan disimpan saat Anda menekan tombol simpan di daftar soal.
          </DialogDescription>
        </DialogHeader>

        <form
          id={`edit-question-${question.id}`}
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
          noValidate
        >
          <Controller
            control={form.control}
            name="questionText"
            render={({ field, fieldState }) => (
              <Field data-invalid={Boolean(fieldState.error)}>
                <FieldLabel htmlFor="edit-question-text">Teks Soal</FieldLabel>
                <RichTextEditorField
                  id="edit-question-text"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(fieldState.error)}
                  minHeight={160}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Field>
            <FieldLabel>Gambar (opsional)</FieldLabel>
            {imagePreview ? (
              <div className="flex flex-col gap-2 border border-border">
                <img
                  src={imagePreview}
                  alt="Pratinjau gambar soal"
                  className="max-h-72 w-full object-contain"
                />
                <div className="flex items-center justify-between gap-2 border-border border-t px-3 py-2">
                  <p className="truncate text-muted-foreground text-sm">
                    {imageFile
                      ? `${imageFile.name} · ${formatBytes(imageFile.size)}`
                      : 'Gambar saat ini'}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadSimple weight="bold" aria-hidden />
                      Ganti
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <Trash weight="bold" aria-hidden />
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-28 w-full flex-col items-center justify-center gap-2 border border-input border-dashed text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:border-foreground focus-visible:outline-none"
              >
                <ImageIcon className="size-5" weight="regular" aria-hidden />
                <span>Pilih gambar (PNG, JPEG, WEBP, GIF)</span>
                <span className="text-xs">
                  Maksimal {formatBytes(MAX_IMAGE_BYTES)}
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              id={`edit-image-${question.id}`}
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleImageChange}
              className="sr-only"
              aria-label="Pilih gambar soal"
            />
            {imageError && <FieldError>{imageError}</FieldError>}
          </Field>

          {isMc ? (
            <Controller
              control={form.control}
              name="options"
              render={({ field, fieldState }) => (
                <Field data-invalid={Boolean(fieldState.error)}>
                  <div className="flex items-baseline justify-between">
                    <FieldLabel>Opsi Jawaban</FieldLabel>
                    {!isTf && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const current = form.getValues('options') ?? [];
                          const nextLabel = String.fromCharCode(
                            65 + current.length,
                          );
                          if (nextLabel > 'L') return;
                          field.onChange([
                            ...current,
                            { label: nextLabel, text: '' },
                          ]);
                        }}
                        disabled={(form.watch('options')?.length ?? 0) >= 12}
                      >
                        Tambah opsi
                      </Button>
                    )}
                  </div>
                  <ol className="flex flex-col gap-2">
                    {(field.value ?? []).map((opt, index) => (
                      <li
                        key={`${opt.label}-${index}`}
                        className="flex items-center gap-2"
                      >
                        <span
                          aria-hidden
                          className="flex size-7 shrink-0 items-center justify-center border border-border font-mono text-sm"
                        >
                          {opt.label}
                        </span>
                        <Input
                          id={`edit-option-${question.id}-${opt.label}`}
                          value={opt.text}
                          onChange={(e) => {
                            const next = [...(field.value ?? [])];
                            next[index] = {
                              ...opt,
                              text: e.target.value,
                            };
                            field.onChange(next);
                          }}
                          placeholder={
                            isTf ? opt.text : `Teks opsi ${opt.label}`
                          }
                          disabled={isTf}
                          className="flex-1"
                        />
                        {!isTf && (field.value?.length ?? 0) > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus opsi ${opt.label}`}
                            onClick={() => {
                              const next = (field.value ?? []).filter(
                                (_, i) => i !== index,
                              );
                              field.onChange(next);
                            }}
                          >
                            <X className="size-4" aria-hidden />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ol>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          ) : null}

          {isMc ? (
            <Controller
              control={form.control}
              name="correctAnswer"
              render={({ field, fieldState }) => (
                <Field data-invalid={Boolean(fieldState.error)}>
                  <FieldLabel>Jawaban Benar</FieldLabel>
                  <div
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    role="radiogroup"
                    aria-label="Pilih jawaban benar"
                  >
                    {(form.watch('options') ?? []).map((opt) => {
                      const selected =
                        field.value.trim().toUpperCase() ===
                        opt.label.toUpperCase();
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(opt.label)}
                          className={cn(
                            'flex items-center justify-center gap-2 border border-input px-3 py-3 text-sm transition-colors hover:bg-muted focus-visible:border-foreground focus-visible:outline-none',
                            selected &&
                              'border-foreground bg-foreground font-semibold text-background hover:bg-foreground',
                          )}
                        >
                          <span className="font-mono">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          ) : (
            <Controller
              control={form.control}
              name="correctAnswer"
              render={({ field, fieldState }) => (
                <Field data-invalid={Boolean(fieldState.error)}>
                  <FieldLabel htmlFor="edit-correct-answer">Jawaban</FieldLabel>
                  <RichTextEditorField
                    id="edit-correct-answer"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(fieldState.error)}
                    minHeight={120}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}

          <Controller
            control={form.control}
            name="suggestedAnswer"
            render={({ field, fieldState }) => (
              <Field data-invalid={Boolean(fieldState.error)}>
                <FieldLabel htmlFor="edit-suggested-answer">
                  Penjelasan (opsional)
                </FieldLabel>
                <RichTextEditorField
                  id="edit-suggested-answer"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(fieldState.error)}
                  minHeight={120}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </form>

        <DialogFooter className="border-border border-t pt-4">
          <DialogClose
            render={<Button type="button" variant="ghost" size="default" />}
          >
            Batal
          </DialogClose>
          <Button
            type="submit"
            size="default"
            form={`edit-question-${question.id}`}
            disabled={form.formState.isSubmitting}
          >
            <FloppyDisk weight="bold" aria-hidden />
            Simpan ke Daftar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
