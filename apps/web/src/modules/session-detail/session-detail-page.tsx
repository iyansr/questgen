import { useSessionStream } from '@/hooks/use-session-stream';
import { useSession } from '@/services/sessions/detail';

import { BackToTop } from './components/back-to-top';
import { QuestionList } from './components/question-list';
import { SessionDetailSkeleton } from './components/session-detail-skeleton';
import { SessionHeader } from './components/session-header';
import { SessionProgress } from './components/session-progress';

type SessionDetailPageProps = {
	sessionId: string;
};

export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
	const { data, isLoading, isError, error } = useSession(sessionId);
	const { status, questions, isStreaming } = useSessionStream(sessionId);

	if (isLoading) return <SessionDetailSkeleton />;

	if (isError || !data) {
		return (
			<div className="space-y-4">
				<SessionHeaderFallback />
				<div className="border border-destructive/40 bg-destructive/5 p-5 text-sm">
					<p className="font-medium text-destructive">
						Tidak dapat memuat sesi
					</p>
					<p className="mt-1 text-muted-foreground">
						{error instanceof Error ? error.message : 'Sesi tidak ditemukan.'}
					</p>
				</div>
			</div>
		);
	}

	const expectedCount =
		typeof data.config?.count === 'number' ? data.config.count : null;

	return (
		<div className="space-y-10">
			<SessionHeader session={data} />
			<BackToTop />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-1">
					<div className="sticky top-4">
						<SessionProgress
							status={status.status}
							questionsCount={questions.length}
							expectedCount={expectedCount}
							isStreaming={isStreaming}
						/>
					</div>
				</div>
				<div className="lg:col-span-2">
					<QuestionList
						questions={questions}
						status={status.status}
						isStreaming={isStreaming}
						expectedCount={expectedCount}
					/>
				</div>
			</div>
		</div>
	);
}

function SessionHeaderFallback() {
	return (
		<header className="space-y-3">
			<div className="h-3 w-32 animate-pulse bg-muted" />
			<div className="h-9 w-2/3 animate-pulse bg-muted" />
			<div className="h-3 w-48 animate-pulse bg-muted" />
		</header>
	);
}
