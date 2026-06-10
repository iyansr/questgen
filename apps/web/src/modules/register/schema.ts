import z from 'zod';

export const registerSchema = z
	.object({
		name: z.string().min(2, 'Nama minimal 2 karakter'),
		email: z
			.email('Masukkan alamat email yang valid')
			.min(1, 'Email wajib diisi'),
		password: z
			.string()
			.min(1, 'Kata sandi wajib diisi')
			.min(8, 'Kata sandi minimal 8 karakter'),
		confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
		agreeTerms: z.boolean().refine((val) => val === true, {
			message: 'Anda harus menyetujui ketentuan',
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Kata sandi tidak cocok',
		path: ['confirmPassword'],
	});

export type RegisterFormValues = z.infer<typeof registerSchema>;
