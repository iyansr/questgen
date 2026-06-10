import { Spinner } from '@phosphor-icons/react';

import type { StreamedQuestion } from '@/types/session-message';

import { EmptyQuestions } from './empty-questions';
import { QuestionCard } from './question-card';

type QuestionListProps = {
	questions: StreamedQuestion[];
	status: 'pending' | 'generating' | 'completed' | 'failed';
	isStreaming: boolean;
	expectedCount: number | null;
};

export function QuestionList({
	questions,
	status,
	isStreaming,
	expectedCount,
}: QuestionListProps) {
	const showStreamingFooter =
		isStreaming && (status === 'pending' || status === 'generating');

	return (
		<section className="space-y-4">
			<header className="flex flex-wrap items-baseline justify-between gap-2">
				<div>
					<h2 className="font-serif text-2xl tracking-tight">Soal</h2>
					<p className="text-muted-foreground text-sm">
						Setiap soal muncul di sini begitu AI selesai membuatnya.
					</p>
				</div>
				{expectedCount !== null && (
					<p className="text-muted-foreground text-xs tabular-nums">
						<span className="font-medium text-foreground">
							{questions.length}
						</span>
						<span className="mx-1">/</span>
						<span>{expectedCount}</span>
					</p>
				)}
			</header>

			{questions.length === 0 ? (
				<EmptyQuestions status={status} />
			) : (
				<ol className="space-y-4">
					{questions.map((question, i) => (
						<li key={question.id}>
							<QuestionCard question={question} index={i} />
						</li>
					))}
				</ol>
			)}

			{showStreamingFooter && questions.length > 0 && (
				<div className="flex items-center gap-2 border border-border border-dashed px-4 py-3 text-muted-foreground text-xs">
					<Spinner className="size-3.5 animate-spin" weight="bold" />
					<span>Soal berikutnya sedang dibuat…</span>
				</div>
			)}
		</section>
	);
}
