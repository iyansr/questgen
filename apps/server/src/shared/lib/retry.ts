export type RetryOptions = {
	maxRetries?: number;
	baseDelayMs?: number;
	shouldRetry?: (error: unknown) => boolean;
};

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

function isRetryableError(error: unknown): boolean {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		return (
			message.includes('rate limit') ||
			message.includes('timeout') ||
			message.includes('econnreset') ||
			message.includes('econnrefused') ||
			message.includes('fetch failed') ||
			message.includes('network') ||
			message.includes('temporary') ||
			message.includes('503') ||
			message.includes('502') ||
			message.includes('504') ||
			message.includes('429')
		);
	}
	return false;
}

export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const {
		maxRetries = DEFAULT_MAX_RETRIES,
		baseDelayMs = DEFAULT_BASE_DELAY_MS,
		shouldRetry = isRetryableError,
	} = options;

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			if (attempt === maxRetries || !shouldRetry(error)) {
				throw error;
			}

			const delay = baseDelayMs * 2 ** (attempt - 1);
			console.warn(
				`Retry attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms:`,
				error instanceof Error ? error.message : String(error),
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}
