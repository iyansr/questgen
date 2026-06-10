import { Skeleton } from '@questgen/ui/components/skeleton';

export function SessionDetailSkeleton() {
	return (
		<div className="space-y-10">
			<header className="space-y-3">
				<Skeleton className="h-3 w-32" />
				<Skeleton className="h-9 w-2/3" />
				<Skeleton className="h-3 w-48" />
			</header>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="space-y-3 lg:col-span-1">
					<Skeleton className="h-32 w-full" />
				</div>
				<div className="space-y-4 lg:col-span-2">
					<div className="space-y-2">
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-3 w-64" />
					</div>
					<Skeleton className="h-40 w-full" />
					<Skeleton className="h-40 w-full" />
				</div>
			</div>
		</div>
	);
}
