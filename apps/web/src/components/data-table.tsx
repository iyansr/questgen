import {
	CaretDoubleLeft,
	CaretDoubleRight,
	CaretLeft,
	CaretRight,
} from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@questgen/ui/components/table';
import { cn } from '@questgen/ui/lib/utils';
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type PaginationState,
	useReactTable,
} from '@tanstack/react-table';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

export interface DataTablePaginationConfig {
	pageIndex: number;
	pageSize: number;
	pageCount: number;
	total: number;
	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	emptyState?: React.ReactNode;
	className?: string;
	pagination?: DataTablePaginationConfig;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	emptyState = 'Tidak ada data.',
	className,
	pagination,
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: !!pagination,
		pageCount: pagination?.pageCount ?? -1,
		state: pagination
			? {
					pagination: {
						pageIndex: pagination.pageIndex,
						pageSize: pagination.pageSize,
					} satisfies PaginationState,
				}
			: undefined,
		onPaginationChange: pagination
			? (updater) => {
					const next =
						typeof updater === 'function'
							? updater({
									pageIndex: pagination.pageIndex,
									pageSize: pagination.pageSize,
								})
							: updater;
					if (next.pageIndex !== pagination.pageIndex) {
						pagination.onPageChange(next.pageIndex);
					}
					if (next.pageSize !== pagination.pageSize) {
						pagination.onPageSizeChange(next.pageSize);
					}
				}
			: undefined,
	});

	const isFirstPage = !pagination || pagination.pageIndex === 0;
	const isLastPage =
		!pagination || pagination.pageIndex >= pagination.pageCount - 1;

	return (
		<div className={cn('space-y-3', className)}>
			<div className="overflow-hidden border border-border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									{emptyState}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{pagination && (
				<div className="flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
					<p className="text-muted-foreground">
						Menampilkan{' '}
						<span className="text-foreground tabular-nums">
							{pagination.total === 0
								? 0
								: pagination.pageIndex * pagination.pageSize + 1}
							–
							{Math.min(
								(pagination.pageIndex + 1) * pagination.pageSize,
								pagination.total,
							)}
						</span>{' '}
						dari{' '}
						<span className="text-foreground tabular-nums">
							{pagination.total}
						</span>{' '}
						data
					</p>
					<div className="flex items-center gap-1">
						<select
							aria-label="Baris per halaman"
							value={pagination.pageSize}
							onChange={(e) =>
								pagination.onPageSizeChange(Number(e.target.value))
							}
							className="h-7 border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
						>
							{PAGE_SIZE_OPTIONS.map((size) => (
								<option key={size} value={size}>
									{size} / hal
								</option>
							))}
						</select>
						<Button
							variant="outline"
							size="icon-sm"
							onClick={() => pagination.onPageChange(0)}
							disabled={isFirstPage}
							aria-label="Halaman pertama"
						>
							<CaretDoubleLeft className="size-3.5" weight="regular" />
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
							disabled={isFirstPage}
							aria-label="Halaman sebelumnya"
						>
							<CaretLeft className="size-3.5" weight="regular" />
						</Button>
						<span className="min-w-12 px-2 text-center text-foreground tabular-nums">
							{pagination.pageIndex + 1} / {Math.max(1, pagination.pageCount)}
						</span>
						<Button
							variant="outline"
							size="icon-sm"
							onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
							disabled={isLastPage}
							aria-label="Halaman berikutnya"
						>
							<CaretRight className="size-3.5" weight="regular" />
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							onClick={() => pagination.onPageChange(pagination.pageCount - 1)}
							disabled={isLastPage}
							aria-label="Halaman terakhir"
						>
							<CaretDoubleRight className="size-3.5" weight="regular" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
