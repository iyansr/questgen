import { Button } from '@questgen/ui/components/button';
import { cn } from '@questgen/ui/lib/utils';
import { Minus, Plus } from 'lucide-react';
import { useCallback } from 'react';

interface NumberStepperProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	ariaLabel?: string;
	className?: string;
}

export function NumberStepper({
	value,
	onChange,
	min = 0,
	max = 99,
	step = 1,
	disabled = false,
	ariaLabel,
	className,
}: NumberStepperProps) {
	const decrement = useCallback(() => {
		onChange(Math.max(min, value - step));
	}, [onChange, value, min, step]);

	const increment = useCallback(() => {
		onChange(Math.min(max, value + step));
	}, [onChange, value, max, step]);

	const atMin = value <= min;
	const atMax = value >= max;

	return (
		<div
			className={cn(
				'inline-flex items-center border border-input bg-transparent',
				disabled && 'opacity-50',
				className,
			)}
			role="group"
			aria-label={ariaLabel}
		>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				onClick={decrement}
				disabled={disabled || atMin}
				aria-label="Kurangi"
				className="rounded-none border-input border-transparent border-r"
			>
				<Minus className="size-3.5" />
			</Button>
			<div
				className="flex h-7 w-10 items-center justify-center font-medium text-xs tabular-nums"
				aria-live="polite"
			>
				{value}
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				onClick={increment}
				disabled={disabled || atMax}
				aria-label="Tambah"
				className="rounded-none border-input border-transparent border-l"
			>
				<Plus className="size-3.5" />
			</Button>
		</div>
	);
}
