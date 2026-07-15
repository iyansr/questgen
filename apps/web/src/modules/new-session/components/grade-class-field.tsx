import { Button } from '@questgen/ui/components/button';
import { Field, FieldError, FieldLabel } from '@questgen/ui/components/field';
import { Input } from '@questgen/ui/components/input';
import { cn } from '@questgen/ui/lib/utils';
import type {
  ControllerRenderProps,
  FieldError as RHFFieldError,
} from 'react-hook-form';

import {
  CLASS_GRADE_OPTIONS,
  GRADE_OPTIONS,
  isFreeTextClassGrade,
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
  const freeTextClass = isFreeTextClassGrade(gradeField.value);
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
            <Button
              key={lvl}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              onClick={() => {
                gradeField.onChange(lvl);
                classGradeField.onChange(undefined);
              }}
              className={cn(
                'h-auto px-5 py-2 text-sm',
                isActive && 'hover:bg-primary/80',
                !isActive &&
                  'border-input bg-background text-muted-foreground hover:border-primary/40 hover:bg-background hover:text-primary',
              )}
            >
              {lvl}
            </Button>
          );
        })}
      </div>

      {/* Class grade: free text for SMK, chips for SD/SMP/SMA */}
      {gradeField.value && (
        <div className="fade-in slide-in-from-top-1 animate-in space-y-2">
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            {freeTextClass ? 'Isi Kelas' : 'Pilih Kelas'}
          </p>
          {freeTextClass ? (
            <Input
              id="classGrade"
              type="text"
              value={classGradeField.value ?? ''}
              onChange={(e) => classGradeField.onChange(e.target.value)}
              onBlur={classGradeField.onBlur}
              placeholder="cth. X TKJ 1"
              maxLength={50}
              aria-invalid={Boolean(error)}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {grades.map((g) => {
                const isActive = classGradeField.value === g;
                return (
                  <Button
                    key={g}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    onClick={() => classGradeField.onChange(g)}
                    className={cn(
                      'h-11 w-11 p-0 font-extrabold text-sm',
                      isActive && 'hover:bg-primary/80',
                      !isActive &&
                        'border-input bg-background text-muted-foreground hover:border-primary/40 hover:bg-background hover:text-primary',
                    )}
                  >
                    {g}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <FieldError id="grade-error" errors={[error]} />}
    </Field>
  );
}
