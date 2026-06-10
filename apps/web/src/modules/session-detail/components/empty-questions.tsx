import { Sparkle } from '@phosphor-icons/react';

type EmptyQuestionsProps = {
	status: 'pending' | 'generating' | 'completed' | 'failed';
};

export function EmptyQuestions({ status }: EmptyQuestionsProps) {
	const message = (() => {
		switch (status) {
			case 'pending':
				return {
					title: 'Belum ada soal',
					body: 'Dokumen sedang disiapkan. Soal pertama akan muncul sebentar lagi.',
				};
			case 'generating':
				return {
					title: 'AI sedang berpikir',
					body: 'Soal pertama akan muncul di sini begitu siap.',
				};
			case 'failed':
				return {
					title: 'Tidak ada soal',
					body: 'Proses dihentikan sebelum soal pertama dihasilkan.',
				};
			default:
				return {
					title: 'Tidak ada soal',
					body: 'Sesi ini belum menghasilkan soal apa pun.',
				};
		}
	})();

	return (
		<div className="flex flex-col items-center justify-center gap-3 border border-border border-dashed bg-muted/30 px-6 py-12 text-center">
			<div className="flex size-10 items-center justify-center border border-border bg-background">
				<Sparkle className="size-5 text-muted-foreground" weight="regular" />
			</div>
			<div className="space-y-1">
				<p className="font-medium text-sm">{message.title}</p>
				<p className="text-muted-foreground text-xs leading-relaxed">
					{message.body}
				</p>
			</div>
		</div>
	);
}
