const footerColumns = [
  {
    title: 'Produk',
    links: ['Fitur', 'Harga', 'Integrasi', 'Changelog'],
  },
  {
    title: 'Perusahaan',
    links: ['Tentang Kami', 'Tim', 'Karir', 'Blog'],
  },
  {
    title: 'Sumber Daya',
    links: ['Dokumentasi', 'API Referensi', 'Komunitas', 'Dukungan'],
  },
];

export function FooterSection() {
  return (
    <footer className="px-8 py-12 md:px-16">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="font-serif text-xl tracking-tight">QuestGen</div>
          <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
            Pembuatan soal ujian yang effortless dengan kecerdasan buatan.
          </p>
        </div>
        {footerColumns.map((col) => (
          <div key={col.title}>
            <div className="font-semibold text-xs uppercase tracking-wider">
              {col.title}
            </div>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#!"
                    className="text-muted-foreground text-xs transition-colors hover:text-foreground"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 border-border border-t pt-6 text-muted-foreground text-xs">
        &copy; {new Date().getFullYear()} QuestGen. Hak cipta dilindungi.
      </div>
    </footer>
  );
}
