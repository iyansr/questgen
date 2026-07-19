#!/usr/bin/env python3
"""Build samples/catalog.json and refresh samples/gold for all eligible samples."""

from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[3] if False else Path(".")
SAMPLES = Path("samples")
MAX_PAGES = 80

TOPIC_OVERRIDES = {
    1: "Sistem Reproduksi pada Manusia",
    2: "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    3: "Pewarisan Sifat pada Makhluk Hidup",
    4: "Tekanan Zat dan Penerapannya dalam Kehidupan Sehari-hari",
    5: "Sistem Pernapasan",
    6: "Sistem Ekskresi Manusia",
    10: "Sistem Reproduksi pada Manusia",
    11: "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    12: "Pewarisan Sifat pada Makhluk Hidup",
    13: "Kemagnetan dan Pemanfaatannya",
    14: "Bioteknologi",
    15: "Partikel Penyusun Benda dan Makhluk Hidup",
    22: "Gerak Benda dan Makhluk Hidup",
    23: "Usaha dan Pesawat Sederhana",
    24: "Struktur dan Fungsi Tumbuhan",
    31: "Pola Bilangan",
    32: "Koordinat Kartesius",
    33: "Relasi dan Fungsi",
    35: "Statistika",
}

COUNTS_OVERRIDES = {
    1: [{"type": "multiple_choice", "count": 10}],
    2: [{"type": "multiple_choice", "count": 7}],
    3: [
        {"type": "multiple_choice", "count": 10},
        {"type": "short_answer", "count": 3},
        {"type": "essay", "count": 2},
    ],
}

PAGE_NOISE = re.compile(
    r"\s*\d{2,3}\s*(?:Kelas .+?Semester \d+|Ilmu Pengetahuan Alam|MATEMATIKA)\s*",
    re.I,
)


def grade_from_title(title: str | None) -> tuple[str, str]:
    if not title:
        return "SMP", "VIII"
    m = re.search(r"Kelas\s+(VII|VIII|IX|7|8|9)", title, re.I)
    if not m:
        return "SMP", "VIII"
    g = m.group(1).upper()
    g = {"7": "VII", "8": "VIII", "9": "IX"}.get(g, g)
    return "SMP", g


def clean_text(text: str) -> str:
    text = PAGE_NOISE.sub(" ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n+", "\n", text)
    return text


def extract_mcq(text: str, max_n: int = 20) -> list[dict]:
    cut = re.search(r"\n?\s*B\.\s*Jawablah dengan benar", text, re.I)
    if not cut:
        cut = re.search(r"\n?\s*B\.\s*Uraian|\n?\s*B\.\s*Esai", text, re.I)
    block = text[: cut.start()] if cut else text
    t = re.sub(r"\s+", " ", block)
    pattern = re.compile(
        r"(\d+)\.\s+(.*?)\s+A\.\s+(.*?)\s+B\.\s+(.*?)\s+C\.\s+(.*?)\s+D\.\s+(.*?)(?=\s+\d+\.\s+|B\.\s+(?:Jawab|Uraian|Esai)|$)",
        re.DOTALL,
    )
    questions = []
    seen = set()
    for m in pattern.finditer(t):
        num = int(m.group(1))
        if num in seen or num > max_n:
            continue
        seen.add(num)
        stem = m.group(2).strip()
        if len(stem) < 8:
            continue
        opts = [
            {"label": lab, "text": re.sub(r"\s+", " ", raw.strip())}
            for lab, raw in zip("ABCD", m.groups()[2:])
        ]
        questions.append(
            {
                "number": num,
                "questionType": "multiple_choice",
                "questionText": stem,
                "options": opts,
                "correctAnswer": None,
                "section": "A",
            }
        )
    return questions


def extract_open(text: str) -> list[dict]:
    m = re.search(
        r"B\.\s*(?:Jawablah dengan benar pertanyaan berikut!|Uraian|Esai)\s*(.*)",
        text,
        re.I | re.S,
    )
    if not m:
        return []
    block = m.group(1)
    stop = re.search(
        r"Melacak Sejarah|Ayo,\s*Kita Kerjakan|Permasalahan|Proyek|Refleksi",
        block,
    )
    if stop:
        block = block[: stop.start()]
    t = re.sub(r"\s+", " ", block).strip()
    items = list(re.finditer(r"(?:^|\s)(\d+)\.\s+", t))
    out = []
    for i, im in enumerate(items):
        num = int(im.group(1))
        start = im.end()
        end = items[i + 1].start() if i + 1 < len(items) else len(t)
        body = t[start:end].strip()
        if len(body) < 20:
            continue
        qtype = (
            "essay"
            if (re.search(r"\ba\.\s+", body, re.I) or "Jelaskan" in body or len(body) > 220)
            else "short_answer"
        )
        out.append(
            {
                "number": num,
                "questionType": qtype,
                "questionText": body,
                "options": None,
                "correctAnswer": None,
                "section": "B",
            }
        )
        if len(out) >= 8:
            break
    return out


