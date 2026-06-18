import { Button } from '@questgen/ui/components/button';
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from '@questgen/ui/components/field';
import { cn } from '@questgen/ui/lib/utils';
import { useMemo } from 'react';
import type {
	ControllerRenderProps,
	FieldError as RHFFieldError,
} from 'react-hook-form';

import {
	type NewSessionFormValues,
	QUESTION_TYPE_LABELS,
	QUESTION_TYPES,
	type QuestionType,
	type QuestionTypeCount,
	totalCount,
} from '../schema';
import { NumberStepper } from './number-stepper';

const MAX_TOTAL_QUESTIONS = 50;
const DEFAULT_COUNT = 5;

interface QuestionTypesFieldProps {
	field: ControllerRenderProps<NewSessionFormValues, 'questionTypeCounts'>;
	error?: RHFFieldError;
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
	return (
		<Button
			type="button"
			variant="ghost"
			role="switch"
			aria-checked={on}
			onClick={(e) => {
				e.stopPropagation();
				onToggle();
			}}
			className={cn(
				'relative h-5 w-9 shrink-0 rounded-full border-none p-0',
				'focus-visible:ring-offset-2',
				on ? 'bg-primary hover:bg-primary' : 'bg-border hover:bg-border',
			)}
		>
			<div
				className={cn(
					'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200',
					on ? 'left-4' : 'left-0.5',
				)}
			/>
		</Button>
	);
}

export function QuestionTypesField({ field, error }: QuestionTypesFieldProps) {
	const counts: QuestionTypeCount[] = field.value ?? [];

	const countByType = useMemo(() => {
		const map = new Map<QuestionType, number>();
		for (const c of counts) map.set(c.type, c.count);
		return map;
	}, [counts]);

	const selectedTypes = useMemo(
		() => new Set(counts.map((c) => c.type)),
		[counts],
	);

	const total = totalCount(counts);
	const remaining = MAX_TOTAL_QUESTIONS - total;

	function toggleType(type: QuestionType, checked: boolean) {
		if (checked) {
			const available = Math.max(0, remaining);
			const initialCount = Math.min(DEFAULT_COUNT, available);
			if (initialCount <= 0) return;
			field.onChange([
				...counts.filter((c) => c.type !== type),
				{ type, count: initialCount },
			]);
		} else {
			field.onChange(counts.filter((c) => c.type !== type));
		}
	}

	function updateCount(type: QuestionType, nextCount: number) {
		const othersTotal = counts
			.filter((c) => c.type !== type)
			.reduce((sum, c) => sum + c.count, 0);
		const allowedMax = Math.max(0, MAX_TOTAL_QUESTIONS - othersTotal);
		const clamped = Math.max(0, Math.min(nextCount, allowedMax));
		field.onChange(
			counts.map((c) => (c.type === type ? { ...c, count: clamped } : c)),
		);
	}

	const hasSelection = counts.length > 0;

	return (
		<Field
			data-invalid={Boolean(error)}
			aria-describedby={error ? 'qt-error' : undefined}
		>
			<div className="mb-3 flex items-baseline justify-between">
				<FieldLabel>Jumlah & Tipe Soal</FieldLabel>
				<span
					className={cn(
						'rounded-full px-3 py-0.5 font-semibold text-xs tabular-nums transition-colors',
						total > 0
							? 'bg-primary/10 text-primary'
							: 'bg-muted text-muted-foreground',
					)}
				>
					{total > 0 ? `Total ${total} soal` : 'Belum dipilih'}
				</span>
			</div>

			<div className="flex flex-col gap-2.5">
				{QUESTION_TYPES.map((type) => {
					const isSelected = selectedTypes.has(type);
					const count = countByType.get(type) ?? 0;

					return (
						<div
							key={type}
							onClick={() => toggleType(type, !isSelected)}
							className={cn(
								'flex cursor-pointer select-none items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-all',
								'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
								isSelected
									? 'border-primary bg-primary/5'
									: 'border-input bg-background hover:border-primary/30',
							)}
						>
							{/* Toggle switch */}
							<ToggleSwitch
								on={isSelected}
								onToggle={() => toggleType(type, !isSelected)}
							/>

							{/* Label */}
							<div className="min-w-0 flex-1">
								<p
									className={cn(
										'font-semibold text-sm transition-colors',
										isSelected ? 'text-primary' : 'text-foreground',
									)}
								>
									{QUESTION_TYPE_LABELS[type]}
								</p>
							</div>

							{/* Count stepper — only visible when selected */}
							{isSelected && (
								<div
									className="fade-in slide-in-from-right-2 animate-in"
									onClick={(e) => e.stopPropagation()}
								>
									<NumberStepper
										value={count}
										onChange={(v) => updateCount(type, v)}
										min={1}
										max={MAX_TOTAL_QUESTIONS}
										disabled={!isSelected}
										ariaLabel={`Jumlah ${QUESTION_TYPE_LABELS[type]}`}
									/>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{!hasSelection && (
				<p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-medium text-amber-800 text-sm dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
					Pilih minimal satu tipe soal untuk melanjutkan
				</p>
			)}

			{/* Mix breakdown */}
			{total > 0 && (
				<div className="mt-3 flex flex-wrap gap-3 rounded-lg bg-primary/5 px-3 py-2.5">
					{QUESTION_TYPES.filter((q) => selectedTypes.has(q)).map((q) => (
						<span
							key={q}
							className="font-semibold text-primary text-sm tabular-nums"
						>
							{countByType.get(q)}× {QUESTION_TYPE_LABELS[q]}
						</span>
					))}
				</div>
			)}

			<FieldDescription className="text-sm">
				Pilih satu atau lebih jenis soal. Total maksimal {MAX_TOTAL_QUESTIONS}{' '}
				soal.
			</FieldDescription>
			{error && <FieldError id="qt-error" errors={[error]} />}
		</Field>
	);
}
