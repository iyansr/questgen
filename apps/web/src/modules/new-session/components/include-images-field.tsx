import { Button } from '@questgen/ui/components/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@questgen/ui/components/field';
import { cn } from '@questgen/ui/lib/utils';
import type { ControllerRenderProps } from 'react-hook-form';

import type { NewSessionFormValues } from '../schema';

interface IncludeImagesFieldProps {
  field: ControllerRenderProps<NewSessionFormValues, 'includeImages'>;
}

function ToggleSwitch({
  id,
  on,
  onToggle,
}: {
  id: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      id={id}
      type="button"
      variant="ghost"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
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

export function IncludeImagesField({ field }: IncludeImagesFieldProps) {
  const switchId = 'include-images-switch';

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={switchId}>Sertakan Gambar Pada Soal</FieldLabel>
        <FieldDescription>
          Aktif: soal boleh memakai diagram/ilustrasi dari materi. Nonaktif:
          semua soal teks saja.
        </FieldDescription>
      </FieldContent>
      <ToggleSwitch
        id={switchId}
        on={field.value}
        onToggle={() => field.onChange(!field.value)}
      />
    </Field>
  );
}
