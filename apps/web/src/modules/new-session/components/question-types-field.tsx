import { Checkbox } from '@questgen/ui/components/checkbox';
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

	return (
		<Field data-invalid={Boolean(error)}>
			<div className="flex items-baseline justify-between">
				<FieldLabel>Jenis Soal</FieldLabel>
				<span
					className={cn(
						'text-xs tabular-nums',
						total > MAX_TOTAL_QUESTIONS
							? 'text-destructive'
							: 'text-muted-foreground',
					)}
				>
					{total} / {MAX_TOTAL_QUESTIONS}
				</span>
			</div>
			<div className="border border-input">
				{QUESTION_TYPES.map((type, index) => {
					const isSelected = selectedTypes.has(type);
					const count = countByType.get(type) ?? 0;
					return (
						<div
							key={type}
							className={cn(
								'flex items-center gap-3 px-3 py-2.5',
								index > 0 && 'border-input border-t',
								!isSelected && 'bg-muted/30',
							)}
						>
							<Checkbox
								id={`qt-${type}`}
								checked={isSelected}
								onCheckedChange={(checked) =>
									toggleType(type, checked === true)
								}
								aria-label={`Pilih ${QUESTION_TYPE_LABELS[type]}`}
							/>
							<label
								htmlFor={`qt-${type}`}
								className={cn(
									'flex-1 cursor-pointer text-xs',
									!isSelected && 'text-muted-foreground',
								)}
							>
								{QUESTION_TYPE_LABELS[type]}
							</label>
							<NumberStepper
								value={count}
								onChange={(v) => updateCount(type, v)}
								min={0}
								max={MAX_TOTAL_QUESTIONS}
								disabled={!isSelected}
								ariaLabel={`Jumlah ${QUESTION_TYPE_LABELS[type]}`}
							/>
						</div>
					);
				})}
			</div>
			<FieldDescription>
				Pilih satu atau lebih jenis soal. Total maksimal {MAX_TOTAL_QUESTIONS}{' '}
				soal.
			</FieldDescription>
			{error && <FieldError errors={[error]} />}
		</Field>
	);
}
