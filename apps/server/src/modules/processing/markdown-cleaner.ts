const SECTION_HEADINGS_TO_DROP = [
	/^#{1,3}\s+daftar\s+isi\s*$/im,
	/^#{1,3}\s+daftar\s+pustaka\s*$/im,
	/^#{1,3}\s+daftar\s+gambar\s*$/im,
	/^#{1,3}\s+daftar\s+tabel\s*$/im,
	/^#{1,3}\s+daftar\s+lampiran\s*$/im,
	/^#{1,3}\s+table\s+of\s+contents\s*$/im,
	/^#{1,3}\s+list\s+of\s+figures\s*$/im,
	/^#{1,3}\s+list\s+of\s+tables\s*$/im,
	/^#{1,3}\s+(?:references|bibliography)\s*$/im,
];

function stripSection(text: string, pattern: RegExp): string {
	const match = pattern.exec(text);
	if (!match) return text;
	const start = match.index;
	const headingLevel = match[0].match(/^#+/)?.[0].length ?? 1;
	const after = text.slice(start + match[0].length);
	const nextHeadingRe = new RegExp(`^#{1,${headingLevel}}\\s+\\S`, 'm');
	const nextRel = after.search(nextHeadingRe);
	return nextRel === -1
		? text.slice(0, start).trimEnd()
		: text.slice(0, start) + after.slice(nextRel);
}

function stripBoilerplate(text: string): string {
	return text
		.split('\n')
		.filter((line) => {
			const t = line.trim();
			if (/^\d{1,4}$/.test(t)) return false;
			if (/\.{4,}\s*\d+\s*$/.test(t)) return false;
			if (/^-{3,}$/.test(t)) return false;
			return true;
		})
		.join('\n')
		.replace(/\n{3,}/g, '\n\n');
}

export function cleanMarkdown(raw: string): string {
	let text = raw;
	for (const pattern of SECTION_HEADINGS_TO_DROP) {
		text = stripSection(text, pattern);
	}
	return stripBoilerplate(text).trim();
}
