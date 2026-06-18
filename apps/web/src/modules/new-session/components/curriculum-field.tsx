import { Button } from '@questgen/ui/components/button';
import { Field, FieldError, FieldLabel } from '@questgen/ui/components/field';
import { cn } from '@questgen/ui/lib/utils';
import type {
	ControllerRenderProps,
	FieldError as RHFFieldError,
} from 'react-hook-form';

import { CURRICULUM_OPTIONS, type NewSessionFormValues } from '../schema';

const CURRICULUM_BADGES: Record<string, string> = {
	'K-13': 'K13',
	'Kurikulum Merdeka': '2022',
};

interface CurriculumFieldProps {
	field: ControllerRenderProps<NewSessionFormValues, 'curriculum'>;
	error?: RHFFieldError;
}

export function CurriculumField({ field, error }: CurriculumFieldProps) {
	return (
		<Field
			data-invalid={Boolean(error)}
			aria-describedby={error ? 'curriculum-error' : undefined}
		>
			<FieldLabel>Kurikulum</FieldLabel>
			<div className="grid grid-cols-2 gap-3">
				{CURRICULUM_OPTIONS.map((opt) => {
					const isActive = field.value === opt;
					const badge = CURRICULUM_BADGES[opt] ?? opt;
					return (
						<Button
							key={opt}
							type="button"
							variant="outline"
							onClick={() => field.onChange(opt)}
							className={cn(
								'flex h-auto gap-3 rounded-xl p-3 text-left',
								isActive
									? 'border-primary bg-primary/5 hover:bg-primary/5'
									: 'border-input bg-background hover:border-primary/40 hover:bg-background',
							)}
						>
							<div
								className={cn(
									'flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-extrabold text-[10px] transition-colors',
									isActive
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground',
								)}
							>
								{badge}
							</div>
							<span
								className={cn(
									'font-semibold text-sm transition-colors',
									isActive ? 'text-primary' : 'text-foreground',
								)}
							>
								{opt}
							</span>
						</Button>
					);
				})}
			</div>
			{error && <FieldError id="curriculum-error" errors={[error]} />}
		</Field>
	);
}
