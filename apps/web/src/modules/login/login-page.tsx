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
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { isBetaMode, requestAccessFormUrl } from '@/lib/feature-flags';
import { useLogin } from '@/services/auth/login';

import { type LoginFormValues, loginSchema } from './schema';

export function LoginPage() {
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();
  const login = useLogin();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(data: LoginFormValues) {
    login.mutate(data, {
      onSuccess: () => {
        navigate({ to: '/dashboard' });
      },
    });
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
          <h1 className="text-3xl md:text-4xl">Masuk</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Masukkan kredensial Anda untuk mengakses akun.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name} className="text-sm">
                      Kata sandi
                    </FieldLabel>
                    <button
                      type="button"
                      className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    placeholder="Masukkan kata sandi Anda"
                    className="h-11 px-4 text-base"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Field orientation="horizontal">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
                className="size-5"
              />
              <FieldLabel
                htmlFor="remember"
                className="text-muted-foreground text-sm"
              >
                Ingat saya
              </FieldLabel>
            </Field>

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full gap-2 text-base"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  Masuk
                  <ArrowRight className="size-5" />
                </>
              )}
            </Button>
          </FieldGroup>
        </form>

        {isBetaMode ? (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              Belum punya akun?{' '}
              <a
                href={requestAccessFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
              >
                Minta akses beta
              </a>
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-muted-foreground text-xs">atau</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
                >
                  Buat akun
                </Link>
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
