import type { createDb } from '@questgen/db';
import { users } from '@questgen/db/schema';
import { env } from '@questgen/env/server';
import { eq } from 'drizzle-orm';

import { hashPassword, signToken, verifyPassword } from '@/shared/lib/auth';

type Db = ReturnType<typeof createDb>;

export async function registerUser(
	db: Db,
	email: string,
	password: string,
	name: string,
) {
	const existing = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (existing.length > 0) {
		throw new Error('Email already registered');
	}

	const passwordHash = await hashPassword(password);

	const [user] = await db
		.insert(users)
		.values({ email, passwordHash, name })
		.returning({ id: users.id, email: users.email, name: users.name });

	if (!user) {
		throw new Error('Failed to create user');
	}

	const token = await signToken(
		{ userId: user.id, email: user.email },
		env.JWT_SECRET,
	);

	return { token, user };
}

export async function loginUser(db: Db, email: string, password: string) {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (!user) {
		throw new Error('Invalid email or password');
	}

	const valid = await verifyPassword(password, user.passwordHash);

	if (!valid) {
		throw new Error('Invalid email or password');
	}

	const token = await signToken(
		{ userId: user.id, email: user.email },
		env.JWT_SECRET,
	);

	return {
		token,
		user: { id: user.id, email: user.email, name: user.name },
	};
}

export async function getUserById(db: Db, userId: string) {
	const [user] = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user) {
		throw new Error('User not found');
	}

	return { user };
}
