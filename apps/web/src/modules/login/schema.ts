import z from 'zod';

export const loginSchema = z.object({
	email: z
		.email('Masukkan alamat email yang valid')
		.min(1, 'Email wajib diisi'),
	password: z
		.string()
		.min(1, 'Kata sandi wajib diisi')
		.min(8, 'Kata sandi minimal 8 karakter'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
