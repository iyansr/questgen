import {
	ArrowRight,
	BookOpen,
	ClockCounterClockwise,
	Export,
	FileText,
	MagnifyingGlass,
	PencilLine,
	Quotes,
	Sliders,
	Sparkle,
} from '@phosphor-icons/react';
import { buttonVariants } from '@questgen/ui/components/button';
import { cn } from '@questgen/ui/lib/utils';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
	type MotionProps,
	motion,
	useReducedMotion,
	type Variants,
} from 'motion/react';

import Header from '@/components/header';

export const Route = createFileRoute('/')({
	component: HomeComponent,
});

const easing = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0 },
};

const UNSPLASH = (id: string, w: number, h: number) =>
	`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}`;

function HomeComponent() {
	return (
		<main className="bg-background text-foreground">
			<Header />
			<Hero />
			<StatsStrip />
			<CaraKerja />
			<Fitur />
			<PullQuote />
			<FinalCTA />
			<Footer />
		</main>
	);
}

function useReveal() {
	const reduce = useReducedMotion();
	return (delay = 0): MotionProps =>
		reduce
			? { initial: false }
			: {
					initial: 'hidden',
					whileInView: 'visible',
					viewport: { once: true, amount: 0.3 },
					variants: fadeUp,
					transition: { duration: 0.7, delay, ease: easing },
				};
}

function useRevealOnMount() {
	const reduce = useReducedMotion();
	return (delay = 0): MotionProps =>
		reduce
			? { initial: false }
			: {
					initial: 'hidden',
					animate: 'visible',
					variants: fadeUp,
					transition: { duration: 0.7, delay, ease: easing },
				};
}

function Eyebrow({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<p
			className={cn(
				'font-serif text-base text-muted-foreground italic leading-[1.1] tracking-tight md:text-lg',
				className,
			)}
		>
			{children}
		</p>
	);
}

function Hero() {
	const m = useRevealOnMount();
	return (
		<section className="border-border/60 border-b">
			<div className="mx-auto grid max-w-350 grid-cols-1 gap-12 px-6 pt-16 pb-24 md:grid-cols-12 md:gap-10 md:px-12 md:pt-20 md:pb-32 lg:gap-16 lg:pt-24">
				<div className="md:col-span-7 lg:col-span-7">
					<motion.div {...m(0)} className="pb-2">
						<Eyebrow>untuk pengajar</Eyebrow>
					</motion.div>

					<motion.h1
						{...m(0.08)}
						className="mt-6 font-serif text-5xl leading-[1.02] tracking-tight md:text-6xl lg:text-7xl"
					>
						Buat soal yang berarti,
						<br />
						dalam <em className="font-serif text-accent">menit</em>.
					</motion.h1>

					<motion.p
						{...m(0.16)}
						className="mt-8 max-w-[52ch] text-base text-muted-foreground leading-relaxed md:text-lg"
					>
						QuestGen mengubah dokumen atau hasil pencarian menjadi soal
						penilaian siap pakai. Lengkap dengan kunci jawaban.
					</motion.p>

					<motion.div
						{...m(0.24)}
						className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
					>
						<Link
							to="/register"
							className={cn(
								buttonVariants({ variant: 'default', size: 'lg' }),
								'h-11 px-5 font-sans text-sm tracking-tight',
							)}
						>
							Mulai membuat soal
							<ArrowRight weight="regular" />
						</Link>
						<a
							href="#cara-kerja"
							className="group inline-flex items-center gap-1.5 font-sans text-foreground text-sm tracking-tight underline-offset-[6px] transition-colors hover:text-accent hover:underline"
						>
							Lihat cara kerjanya
							<ArrowRight
								weight="regular"
								className="size-3.5 transition-transform group-hover:translate-x-0.5"
							/>
						</a>
					</motion.div>
				</div>

				<motion.div {...m(0.32)} className="md:col-span-5 lg:col-span-5">
					<div className="relative aspect-[4/5] w-full overflow-hidden border border-border/70">
						<img
							src={UNSPLASH('photo-1758685848122-64a287c1abde', 900, 1125)}
							alt="Pengajar sedang menulis catatan di buku"
							loading="eager"
							className="absolute inset-0 size-full object-cover grayscale"
						/>
						<div className="pointer-events-none absolute inset-0 bg-foreground/[0.03] mix-blend-multiply" />
					</div>
				</motion.div>
			</div>
		</section>
	);
}

