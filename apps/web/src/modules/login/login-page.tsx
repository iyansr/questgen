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
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

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
		<div className="grid min-h-screen lg:grid-cols-2">
			<div className="relative hidden flex-col justify-between border-border/50 border-r bg-muted/30 p-12 lg:flex lg:p-16">
				<div>
					<Link to="/" className="font-serif text-2xl tracking-tight">
						QuestGen
					</Link>
				</div>
				<div>
					<h2 className="text-4xl leading-tight xl:text-5xl">
						Soal,
						<br />
						dibuat oleh <em>AI</em>
					</h2>
					<div className="mt-6 h-px w-16 bg-foreground/20" />
					<p className="mt-6 max-w-sm text-muted-foreground leading-relaxed">
						Buat soal penilaian dari topik, dokumen, atau sumber web apa pun.
						Disesuaikan dengan tingkat kesulitan dan format Anda.
					</p>
				</div>
				<p className="text-muted-foreground/60 text-xs">
					Penilaian berbasis AI untuk pendidik modern.
				</p>
			</div>

			<div className="flex items-center justify-center px-6 py-12 md:px-12">
				<div className="w-full max-w-sm">
					<div className="mb-8">
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
										<div className="flex items-center justify-between">
											<FieldLabel htmlFor={field.name}>Kata sandi</FieldLabel>
											<button
												type="button"
												className="text-muted-foreground text-xs transition-colors hover:text-foreground"
											>
												Lupa kata sandi?
											</button>
										</div>
										<Input
											{...field}
											id={field.name}
											type="password"
											placeholder="Masukkan kata sandi Anda"
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
								/>
								<FieldLabel
									htmlFor="remember"
									className="text-muted-foreground"
								>
									Ingat saya
								</FieldLabel>
							</Field>

							<Button
								type="submit"
								size="lg"
								className="w-full gap-2"
								disabled={login.isPending}
							>
								{login.isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<>
										Masuk
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
							Belum punya akun?{' '}
							<Link
								to="/register"
								className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
							>
								Buat akun
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
