import { Button } from '@questgen/ui/components/button';
import { Field, FieldError } from '@questgen/ui/components/field';
import { cn } from '@questgen/ui/lib/utils';
import { Check, ChevronDown, FileText, Globe, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type {
  ControllerRenderProps,
  FieldError as RHFFieldError,
} from 'react-hook-form';

import { ACCEPTED_DOCUMENT_MIME_TYPES } from '@questgen/db/document-types';
import {
  countPdfPages,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_PDF_PAGES,
} from '@questgen/db/upload-limits';

import { useReadyDocuments } from '@/services/documents/list';

import {
  MAX_WEB_QUERY_CHARS,
  MIN_WEB_QUERY_CHARS,
  type NewSessionFormValues,
} from '../schema';
import { DocumentPickerDialog } from './document-picker-dialog';

interface SourceFieldProps {
  fileField: ControllerRenderProps<NewSessionFormValues, 'file'>;
  documentIdField: ControllerRenderProps<NewSessionFormValues, 'documentId'>;
  webQueryField: ControllerRenderProps<NewSessionFormValues, 'webQuery'>;
  error?: RHFFieldError;
  onFileValidationError?: (message: string) => void;
  onFileValidationClear?: () => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SOURCES = [
  {
    id: 'file' as const,
    emoji: '📄',
    title: 'Unggah Dokumen',
    sub: 'PDF, DOCX, PPT, PPTX',
    icon: Upload,
  },
  {
    id: 'document' as const,
    emoji: '📚',
    title: 'Dokumen Tersimpan',
    sub: 'Pilih dari pustaka',
    icon: FileText,
  },
  {
    id: 'web' as const,
    emoji: '🌐',
    title: 'Pencarian Web',
    sub: 'Referensi online',
    icon: Globe,
  },
] as const;

export function SourceField({
  fileField,
  documentIdField,
  webQueryField,
  error,
  onFileValidationError,
  onFileValidationClear,
}: SourceFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: documentsData, isLoading: documentsLoading } =
    useReadyDocuments();
  const documents = documentsData?.items ?? [];

  const initialMode: 'file' | 'document' | 'web' | null = fileField.value
    ? 'file'
    : documentIdField.value
      ? 'document'
      : webQueryField.value
        ? 'web'
        : null;
  const [mode, setModeState] = useState<'file' | 'document' | 'web' | null>(
    initialMode,
  );

  const selectedDocument = documents.find(
    (d) => d.id === documentIdField.value,
  );

  function setMode(next: 'file' | 'document' | 'web') {
    if (next === mode) return;
    fileField.onChange(undefined);
    documentIdField.onChange(undefined);
    webQueryField.onChange(undefined);
    if (inputRef.current) inputRef.current.value = '';
    setModeState(next);
    if (next === 'document') setPickerOpen(true);
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onFileValidationError?.(
        `Ukuran file maksimal ${MAX_FILE_SIZE_MB} MB`,
      );
      return;
    }

    if (file.type === 'application/pdf') {
      const pageCount = countPdfPages(await file.arrayBuffer());
      if (pageCount > MAX_PDF_PAGES) {
        onFileValidationError?.(
          `PDF maksimal ${MAX_PDF_PAGES} halaman`,
        );
        return;
      }
    }

    onFileValidationClear?.();
    documentIdField.onChange(undefined);
    webQueryField.onChange(undefined);
    fileField.onChange(file);
    setModeState('file');
  }

  function clearFile() {
    fileField.onChange(undefined);
    onFileValidationClear?.();
    if (inputRef.current) inputRef.current.value = '';
  }

  function selectDocument(id: string) {
    fileField.onChange(undefined);
    if (inputRef.current) inputRef.current.value = '';
    webQueryField.onChange(undefined);
    documentIdField.onChange(id);
    setModeState('document');
  }

  return (
    <Field
      data-invalid={Boolean(error)}
      aria-describedby={error ? 'source-error' : undefined}
    >
      {/* Source selection cards */}
      <div className="mb-3 grid grid-cols-3 gap-2.5">
        {SOURCES.map((src) => {
          const isActive = mode === src.id;
          return (
            <Button
              key={src.id}
              type="button"
              variant="outline"
              onClick={() => setMode(src.id)}
              className={cn(
                'flex h-auto flex-col items-center gap-1 rounded-xl px-2 py-3.5 text-center',
                'whitespace-normal',
                isActive
                  ? 'border-primary bg-primary/5 hover:bg-primary/5'
                  : 'border-input bg-background hover:border-primary/40 hover:bg-primary/5',
              )}
            >
              <span className="text-xl">{src.emoji}</span>
              <span
                className={cn(
                  'font-semibold text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-foreground',
                )}
              >
                {src.title}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {src.sub}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Upload zone */}
      {mode === 'file' && (
        <div className="fade-in slide-in-from-top-1 animate-in">
          {fileField.value ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-green-100 dark:bg-green-900">
                <FileText className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-green-700 text-sm dark:text-green-300">
                  {fileField.value.name}
                </p>
                <p className="text-green-600/70 text-xs dark:text-green-400/70">
                  {formatFileSize(fileField.value.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={clearFile}
                aria-label="Hapus file"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              aria-describedby="source-file-help"
              className={cn(
                'flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-primary/30 border-dashed bg-primary/5 px-4 text-sm',
                'hover:border-primary/50 hover:bg-primary/10 hover:text-inherit',
              )}
            >
              <span className="text-2xl">☁️</span>
              <span className="font-semibold text-primary">
                Seret file ke sini, atau klik untuk pilih
              </span>
              <span
                id="source-file-help"
                className="text-muted-foreground text-xs"
              >
                PDF · DOCX · PPT · PPTX &nbsp;·&nbsp; Maks. {MAX_FILE_SIZE_MB}{' '}
                MB · PDF maks. {MAX_PDF_PAGES} halaman
              </span>
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_DOCUMENT_MIME_TYPES}
            onChange={handleFileChange}
            className="sr-only"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Existing documents */}
      {mode === 'document' && (
        <div className="fade-in slide-in-from-top-1 animate-in">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className={cn(
              'flex h-11 w-full justify-between rounded-lg px-4 text-sm',
              'hover:bg-muted/50',
            )}
          >
            <span
              className={cn(
                'flex items-center gap-2 truncate',
                !selectedDocument && 'text-muted-foreground',
              )}
            >
              <FileText className="size-4 shrink-0" />
              <span className="truncate">
                {selectedDocument
                  ? selectedDocument.filename
                  : documentsLoading
                    ? 'Memuat dokumen…'
                    : 'Pilih dokumen'}
              </span>
            </span>
            {selectedDocument && (
              <Check className="size-4 shrink-0 text-primary" />
            )}
            {!selectedDocument && (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            )}
          </Button>
        </div>
      )}

      {/* Web query */}
      {mode === 'web' && (
        <div className="fade-in slide-in-from-top-1 animate-in space-y-3">
          <div>
            <label className="mb-1.5 block font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Kata Kunci Pencarian <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={webQueryField.value ?? ''}
                onChange={(e) => webQueryField.onChange(e.target.value)}
                onBlur={webQueryField.onBlur}
                placeholder="Masukkan kata kunci referensi dari internet…"
                maxLength={MAX_WEB_QUERY_CHARS}
                className={cn(
                  'h-10 w-full rounded-lg border bg-background py-2 pr-3 pl-9 text-sm outline-none transition-colors',
                  'placeholder:text-muted-foreground',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  webQueryField.value?.trim()
                    ? 'border-primary bg-primary/5'
                    : 'border-input',
                )}
              />
            </div>
            <p className="mt-2 flex items-start gap-1.5 rounded-md bg-primary/5 px-3 py-2 text-muted-foreground text-xs">
              <span>💡</span>
              <span>
                Kata kunci ini <strong>berbeda dari topik soal</strong> —
                digunakan khusus untuk mencari referensi dari internet sebagai
                bahan pembuat soal. · minimal {MIN_WEB_QUERY_CHARS} karakter
              </span>
            </p>
          </div>
        </div>
      )}

      <DocumentPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={documentIdField.value}
        onSelect={selectDocument}
      />

      {error && <FieldError id="source-error" errors={[error]} />}
    </Field>
  );
}