function StatsStrip() {
	const m = useReveal();
	const stats = [
		{
			value: '3',
			label: 'format ekspor: PDF, DOCX, Google Forms',
		},
		{
			value: '4',
			label: 'jenis soal: pilihan ganda, benar-salah, isian, esai',
		},
		{
			value: '2',
			label: 'sumber: dokumen Anda atau pencarian internet',
		},
	];

	return (
		<section className="border-border/60 border-b">
			<div className="mx-auto max-w-350 px-6 py-16 md:px-12 md:py-20">
				<div className="grid grid-cols-1 md:grid-cols-3">
					{stats.map((s, i) => (
						<motion.div
							key={s.value}
							{...m(i * 0.08)}
							className={cn(
								'flex flex-col gap-3 py-6 md:px-8 md:py-2',
								i > 0 && 'border-border/70 border-t md:border-t-0 md:border-l',
								i === 0 && 'md:pl-0',
								i === stats.length - 1 && 'md:pr-0',
							)}
						>
							<span className="font-serif text-6xl text-foreground leading-none tracking-tight md:text-7xl">
								{s.value}
							</span>
							<p className="max-w-[28ch] text-muted-foreground text-sm leading-relaxed">
								{s.label}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}

function CaraKerja() {
	const m = useReveal();
	const headM = useReveal();

	const steps = [
		{
			icon: FileText,
			title: 'Pilih sumber',
			body: 'Unggah PDF atau DOCX, atau ketik kueri pencarian. Sumber yang sama bisa digunakan berkali-kali tanpa unggah ulang.',
			image: UNSPLASH('photo-1762427907123-c7ab022a5de7', 1000, 750),
			alt: 'Tumpukan dokumen di atas meja',
		},
		{
			icon: Sliders,
			title: 'Atur parameter',
			body: 'Tentukan jumlah, tingkat kesulitan, dan jenis soal yang Anda butuhkan. Setiap kelas, setiap topik.',
			image: UNSPLASH('photo-1606326608606-aa0b62935f2b', 1000, 750),
			alt: 'Tangan menulis dengan pena di kertas bermargin',
		},
		{
			icon: Sparkle,
			title: 'Hasilkan',
			body: 'Soal muncul satu per satu sambil dihasilkan. Tutup tab pun proses tetap berjalan di server, hasil tersimpan otomatis.',
			image: UNSPLASH('photo-1763098844157-d0fffcc966a1', 1000, 750),
			alt: 'Ruang kelas dengan cahaya jendela',
		},
	];

	return (
		<section id="cara-kerja" className="scroll-mt-24 border-border/60 border-b">
			<div className="mx-auto max-w-350 px-6 py-24 md:px-12 md:py-32">
				<motion.div {...headM(0)} className="max-w-2xl pb-2">
					<Eyebrow className="pb-1">cara kerjanya</Eyebrow>
					<h2 className="mt-5 font-serif text-4xl leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
						Dari sumber ke soal, <em className="text-accent">tiga sentuhan</em>.
					</h2>
				</motion.div>

				<div className="mt-16 md:mt-24">
					{steps.map((step, i) => {
						const Icon = step.icon;
						const flip = i % 2 === 1;
						return (
							<motion.div
								key={step.title}
								{...m(i * 0.04)}
								className="border-border/70 border-t py-12 md:py-20"
							>
								<div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
									<div className={cn('md:col-span-5', flip && 'md:order-2')}>
										<Icon
											weight="regular"
											className="size-7 text-accent"
											aria-hidden
										/>
										<h3 className="mt-6 font-serif text-3xl leading-tight tracking-tight md:text-4xl">
											{step.title}
										</h3>
										<p className="mt-5 max-w-[42ch] text-base text-muted-foreground leading-relaxed md:text-lg">
											{step.body}
										</p>
									</div>
									<div className={cn('md:col-span-7', flip && 'md:order-1')}>
										<div className="relative aspect-[4/3] w-full overflow-hidden border border-border/70">
											<img
												src={step.image}
												alt={step.alt}
												loading="lazy"
												className="absolute inset-0 size-full object-cover grayscale"
											/>
											<div className="pointer-events-none absolute inset-0 bg-foreground/[0.04] mix-blend-multiply" />
										</div>
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

function Fitur() {
	const m = useReveal();
	const headM = useReveal();

	return (
		<section className="border-border/60 border-b">
			<div className="mx-auto max-w-350 px-6 py-24 md:px-12 md:py-32">
				<motion.div {...headM(0)} className="max-w-3xl">
					<h2 className="font-serif text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
						Ditulis untuk pengajaran{' '}
						<em className="text-accent">sehari-hari</em>.
					</h2>
					<p className="mt-6 max-w-[55ch] text-base text-muted-foreground leading-relaxed md:text-lg">
						Empat keputusan desain yang membuat QuestGen terasa seperti alat
						pengajar, bukan sekadar pembungkus model bahasa.
					</p>
				</motion.div>

				<div className="mt-14 grid grid-cols-1 gap-px bg-border/70 md:mt-20 md:grid-cols-3 md:grid-rows-[auto_auto_auto]">
					<motion.div
						{...m(0)}
						className="bg-background p-8 md:col-span-2 md:row-span-2 md:p-12"
					>
						<BookOpen
							weight="regular"
							className="size-7 text-accent"
							aria-hidden
						/>
						<h3 className="mt-8 font-serif text-3xl leading-[1.1] tracking-tight md:text-4xl lg:text-5xl">
							Sumber yang dapat Anda tunjuk.
						</h3>
						<p className="mt-5 max-w-[48ch] text-base text-muted-foreground leading-relaxed md:text-lg">
							Unggah materi kurikulum sebagai PDF atau DOCX. QuestGen memetakan
							isinya menjadi potongan-potongan terindeks. Setiap soal yang
							dihasilkan berakar pada baris yang dapat Anda lacak kembali.
						</p>
						<div className="relative mt-10 aspect-[16/9] w-full overflow-hidden border border-border/70">
							<img
								src={UNSPLASH('photo-1631557777127-6495c07ba6b9', 1200, 675)}
								alt="Tumpukan dokumen dan buku catatan di meja kerja"
								loading="lazy"
								className="absolute inset-0 size-full object-cover grayscale"
							/>
							<div className="pointer-events-none absolute inset-0 bg-foreground/[0.04] mix-blend-multiply" />
						</div>
					</motion.div>

					<motion.div
						{...m(0.08)}
						className="flex flex-col bg-muted p-8 md:row-span-2 md:p-10"
					>
						<Export
							weight="regular"
							className="size-7 text-accent"
							aria-hidden
						/>
						<h3 className="mt-8 font-serif text-2xl leading-[1.1] tracking-tight md:text-3xl">
							Tiga jalan keluar.
						</h3>
						<p className="mt-4 max-w-[32ch] text-muted-foreground text-sm leading-relaxed md:text-base">
							Cetak, kirim, atau langsung dipakai daring.
						</p>
						<ul className="mt-10 flex flex-1 flex-col justify-end gap-5 font-serif text-foreground text-lg">
							<li className="flex items-baseline justify-between border-border/70 border-t pt-4">
								<span>PDF</span>
								<span className="font-sans text-muted-foreground text-xs uppercase tracking-[0.14em]">
									cetak
								</span>
							</li>
							<li className="flex items-baseline justify-between border-border/70 border-t pt-4">
								<span>DOCX</span>
								<span className="font-sans text-muted-foreground text-xs uppercase tracking-[0.14em]">
									sunting
								</span>
							</li>
							<li className="flex items-baseline justify-between border-border/70 border-t pt-4">
								<span>Google Forms</span>
								<span className="font-sans text-muted-foreground text-xs uppercase tracking-[0.14em]">
									daring
								</span>
							</li>
						</ul>
					</motion.div>

					<motion.div
						{...m(0.12)}
						className="flex flex-col bg-background p-8 md:p-10"
					>
						<ClockCounterClockwise
							weight="regular"
							className="size-7 text-accent"
							aria-hidden
						/>
						<h3 className="mt-6 font-serif text-2xl leading-[1.15] tracking-tight md:text-3xl">
							Setiap set tersimpan, siap dipanggil lagi.
						</h3>
						<p className="mt-4 max-w-[34ch] text-muted-foreground text-sm leading-relaxed md:text-base">
							Duplikasi untuk semester berikutnya, atau ubah satu nomor sebelum
							dicetak.
						</p>
						<div className="relative mt-8 aspect-[3/2] w-full overflow-hidden border border-border/70">
							<img
								src={UNSPLASH('photo-1771172193679-cce75ed26588', 800, 533)}
								alt="Rak arsip dengan dokumen tersusun"
								loading="lazy"
								className="absolute inset-0 size-full object-cover grayscale"
							/>
							<div className="pointer-events-none absolute inset-0 bg-foreground/[0.04] mix-blend-multiply" />
						</div>
					</motion.div>

					<motion.div
						{...m(0.16)}
						className="flex flex-col bg-background p-8 md:col-span-2 md:p-12"
					>
						<MagnifyingGlass
							weight="regular"
							className="size-7 text-accent"
							aria-hidden
						/>
						<div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-5 md:gap-10">
							<h3 className="font-serif text-2xl leading-[1.1] tracking-tight md:col-span-3 md:text-3xl lg:text-4xl">
								Tutup tab, prosesnya tetap berjalan.
							</h3>
							<p className="text-base text-muted-foreground leading-relaxed md:col-span-2">
								Setiap soal disimpan begitu jadi. Buka kembali halaman yang
								sama, lanjutkan dari mana terhenti, tanpa kehilangan satu pun.
							</p>
						</div>
						<div className="mt-10 flex items-center gap-3 border-border/70 border-t pt-6">
							<PencilLine
								weight="regular"
								className="size-4 text-muted-foreground"
								aria-hidden
							/>
							<p className="font-sans text-muted-foreground text-sm tracking-tight">
								Bisa juga disunting setelah dihasilkan.
							</p>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}

function PullQuote() {
	const m = useReveal();
	return (
		<section className="border-border/60 border-b">
			<div className="mx-auto max-w-350 px-6 py-24 md:px-12 md:py-32">
				<div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
					<motion.div {...m(0)} className="md:col-span-2">
						<Quotes
							weight="regular"
							className="size-10 text-accent md:size-12"
							aria-hidden
						/>
					</motion.div>
					<motion.blockquote {...m(0.08)} className="md:col-span-10">
						<p className="font-serif text-3xl leading-[1.2] tracking-tight md:text-4xl lg:text-5xl">
							Saya menyiapkan kuis untuk tiga kelas dalam{' '}
							<em className="text-accent">satu pagi</em>. Yang biasanya memakan
							waktu seminggu.
						</p>
						<footer className="mt-10 flex flex-col gap-1 border-border/70 border-t pt-6 md:flex-row md:items-baseline md:justify-between">
							<cite className="font-serif text-foreground text-lg not-italic">
								Dewi Lestari
							</cite>
							<span className="font-sans text-muted-foreground text-sm tracking-tight">
								Guru Sejarah, SMA Negeri 3 Bandung
							</span>
						</footer>
					</motion.blockquote>
				</div>
			</div>
		</section>
	);
}

function FinalCTA() {
	const m = useReveal();
	return (
		<section className="border-border/60 border-b">
			<div className="mx-auto max-w-350 px-6 py-24 md:px-12 md:py-32">
				<div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
					<motion.div {...m(0)} className="md:col-span-7">
						<h2 className="font-serif text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
							Soal pertama dalam <em className="text-accent">lima menit</em>.
						</h2>
					</motion.div>
					<motion.div
						{...m(0.08)}
						className="flex flex-col gap-8 md:col-span-5 md:items-start md:pt-6"
					>
						<p className="max-w-[40ch] text-base text-muted-foreground leading-relaxed md:text-lg">
							Daftar gratis. Tanpa kartu kredit, tanpa instalasi. Akun yang sama
							menyimpan dokumen, soal, dan riwayat ekspor Anda.
						</p>
						<Link
							to="/register"
							className={cn(
								buttonVariants({ variant: 'default', size: 'lg' }),
								'h-11 px-5 font-sans text-sm tracking-tight',
							)}
						>
							Mulai membuat soal
							<ArrowRight weight="regular" />
						</Link>
					</motion.div>
				</div>
			</div>
		</section>
	);
}

function Footer() {
	const m = useReveal();
	const cols: Array<{
		title: string;
		items: Array<{ label: string; to: string }>;
	}> = [
		{
			title: 'Produk',
			items: [
				{ label: 'Cara kerja', to: '#cara-kerja' },
				{ label: 'Fitur', to: '/' },
				{ label: 'Dokumentasi', to: '/' },
			],
		},
		{
			title: 'Sumber daya',
			items: [
				{ label: 'Tentang', to: '/' },
				{ label: 'Pertanyaan umum', to: '/' },
				{ label: 'Kontak', to: '/' },
			],
		},
		{
			title: 'Akun',
			items: [
				{ label: 'Masuk', to: '/login' },
				{ label: 'Daftar', to: '/register' },
			],
		},
	];

	return (
		<footer className="bg-background">
			<motion.div
				{...m(0)}
				className="mx-auto max-w-350 px-6 pt-20 pb-12 md:px-12 md:pt-28 md:pb-16"
			>
				<div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
					<div className="md:col-span-5">
						<Link to="/" className="font-serif text-3xl tracking-tight">
							QuestGen
						</Link>
						<p className="mt-4 max-w-[36ch] text-muted-foreground text-sm leading-relaxed">
							Generator soal penilaian untuk pengajar, dengan sumber yang dapat
							Anda tunjuk.
						</p>
					</div>
					<nav
						className="grid grid-cols-2 gap-10 md:col-span-7 md:grid-cols-3"
						aria-label="Navigasi footer"
					>
						{cols.map((col) => (
							<div key={col.title}>
								<h4 className="font-medium font-sans text-foreground/80 text-xs uppercase tracking-[0.18em]">
									{col.title}
								</h4>
								<ul className="mt-5 flex flex-col gap-3">
									{col.items.map((item) => (
										<li key={item.label}>
											{item.to.startsWith('#') ? (
												<a
													href={item.to}
													className="text-muted-foreground text-sm transition-colors hover:text-accent"
												>
													{item.label}
												</a>
											) : (
												<Link
													to={item.to}
													className="text-muted-foreground text-sm transition-colors hover:text-accent"
												>
													{item.label}
												</Link>
											)}
										</li>
									))}
								</ul>
							</div>
						))}
					</nav>
				</div>
				<div className="mt-20 flex flex-col gap-3 border-border/70 border-t pt-8 md:flex-row md:items-center md:justify-between">
					<p className="font-sans text-muted-foreground text-xs tracking-tight">
						© 2026 QuestGen. Dibuat untuk para pengajar.
					</p>
					<p className="font-serif text-foreground/60 text-sm italic">
						Soal yang berarti, dalam menit.
					</p>
				</div>
			</motion.div>
		</footer>
	);
}
