import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@questgen/ui/components/button';
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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between border-border/50 border-r bg-muted/30 p-12 lg:flex lg:p-16">
        <div>
          <Link to="/" className="font-serif text-2xl tracking-tight">
            QuestGen
          </Link>
        </div>
        <div>
          <h2 className="text-4xl leading-tight xl:text-5xl">
            Mulai buat
            <br />
            penilaian <em>lebih baik</em>
          </h2>
          <div className="mt-6 h-px w-16 bg-foreground/20" />
          <p className="mt-6 max-w-sm text-muted-foreground leading-relaxed">
            Bergabunglah dengan pendidik yang menggunakan AI untuk membuat,
            meninjau, dan mengekspor soal penilaian dalam hitungan menit.
          </p>
        </div>
        <p className="text-muted-foreground/60 text-xs">
          Gratis untuk memulai. Tidak perlu kartu kredit.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12 md:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
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
                    <FieldLabel htmlFor={field.name}>Nama</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Nama lengkap Anda"
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
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      placeholder="nama@contoh.com"
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
                    <FieldLabel htmlFor={field.name}>Kata sandi</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      placeholder="Minimal 8 karakter"
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
                    <FieldLabel htmlFor={field.name}>
                      Konfirmasi kata sandi
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      placeholder="Masukkan ulang kata sandi Anda"
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
                        className="mt-0.5"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-muted-foreground leading-snug"
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
                className="w-full gap-2"
                disabled={register.isPending}
              >
                {register.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Buat akun
                    <ArrowRight className="size-4" />
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
        </div>
      </div>
    </div>
  );
}
