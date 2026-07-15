import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@questgen/ui/components/button';
import { Card } from '@questgen/ui/components/card';
import { Checkbox } from '@questgen/ui/components/checkbox';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@questgen/ui/components/field';
import { Input } from '@questgen/ui/components/input';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { PasswordInput } from '@/components/password-input';
import { useRegister } from '@/services/auth/register';

import { type RegisterFormValues, registerSchema } from './schema';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  function onSubmit(data: RegisterFormValues) {
    register.mutate(
      { name: data.name, email: data.email, password: data.password },
      {
        onSuccess: () => {
          navigate({ to: '/dashboard' });
        },
      },
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg rounded-xl px-6 py-8">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="mb-6 inline-block font-serif text-2xl tracking-tight"
          >
            QuestGen
          </Link>
          <h1 className="text-3xl md:text-4xl">Buat akun</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Isi detail Anda untuk memulai.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm">
                    Nama
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="Nama lengkap Anda"
                    className="h-11 px-4 text-base"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm">
                    Email
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    placeholder="nama@contoh.com"
                    className="h-11 px-4 text-base"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm">
                    Kata sandi
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id={field.name}
                    placeholder="Minimal 8 karakter"
                    className="h-11 px-4 text-base"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm">
                    Konfirmasi kata sandi
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id={field.name}
                    placeholder="Masukkan ulang kata sandi Anda"
                    className="h-11 px-4 text-base"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="agreeTerms"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 size-5"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-muted-foreground text-sm leading-snug"
                    >
                      Saya menyetujui{' '}
                      <button
                        type="button"
                        className="text-foreground underline-offset-4 hover:underline"
                      >
                        Ketentuan Layanan
                      </button>{' '}
                      dan{' '}
                      <button
                        type="button"
                        className="text-foreground underline-offset-4 hover:underline"
                      >
                        Kebijakan Privasi
                      </button>
                    </FieldLabel>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full gap-2 text-base"
              disabled={register.isPending}
            >
              {register.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  Buat akun
                  <ArrowRight className="size-5" />
                </>
              )}
            </Button>
          </FieldGroup>
        </form>

        <div className="mt-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-muted-foreground text-xs">atau</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Sudah punya akun?{' '}
            <Link
              to="/login"
              className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
            >
              Masuk
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
