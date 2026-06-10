import type { createDb } from '@questgen/db';

export type AppEnv = {
	Variables: {
		db: ReturnType<typeof createDb>;
		userId: string;
		email: string;
	};
};
