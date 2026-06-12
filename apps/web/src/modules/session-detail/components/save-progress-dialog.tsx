import { Spinner } from '@phosphor-icons/react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@questgen/ui/components/dialog';

type SaveProgressDialogProps = {
	open: boolean;
	questionCount: number;
	imageCount: number;
};

export function SaveProgressDialog({
	open,
	questionCount,
	imageCount,
}: SaveProgressDialogProps) {
	return (
		<Dialog open={open}>
			<DialogContent showCloseButton={false} className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-serif text-base">
						<Spinner
							className="size-4 animate-spin"
							weight="bold"
							aria-hidden
						/>
						Menyimpan Perubahan
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-2 text-sm">
					<p>
						{questionCount === 1
							? 'Menyimpan 1 soal…'
							: `Menyimpan ${questionCount} soal…`}
					</p>
					{imageCount > 0 && (
						<p className="text-muted-foreground">
							{imageCount === 1
								? 'Mengunggah 1 gambar…'
								: `Mengunggah ${imageCount} gambar…`}
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
