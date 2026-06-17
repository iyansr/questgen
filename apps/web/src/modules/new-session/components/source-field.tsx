import { Button } from '@questgen/ui/components/button';
import { Field, FieldError } from '@questgen/ui/components/field';
import { cn } from '@questgen/ui/lib/utils';
import { Check, ChevronDown, FileText, Globe, Upload, X } from 'lucide-react';
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

	const tabs: { id: 'file' | 'document' | 'web'; label: string; icon: React.ReactNode }[] = [
		{ id: 'file', label: 'Unggah File', icon: <Upload className="size-4" /> },
		{ id: 'document', label: 'Dari Dokumen', icon: <FileText className="size-4" /> },
		{ id: 'web', label: 'Riset Web', icon: <Globe className="size-4" /> },
	];

	return (
		<Field
			data-invalid={Boolean(error)}
			aria-describedby={error ? 'source-error' : undefined}
		>
			<div
				role="tablist"
				aria-label="Sumber Materi"
				className="grid grid-cols-3 gap-0 border border-input"
			>
				{tabs.map((tab, index) => {
					const isActive = mode === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							aria-controls={`source-panel-${tab.id}`}
							onClick={() => setMode(tab.id)}
							className={cn(
								'flex h-11 items-center justify-center gap-2 px-4 text-sm transition-colors',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
								'border-input border-b-2',
								index < tabs.length - 1 && 'border-r',
								isActive
									? 'bg-foreground font-semibold text-background hover:bg-foreground border-background'
									: 'hover:bg-muted border-transparent',
							)}
						>
							{isActive && <Check className="size-4" aria-hidden="true" />}
							{!isActive && tab.icon}
							{tab.label}
						</button>
					);
				})}
			</div>

			{mode === 'file' && (
				<div
					id="source-panel-file"
					role="tabpanel"
					aria-label="Unggah File"
					className="border border-input border-t-0"
				>
					{fileField.value ? (
						<div className="flex items-center gap-3 px-4 py-3">
							<div className="flex size-10 shrink-0 items-center justify-center bg-muted">
								<FileText className="size-5 text-muted-foreground" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-sm">
									{fileField.value.name}
								</p>
								<p className="text-muted-foreground text-xs">
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
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							aria-describedby="source-file-help"
							className={cn(
								'flex h-24 w-full flex-col items-center justify-center gap-1.5 px-4 text-sm text-muted-foreground transition-colors',
								'hover:bg-muted hover:text-foreground',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
							)}
						>
							<Upload className="size-5" />
							<span>Pilih file (PDF, DOCX)</span>
							<span id="source-file-help" className="text-xs">
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
					id="source-panel-document"
					role="tabpanel"
					aria-label="Dari Dokumen"
					type="button"
					onClick={() => setPickerOpen(true)}
					className={cn(
						'flex h-11 w-full items-center justify-between border border-input border-t-0 bg-transparent px-4 text-sm transition-colors',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
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
					<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
				</button>
			)}

			{mode === 'web' && (
				<div
					id="source-panel-web"
					role="tabpanel"
					aria-label="Riset Web"
					className="space-y-3 border border-input border-t-0 p-4"
				>
					<div className="space-y-1.5">
						<input
							type="text"
							value={webQueryField.value ?? ''}
							onChange={(e) => webQueryField.onChange(e.target.value)}
							onBlur={webQueryField.onBlur}
							placeholder="misal: fotosintesis pada tumbuhan tingkat tinggi"
							maxLength={MAX_WEB_QUERY_CHARS}
							aria-describedby="source-web-help"
							className={cn(
								'w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground',
								'h-10 px-0',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
							)}
						/>
						<p
							id="source-web-help"
							className="text-xs text-muted-foreground"
						>
							AI akan meneliti web menggunakan kata kunci ini · minimal{' '}
							{MIN_WEB_QUERY_CHARS} karakter
						</p>
					</div>
				</div>
			)}

			{mode === 'web' && (
				<div className="space-y-3 border border-input border-t-0 p-4">
					<p className="text-sm font-medium text-muted-foreground">
						Detail Kelas
					</p>
					<div className="grid grid-cols-3 gap-2">
						<div className="space-y-1">
							<label className="text-sm font-medium text-muted-foreground">
								Kurikulum
							</label>
							<select
								value={curriculumField.value ?? ''}
								onChange={(e) =>
									curriculumField.onChange(e.target.value || undefined)
								}
								onBlur={curriculumField.onBlur}
								className={cn(
									'h-10 w-full appearance-none rounded-none border border-input bg-transparent px-2 text-sm outline-none transition-colors',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
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
							<label className="text-sm font-medium text-muted-foreground">
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
									'h-10 w-full appearance-none rounded-none border border-input bg-transparent px-2 text-sm outline-none transition-colors',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
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
							<label className="text-sm font-medium text-muted-foreground">
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
									'h-10 w-full appearance-none rounded-none border border-input bg-transparent px-2 text-sm outline-none transition-colors',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
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
