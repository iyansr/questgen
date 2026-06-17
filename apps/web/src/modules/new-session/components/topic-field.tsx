import { Field, FieldError, FieldLabel } from '@questgen/ui/components/field';
import { Input } from '@questgen/ui/components/input';
import type {
	ControllerRenderProps,
	FieldError as RHFFieldError,
} from 'react-hook-form';

import type { NewSessionFormValues } from '../schema';

interface TopicFieldProps {
	field: ControllerRenderProps<NewSessionFormValues, 'topic'>;
	error?: RHFFieldError;
}

export function TopicField({ field, error }: TopicFieldProps) {
	return (
		<Field
			data-invalid={Boolean(error)}
			aria-describedby={error ? 'topic-error' : undefined}
		>
			<FieldLabel htmlFor={field.name}>Topik</FieldLabel>
			<Input
				{...field}
				id={field.name}
				type="text"
				placeholder="cth. Fotosintesis pada tumbuhan"
				aria-invalid={Boolean(error)}
				aria-describedby={error ? 'topic-error' : undefined}
				maxLength={200}
			/>
			{error && <FieldError id="topic-error" errors={[error]} />}
		</Field>
	);
}
