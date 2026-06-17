import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@questgen/ui/components/card';
import { FieldGroup } from '@questgen/ui/components/field';
import { useNavigate } from '@tanstack/react-router';
import {
	Controller,
	type FieldError,
	useController,
	useForm,
} from 'react-hook-form';
import { toast } from 'sonner';

import { useCreateSession } from '@/services/sessions/create';

import { QuestionTypesField } from './components/question-types-field';
import { SourceField } from './components/source-field';
import { TopicField } from './components/topic-field';
import { type NewSessionFormValues, newSessionFormSchema } from './schema';

export function NewSessionPage() {
	const navigate = useNavigate();
	const createSession = useCreateSession();

	const form = useForm<NewSessionFormValues>({
		resolver: zodResolver(newSessionFormSchema),
		mode: 'onChange',
		defaultValues: {
			topic: '',
			questionTypeCounts: [],
			file: undefined,
			documentId: undefined,
			webQuery: undefined,
			curriculum: undefined,
			grade: undefined,
			classGrade: undefined,
		},
	});

	const submitting = createSession.isPending;

	const { field: fileField, fieldState: fileState } = useController({
		control: form.control,
		name: 'file',
	});
	const { field: documentIdField, fieldState: documentIdState } = useController(
		{
			control: form.control,
			name: 'documentId',
		},
	);
	const { field: webQueryField, fieldState: webQueryState } = useController({
		control: form.control,
		name: 'webQuery',
	});
	const { field: curriculumField } = useController({
		control: form.control,
		name: 'curriculum',
	});
	const { field: gradeField } = useController({
		control: form.control,
		name: 'grade',
	});
	const { field: classGradeField } = useController({
		control: form.control,
		name: 'classGrade',
	});

	const sourceError: FieldError | undefined =
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(form.formState.errors as any).source ??
		fileState.error ??
		documentIdState.error ??
		webQueryState.error;

	async function onSubmit(values: NewSessionFormValues) {
		try {
			const { id } = await createSession.mutateAsync({
				topic: values.topic,
				questionTypeCounts: values.questionTypeCounts,
				file: values.file,
				documentId: values.documentId,
				webQuery: values.webQuery,
				curriculum: values.curriculum,
				grade: values.grade,
				classGrade: values.classGrade,
			});
			toast.success('Sesi berhasil dibuat.');
			navigate({ to: '/session/$id', params: { id } });
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Gagal membuat sesi baru',
			);
		}
	}

	return (
		<div className="mx-auto max-w-2xl space-y-8">
			<header className="space-y-2">
				<p className="text-muted-foreground text-sm uppercase tracking-widest">
					Sesi Baru
				</p>
				<h1 className="font-serif text-3xl tracking-tight md:text-4xl">
					Buat set soal baru
				</h1>
				<p className="max-w-prose text-base text-muted-foreground leading-relaxed">
					Tentukan topik dan jenis soal yang ingin dihasilkan. AI akan membuat
					soal berdasarkan materi yang Anda berikan.
				</p>
			</header>

			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-6"
				noValidate
			>
				<FieldGroup>
					<Controller
						control={form.control}
						name="topic"
						render={({ field, fieldState }) => (
							<TopicField field={field} error={fieldState.error} />
						)}
					/>

					<Card size="sm">
						<CardHeader>
							<CardTitle>Materi Sumber</CardTitle>
							<CardDescription>
								Pilih satu: unggah file, gunakan dokumen yang sudah ada, atau
								riset web.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<SourceField
								fileField={fileField}
								documentIdField={documentIdField}
								webQueryField={webQueryField}
								curriculumField={curriculumField}
								gradeField={gradeField}
								classGradeField={classGradeField}
								error={sourceError}
							/>
						</CardContent>
					</Card>

					<Controller
						control={form.control}
						name="questionTypeCounts"
						render={({ field, fieldState }) => (
							<QuestionTypesField field={field} error={fieldState.error} />
						)}
					/>
				</FieldGroup>

				<CardFooter className="flex-col gap-3 border-border border-t bg-transparent p-0 pt-4 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						size="lg"
						className="h-11 w-full sm:w-auto"
						onClick={() => form.reset()}
						disabled={submitting}
					>
						Atur Ulang
					</Button>
					<Button
						type="submit"
						size="lg"
						className="h-11 w-full gap-2 px-5 text-sm sm:w-auto"
						disabled={submitting}
					>
						<Sparkle className="size-5" weight="fill" />
						{submitting ? 'Menyiapkan…' : 'Buat Soal'}
						{!submitting && <ArrowRight className="size-5" />}
					</Button>
				</CardFooter>
			</form>
		</div>
	);
}
