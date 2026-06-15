import { Button } from '@questgen/ui/components/button';
import { Field, FieldError, FieldLabel } from '@questgen/ui/components/field';
import { cn } from '@questgen/ui/lib/utils';
import { ChevronDown, FileText, Globe, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type {
	ControllerRenderProps,
	FieldError as RHFFieldError,
} from 'react-hook-form';

import { useReadyDocuments } from '@/services/documents/list';

import {
	CLASS_GRADE_OPTIONS,
	CURRICULUM_OPTIONS,
	GRADE_OPTIONS,
	MAX_FILE_SIZE_BYTES,
	MAX_FILE_SIZE_MB,
	MAX_PDF_PAGES,
	MAX_WEB_QUERY_CHARS,
	MIN_WEB_QUERY_CHARS,
	type NewSessionFormValues,
} from '../schema';
import { DocumentPickerDialog } from './document-picker-dialog';

const ACCEPTED_FILE_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',');

interface SourceFieldProps {
	fileField: ControllerRenderProps<NewSessionFormValues, 'file'>;
	documentIdField: ControllerRenderProps<NewSessionFormValues, 'documentId'>;
	webQueryField: ControllerRenderProps<NewSessionFormValues, 'webQuery'>;
	curriculumField: ControllerRenderProps<NewSessionFormValues, 'curriculum'>;
	gradeField: ControllerRenderProps<NewSessionFormValues, 'grade'>;
	classGradeField: ControllerRenderProps<NewSessionFormValues, 'classGrade'>;
	error?: RHFFieldError;
}

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SourceField({
	fileField,
	documentIdField,
	webQueryField,
	curriculumField,
	gradeField,
	classGradeField,
	error,
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

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;
		if (file.size > MAX_FILE_SIZE_BYTES) {
			event.target.value = '';
			return;
		}
		documentIdField.onChange(undefined);
		webQueryField.onChange(undefined);
		fileField.onChange(file);
		setModeState('file');
	}

	function clearFile() {
		fileField.onChange(undefined);
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
		<Field data-invalid={Boolean(error)}>
			<FieldLabel>Sumber Materi</FieldLabel>

			<div className="grid grid-cols-3 gap-0 border border-input">
				<button
					type="button"
					onClick={() => setMode('file')}
					aria-pressed={mode === 'file'}
					className={cn(
						'flex h-9 items-center justify-center gap-2 px-3 text-xs transition-colors hover:bg-muted',
						'border-input border-r',
						mode === 'file' &&
							'bg-foreground font-medium text-background hover:bg-foreground',
					)}
				>
					<Upload className="size-3.5" />
					Unggah File
				</button>
				<button
					type="button"
					onClick={() => setMode('document')}
					aria-pressed={mode === 'document'}
					className={cn(
						'flex h-9 items-center justify-center gap-2 px-3 text-xs transition-colors hover:bg-muted',
						'border-input border-r',
						mode === 'document' &&
							'bg-foreground font-medium text-background hover:bg-foreground',
					)}
				>
					<FileText className="size-3.5" />
					Dari Dokumen
				</button>
				<button
					type="button"
					onClick={() => setMode('web')}
					aria-pressed={mode === 'web'}
					className={cn(
						'flex h-9 items-center justify-center gap-2 px-3 text-xs transition-colors hover:bg-muted',
						mode === 'web' &&
							'bg-foreground font-medium text-background hover:bg-foreground',
					)}
				>
					<Globe className="size-3.5" />
					Riset Web
				</button>
			</div>

			{mode === 'file' && (
				<div className="border border-input border-t-0">
					{fileField.value ? (
						<div className="flex items-center gap-3 px-3 py-2.5">
							<div className="flex size-8 shrink-0 items-center justify-center bg-muted">
								<FileText className="size-4 text-muted-foreground" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-xs">
									{fileField.value.name}
								</p>
								<p className="text-muted-foreground text-xs">
									{formatFileSize(fileField.value.size)}
								</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={clearFile}
								aria-label="Hapus file"
							>
								<X className="size-3.5" />
							</Button>
						</div>
					) : (
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							className="flex h-20 w-full flex-col items-center justify-center gap-1 px-3 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
						>
							<Upload className="size-4" />
							<span>Pilih file (PDF, DOCX)</span>
							<span className="text-[10px]">
								Maksimal {MAX_FILE_SIZE_MB} MB · PDF maks. {MAX_PDF_PAGES}{' '}
								halaman
							</span>
						</button>
					)}
					<input
						ref={inputRef}
						type="file"
						accept={ACCEPTED_FILE_TYPES}
						onChange={handleFileChange}
						className="sr-only"
						aria-hidden="true"
					/>
				</div>
			)}

			{mode === 'document' && (
				<button
					type="button"
					onClick={() => setPickerOpen(true)}
					className={cn(
						'flex h-10 w-full items-center justify-between border border-input border-t-0 bg-transparent px-3 text-xs transition-colors hover:bg-muted',
						'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50',
					)}
				>
					<span
						className={cn(
							'flex items-center gap-2 truncate',
							!selectedDocument && 'text-muted-foreground',
						)}
					>
						<FileText className="size-3.5 shrink-0" />
						<span className="truncate">
							{selectedDocument
								? selectedDocument.filename
								: documentsLoading
									? 'Memuat dokumen…'
									: 'Pilih dokumen'}
						</span>
					</span>
					<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
				</button>
			)}

			{mode === 'web' && (
				<div className="space-y-3 border border-input border-t-0 p-3">
					<div className="space-y-1.5">
						<input
							type="text"
							value={webQueryField.value ?? ''}
							onChange={(e) => webQueryField.onChange(e.target.value)}
							onBlur={webQueryField.onBlur}
							placeholder="misal: fotosintesis pada tumbuhan tingkat tinggi"
							maxLength={MAX_WEB_QUERY_CHARS}
							className={cn(
								'w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground',
								'h-9 px-0',
							)}
						/>
						<p className="text-[10px] text-muted-foreground">
							AI akan meneliti web menggunakan kata kunci ini · minimal{' '}
							{MIN_WEB_QUERY_CHARS} karakter
						</p>
					</div>
				</div>
			)}

			<div className="space-y-3 border border-input border-t-0 p-3">
				<p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
					Detail Kelas (wajib untuk riset web)
				</p>
				<div className="grid grid-cols-3 gap-2">
					<div className="space-y-1">
						<label className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
							Kurikulum
						</label>
						<select
							value={curriculumField.value ?? ''}
							onChange={(e) =>
								curriculumField.onChange(e.target.value || undefined)
							}
							onBlur={curriculumField.onBlur}
							className={cn(
								'h-8 w-full appearance-none rounded-none border border-input bg-transparent px-2 text-xs outline-none transition-colors',
								'focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50',
								!curriculumField.value && 'text-muted-foreground',
							)}
						>
							<option value="">Pilih</option>
							{CURRICULUM_OPTIONS.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-1">
						<label className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
							Jenjang
						</label>
						<select
							value={gradeField.value ?? ''}
							onChange={(e) => {
								gradeField.onChange(e.target.value || undefined);
								classGradeField.onChange(undefined);
							}}
							onBlur={gradeField.onBlur}
							className={cn(
								'h-8 w-full appearance-none rounded-none border border-input bg-transparent px-2 text-xs outline-none transition-colors',
								'focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50',
								!gradeField.value && 'text-muted-foreground',
							)}
						>
							<option value="">Pilih</option>
							{GRADE_OPTIONS.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-1">
						<label className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
							Kelas
						</label>
						<select
							value={classGradeField.value ?? ''}
							onChange={(e) =>
								classGradeField.onChange(e.target.value || undefined)
							}
							onBlur={classGradeField.onBlur}
							disabled={!gradeField.value}
							className={cn(
								'h-8 w-full appearance-none rounded-none border border-input bg-transparent px-2 text-xs outline-none transition-colors',
								'focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50',
								'disabled:pointer-events-none disabled:opacity-50',
								!classGradeField.value && 'text-muted-foreground',
							)}
						>
							<option value="">Pilih</option>
							{(gradeField.value
								? (CLASS_GRADE_OPTIONS[gradeField.value] ?? [])
								: []
							).map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			<DocumentPickerDialog
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				value={documentIdField.value}
				onSelect={selectDocument}
			/>

			{error && <FieldError errors={[error]} />}
		</Field>
	);
}
