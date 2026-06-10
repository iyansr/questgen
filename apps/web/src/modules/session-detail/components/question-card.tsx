import { Check, Eye, EyeSlash } from '@phosphor-icons/react';
import { cn } from '@questgen/ui/lib/utils';
import { useState } from 'react';

import {
	QUESTION_TYPE_LABELS,
	type QuestionType,
} from '@/modules/new-session/schema';
import type { StreamedQuestion } from '@/types/session-message';

type QuestionCardProps = {
	question: StreamedQuestion;
	index: number;
};

function isMultipleChoice(type: QuestionType): boolean {
	return type === 'multiple_choice' || type === 'true_false';
}

function findCorrectOptionLabel(
	options: StreamedQuestion['options'],
	correctAnswer: string,
): string | null {
	if (!options || options.length === 0) return null;
	const match = options.find(
		(o) =>
			o.label.toUpperCase() === correctAnswer.trim().toUpperCase() ||
			o.text.trim() === correctAnswer.trim(),
	);
	return match?.label ?? null;
}

export function QuestionCard({ question, index }: QuestionCardProps) {
	const [revealed, setRevealed] = useState(true);

	const showOptions = isMultipleChoice(question.questionType);
	const correctOptionLabel = showOptions
		? findCorrectOptionLabel(question.options, question.correctAnswer)
		: null;

	return (
		<article className="border border-border bg-card">
			<header className="flex flex-wrap items-baseline justify-between gap-2 border-border border-b px-5 py-3">
				<div className="flex items-baseline gap-3">
					<span className="font-mono text-muted-foreground text-xs tabular-nums">
						{String(index + 1).padStart(2, '0')}
					</span>
					<p className="text-muted-foreground text-xs uppercase tracking-wide">
						{QUESTION_TYPE_LABELS[question.questionType] ??
							question.questionType}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setRevealed((v) => !v)}
					className="inline-flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
				>
					{revealed ? (
						<>
							<EyeSlash className="size-3.5" weight="regular" />
							Sembunyikan jawaban
						</>
					) : (
						<>
							<Eye className="size-3.5" weight="regular" />
							Lihat jawaban
						</>
					)}
				</button>
			</header>

			<div className="space-y-4 px-5 py-5">
				{question.imageUrl && (
					<img
						src={question.imageUrl}
						className="h-auto w-full border object-contain"
						alt="Ilustrasi soal"
						loading="lazy"
					/>
				)}

				<div className="prose prose-sm max-w-none font-serif text-base leading-relaxed">
					<p className="whitespace-pre-wrap">{question.questionText}</p>
				</div>

				{showOptions && question.options && question.options.length > 0 && (
					<ol className="space-y-2">
						{question.options.map((opt) => {
							const isCorrect = correctOptionLabel === opt.label;
							return (
								<li
									key={opt.label}
									className={cn(
										'flex items-start gap-3 border border-border px-3 py-2.5 text-sm transition-colors',
										revealed &&
											isCorrect &&
											'border-foreground bg-foreground/5',
									)}
								>
									<span
										className={cn(
											'flex size-6 shrink-0 items-center justify-center border border-border font-mono text-xs',
											revealed &&
												isCorrect &&
												'border-foreground bg-foreground text-background',
										)}
									>
										{revealed && isCorrect ? (
											<Check className="size-3.5" weight="bold" />
										) : (
											opt.label
										)}
									</span>
									<span className="flex-1 leading-relaxed">{opt.text}</span>
								</li>
							);
						})}
					</ol>
				)}

				{revealed && (
					<div className="space-y-2 border-border border-t pt-4">
						{!showOptions && (
							<div className="space-y-1">
								<p className="text-muted-foreground text-xs uppercase tracking-wide">
									Jawaban
								</p>
								<p className="font-serif text-sm leading-relaxed">
									{question.correctAnswer || '—'}
								</p>
							</div>
						)}
						{question.suggestedAnswer && (
							<div className="space-y-1">
								<p className="text-muted-foreground text-xs uppercase tracking-wide">
									Penjelasan
								</p>
								<p className="text-muted-foreground text-sm leading-relaxed">
									{question.suggestedAnswer}
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</article>
	);
}