def build_catalog_and_gold() -> None:
    gold_dir = SAMPLES / "gold"
    gold_dir.mkdir(parents=True, exist_ok=True)
    catalog = []
    samples = sorted(
        SAMPLES.glob("sample-*"), key=lambda p: int(p.name.split("-")[1])
    )

    for s in samples:
        n = int(s.name.split("-")[1])
        meta = (
            json.loads((s / "meta.json").read_text())
            if (s / "meta.json").exists()
            else {}
        )
        mats = s / "materials.pdf"
        ex = s / "exercise.pdf"
        mp = len(PdfReader(str(mats)).pages)
        ep = len(PdfReader(str(ex)).pages)
        raw = clean_text(
            "\n".join((p.extract_text() or "") for p in PdfReader(str(ex)).pages)
        )
        (gold_dir / f"sample-{n}.raw.txt").write_text(raw, encoding="utf-8")

        mcqs = extract_mcq(raw, max_n=25)
        openq = extract_open(raw)
        uji = bool(re.search(r"Uji\s*Kompetensi|Pilihan\s*Ganda|Pilihlah", raw, re.I))

        topic = TOPIC_OVERRIDES.get(n, meta.get("source_title") or f"Sample {n}")
        grade, class_grade = grade_from_title(meta.get("source_title"))
        if n in (1, 2, 3, 10, 11, 12):
            grade, class_grade = "SMP", "IX"

        duplicate_of = {10: 1, 11: 2, 12: 3}.get(n)
        skip_reason = None
        if mp > MAX_PAGES:
            skip_reason = f"materials_pages>{MAX_PAGES}"
        elif duplicate_of:
            skip_reason = f"duplicate_of_sample-{duplicate_of}"
        elif not uji and len(mcqs) < 3:
            skip_reason = "no_uji_kompetensi_mcq"
        elif len(mcqs) < 3:
            skip_reason = "too_few_mcq"

        if n in COUNTS_OVERRIDES:
            counts = COUNTS_OVERRIDES[n]
            # keep gold questions aligned with override counts
            mcq_n = next(c["count"] for c in counts if c["type"] == "multiple_choice")
            mcqs = [q for q in mcqs if q["number"] <= mcq_n][:mcq_n]
            if any(c["type"] != "multiple_choice" for c in counts):
                questions = mcqs + openq[:5]
            else:
                questions = mcqs
        else:
            mcq_n = min(len(mcqs), 10) if mcqs else 5
            counts = [{"type": "multiple_choice", "count": mcq_n}]
            questions = mcqs[:mcq_n]
            if len(openq) >= 3:
                counts.extend(
                    [
                        {"type": "short_answer", "count": min(3, len(openq))},
                    ]
                )
                if len(openq) >= 5:
                    counts.append({"type": "essay", "count": 2})
                questions = mcqs[:mcq_n] + openq[:5]

        payload = {
            "sampleId": f"sample-{n}",
            "topic": topic,
            "grade": grade,
            "classGrade": class_grade,
            "curriculum": "Kurikulum Merdeka",
            "questionTypeCounts": counts,
            "source": str(ex),
            "questions": questions,
        }
        (gold_dir / f"sample-{n}.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        entry = {
            "sampleId": f"sample-{n}",
            "sampleNum": n,
            "topic": topic,
            "grade": grade,
            "classGrade": class_grade,
            "curriculum": "Kurikulum Merdeka",
            "source_title": meta.get("source_title"),
            "bab": meta.get("bab"),
            "materialsPages": mp,
            "exercisePages": ep,
            "mcqDetected": len(mcqs),
            "openDetected": len(openq),
            "goldQuestions": len(questions),
            "hasUjiKompetensi": uji,
            "questionTypeCounts": counts,
            "skipReason": skip_reason,
            "duplicateOf": f"sample-{duplicate_of}" if duplicate_of else None,
            "evalEligible": skip_reason is None,
        }
        catalog.append(entry)
        flag = "OK" if entry["evalEligible"] else "SKIP"
        print(
            f"{flag:4} sample-{n:<2} gold={len(questions):2} mcq={len(mcqs):2} pages={mp:3} | {topic}"
        )

    (SAMPLES / "catalog.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    eligible = [c for c in catalog if c["evalEligible"]]
    print(f"\nWrote catalog: eligible {len(eligible)}/{len(catalog)}")


if __name__ == "__main__":
    build_catalog_and_gold()
