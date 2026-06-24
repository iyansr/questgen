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
    <div
      className="flex flex-col items-center justify-center gap-4 border border-border border-dashed bg-muted/30 px-6 py-14 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex size-12 items-center justify-center border border-border bg-background"
        aria-hidden
      >
        <Sparkle className="size-6 text-muted-foreground" weight="regular" />
      </div>
      <div className="space-y-2">
        <p className="font-semibold text-base">{message.title}</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          {message.body}
        </p>
      </div>
    </div>
  );
}
