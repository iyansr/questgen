import { generateText, Output } from 'ai';
import { z } from 'zod';

import { openrouter } from '@/shared/ai/openrouter';
import { GENERATION_PARAMS, MODELS } from '@/shared/config/models';

function toDataUrl(input: string): string {
	if (input.startsWith('data:')) return input;
	return `data:image/png;base64,${input}`;
}

export async function captionImages(
	images: Array<{ id: string; base64: string }>,
): Promise<Map<string, string>> {
	if (images.length === 0) return new Map();

	const validImages = images.filter(
		(img) => img.base64 && img.base64.length > 0,
	);
	if (validImages.length === 0) return new Map();

	const { output } = await generateText({
		model: openrouter(MODELS.CAPTIONING),
		temperature: GENERATION_PARAMS.RESEARCH.temperature,
		output: Output.array({ element: z.string() }),
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: `You will receive ${validImages.length} images. Caption each one in 1-2 sentences for use as an educational illustration. Be specific about what is shown (objects, diagrams, text, charts, people). Return a JSON array of strings with one caption per image, in the same order.`,
					},
					...validImages.map((img) => ({
						type: 'image' as const,
						image: toDataUrl(img.base64),
					})),
				],
			},
		],
		experimental_telemetry: {
			isEnabled: true,
			functionId: 'image-captioning',
			recordInputs: false,
		},
	});

	const result = new Map<string, string>();
	validImages.forEach((img, i) => {
		const caption = output[i];
		if (caption) result.set(img.id, caption);
	});
	return result;
}
