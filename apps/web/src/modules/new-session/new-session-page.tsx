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
import { cn } from '@questgen/ui/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import {
  Controller,
  type FieldError,
  useController,
  useForm,
} from 'react-hook-form';
import { toast } from 'sonner';

import { useCreateSession } from '@/services/sessions/create';

import { CurriculumField } from './components/curriculum-field';
import { GradeClassField } from './components/grade-class-field';
import { QuestionTypesField } from './components/question-types-field';
import { SourceField } from './components/source-field';
import { TopicField } from './components/topic-field';
import {
  type NewSessionFormValues,
  newSessionFormSchema,
  totalCount,
} from './schema';

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

  const topic = form.watch('topic');
  const questionTypeCounts = form.watch('questionTypeCounts') ?? [];

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
  const { field: curriculumField, fieldState: curriculumState } = useController(
    {
      control: form.control,
      name: 'curriculum',
    },
  );
  const { field: gradeField, fieldState: gradeState } = useController({
    control: form.control,
    name: 'grade',
  });
  const { field: classGradeField, fieldState: classGradeState } = useController(
    {
      control: form.control,
      name: 'classGrade',
    },
  );

  const source = fileField.value
    ? 'file'
    : documentIdField.value
      ? 'document'
      : webQueryField.value
        ? 'web'
        : null;

  const sourceError: FieldError | undefined =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (form.formState.errors as any).source ??
    fileState.error ??
    documentIdState.error ??
    webQueryState.error;

  const hasQuestions = questionTypeCounts.length > 0;
  const totalQuestions = totalCount(questionTypeCounts);

  const canGenerate =
    topic.trim().length > 0 &&
    source !== null &&
    (source !== 'web' || (webQueryField.value?.trim() ?? '').length > 0) &&
    (source !== 'file' || fileField.value) &&
    (source !== 'document' || documentIdField.value) &&
    gradeField.value &&
    classGradeField.value &&
    curriculumField.value &&
    hasQuestions;

  // Progress steps: topic, source, grade+class, curriculum, questions
  const progressSteps = [
    topic.trim().length > 0,
    source !== null,
    Boolean(gradeField.value && classGradeField.value),
    Boolean(curriculumField.value),
    hasQuestions,
  ];

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
      {/* Header */}
      <header className="space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-bold text-[11px] text-primary uppercase tracking-widest">
          ✦ AI · Generator Soal
        </span>
        <h1 className="font-serif text-3xl leading-tight tracking-tight md:text-4xl">
          Buat Soal Ujian
          <br />
          <span className="text-primary">dalam Hitungan Detik</span>
        </h1>
        <p className="max-w-prose text-base text-muted-foreground leading-relaxed">
          Isi formulir di bawah untuk menghasilkan soal berkualitas tinggi,
          sesuai kurikulum dan jenjang kelas yang kamu pilih.
        </p>
      </header>

      {/* Progress indicator */}
      <div className="flex items-center gap-1.5">
        {progressSteps.map((done, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              done ? 'bg-primary' : 'bg-border',
            )}
          />
        ))}
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <FieldGroup>
          {/* 1. Topic */}
          <Controller
            control={form.control}
            name="topic"
            render={({ field, fieldState }) => (
              <TopicField field={field} error={fieldState.error} />
            )}
          />

          {/* 2. Source */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Sumber Materi</CardTitle>
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
                error={sourceError}
              />
            </CardContent>
          </Card>

          {/* 3. Jenjang & Kelas */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Jenjang & Kelas</CardTitle>
              <CardDescription>
                Pilih jenjang pendidikan dan kelas yang sesuai.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GradeClassField
                gradeField={gradeField}
                classGradeField={classGradeField}
                error={gradeState.error ?? classGradeState.error}
              />
            </CardContent>
          </Card>

          {/* 4. Kurikulum */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Kurikulum</CardTitle>
              <CardDescription>
                Pilih kurikulum yang digunakan sebagai acuan soal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CurriculumField
                field={curriculumField}
                error={curriculumState.error}
              />
            </CardContent>
          </Card>

          {/* 5. Question Types */}
          <Controller
            control={form.control}
            name="questionTypeCounts"
            render={({ field, fieldState }) => (
              <QuestionTypesField field={field} error={fieldState.error} />
            )}
          />
        </FieldGroup>

        {/* Generate button */}
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
            className={cn(
              'h-11 w-full gap-2 px-5 text-sm transition-all sm:w-auto',
              canGenerate &&
                'bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-primary/35 hover:shadow-xl',
            )}
            disabled={submitting || !canGenerate}
          >
            <Sparkle className="size-5" weight="fill" />
            {submitting ? 'Menyiapkan…' : 'Buat Soal'}
            {totalQuestions > 0 && !submitting && (
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 font-medium text-xs">
                {totalQuestions} soal
              </span>
            )}
            {!submitting && <ArrowRight className="size-5" />}
          </Button>
        </CardFooter>

        {!canGenerate && (
          <p className="text-center text-muted-foreground text-xs transition-opacity">
            Lengkapi semua bagian di atas untuk mengaktifkan tombol
          </p>
        )}
      </form>
    </div>
  );
}
