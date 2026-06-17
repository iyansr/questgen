import { Field, FieldError, FieldLabel } from '@questgen/ui/components/field';
import { cn } from '@questgen/ui/lib/utils';
import type {
	ControllerRenderProps,
	FieldError as RHFFieldError,
} from 'react-hook-form';

import {
	CLASS_GRADE_OPTIONS,
	GRADE_OPTIONS,
	type NewSessionFormValues,
} from '../schema';

interface GradeClassFieldProps {
	gradeField: ControllerRenderProps<NewSessionFormValues, 'grade'>;
	classGradeField: ControllerRenderProps<NewSessionFormValues, 'classGrade'>;
	error?: RHFFieldError;
}

export function GradeClassField({
	gradeField,
	classGradeField,
	error,
}: GradeClassFieldProps) {
	const grades = gradeField.value
		? (CLASS_GRADE_OPTIONS[gradeField.value] ?? [])
		: [];

	return (
		<Field
			data-invalid={Boolean(error)}
			aria-describedby={error ? 'grade-error' : undefined}
		>
			<FieldLabel>Jenjang & Kelas</FieldLabel>

			{/* Level pills */}
			<div className="mb-3 flex flex-wrap gap-2">
				{GRADE_OPTIONS.map((lvl) => {
					const isActive = gradeField.value === lvl;
					return (
						<button
							key={lvl}
							type="button"
							onClick={() => {
								gradeField.onChange(lvl);
								classGradeField.onChange(undefined);
							}}
							className={cn(
								'rounded-full border px-5 py-2 text-sm font-semibold transition-all',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
								isActive
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-input bg-background text-muted-foreground hover:border-primary/40 hover:text-primary',
							)}
						>
							{lvl}
						</button>
					);
				})}
			</div>

			{/* Class grade chips */}
			{gradeField.value && (
				<div className="animate-in fade-in slide-in-from-top-1 space-y-2">
					<p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
						Pilih Kelas
					</p>
					<div className="flex flex-wrap gap-2">
						{grades.map((g) => {
							const isActive = classGradeField.value === g;
							return (
								<button
									key={g}
									type="button"
									onClick={() => classGradeField.onChange(g)}
									className={cn(
										'flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-extrabold transition-all',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
										isActive
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-input bg-background text-muted-foreground hover:border-primary/40 hover:text-primary',
									)}
								>
									{g}
								</button>
							);
						})}
					</div>
				</div>
			)}

			{error && <FieldError id="grade-error" errors={[error]} />}
		</Field>
	);
}
