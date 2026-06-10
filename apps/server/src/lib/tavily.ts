import { trace } from '@opentelemetry/api';
import { env } from '@questgen/env/server';
import { tavily } from '@tavily/core';

import type { ImageRef } from './chunker';
import { MAX_WEB_IMAGES, MAX_WEB_RESULTS } from './upload-limits';

export interface WebSection {
	markdown: string;
	title: string;
	url: string;
}

export interface WebResearchResult {
	markdown: string;
	images: ImageRef[];
	sections: WebSection[];
}

const MIN_CONTENT_CHARS = 200;

export async function researchWeb(
	query: string,
	sessionId?: string,
): Promise<WebResearchResult> {
	const tracer = trace.getTracer('questgen-tavily');
	return tracer.startActiveSpan(
		'tavily.search',
		{
			attributes: {
				'questgen.session_id': sessionId ?? '',
				'tavily.query': query,
				'tavily.search_depth': 'advanced',
				'tavily.max_results': MAX_WEB_RESULTS,
			},
		},
		async (span) => {
			try {
				const client = tavily({ apiKey: env.TAVILY_API_KEY });

				const response = await client.search(query, {
					searchDepth: 'advanced',
					includeRawContent: 'markdown',
					maxResults: MAX_WEB_RESULTS,
					topic: 'general',
					includeImages: true,
					includeImageDescriptions: true,
				});

				span.setAttribute('tavily.raw_results', response.results.length);

				const usable = response.results.filter(
					(r) =>
						typeof r.rawContent === 'string' &&
						r.rawContent.length >= MIN_CONTENT_CHARS,
				);

				span.setAttribute('tavily.usable_results', usable.length);

				if (usable.length === 0) {
					span.setStatus({ code: 2, message: 'No usable content' });
					throw new Error(
						`Tavily returned no usable content for query: "${query}"`,
					);
				}

				const sections: WebSection[] = usable.map((r) => ({
					markdown: `# ${r.title}\n\n${r.rawContent}\n\n_Source: ${r.url}_`,
					title: r.title,
					url: r.url,
				}));

				const markdown = sections.map((s) => s.markdown).join('\n\n---\n\n');

				const images: ImageRef[] = (response.images ?? [])
					.filter((img) => img.url && img.description)
					.slice(0, MAX_WEB_IMAGES)
					.map((img) => ({
						id: img.url,
						url: img.url,
						caption: img.description ?? '',
					}));

				span.setAttribute('tavily.images_returned', images.length);
				span.setAttribute('tavily.total_chars', markdown.length);
				span.setAttribute('tavily.sections', sections.length);
				span.setStatus({ code: 1 });

				return { markdown, images, sections };
			} catch (error) {
				span.recordException(
					error instanceof Error ? error : new Error(String(error)),
				);
				span.setStatus({
					code: 2,
					message: error instanceof Error ? error.message : String(error),
				});
				throw error;
			} finally {
				span.end();
			}
		},
	);
}
