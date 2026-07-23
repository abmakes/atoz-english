#!/usr/bin/env python3
"""Build the public AtoZ young-learner lexicon from pinned open sources.

The output is deliberately conservative. CEFR bands are provisional estimates,
not official CEFR classifications. The app exposes confidence and method data so
teachers and future curators can review borderline entries.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
LEXICON_DIR = ROOT / "lexicon"
OUTPUT_PATH = ROOT / "src" / "generated" / "young-learner-lexicon.json"
LOCK_PATH = LEXICON_DIR / "sources.lock.json"
TOPICS_PATH = LEXICON_DIR / "curation" / "topic-seeds.json"
MORPHOLOGY_OVERRIDES_PATH = (
    LEXICON_DIR / "curation" / "morphology-overrides.json"
)
FORM_LEVEL_OVERRIDES_PATH = (
    LEXICON_DIR / "curation" / "form-level-overrides.json"
)

LEVEL_ORDER = {"PRE_A1": 0, "A1": 1, "A2": 2, "B1": 3, "OUT_OF_SCOPE": 4}
VALID_SURFACE = re.compile(r"^[A-Za-z][A-Za-z .'\u2019-]*$")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_sources(lock: dict[str, Any]) -> None:
    failures: list[str] = []
    for source in lock["sources"]:
        for file_info in source.get("files", []):
            path = LEXICON_DIR / file_info["path"]
            if not path.exists():
                failures.append(f"Missing source: {path}")
                continue
            actual = sha256(path)
            if actual != file_info["sha256"]:
                failures.append(
                    f"Checksum mismatch for {path}: expected {file_info['sha256']}, got {actual}"
                )

        cache_path = source.get("cachePath")
        if cache_path:
            path = LEXICON_DIR / cache_path
            if not path.exists():
                failures.append(
                    f"Missing cache source: {path}. Download it from {source['url']}."
                )
                continue
            actual = sha256(path)
            if actual != source["sha256"]:
                failures.append(
                    f"Checksum mismatch for {path}: expected {source['sha256']}, got {actual}"
                )

    if failures:
        raise RuntimeError("\n".join(failures))


def normalize(value: str) -> str:
    return (
        value.strip()
        .replace("\u2019", "'")
        .replace("_", " ")
        .lower()
    )


def read_stats(path: Path, lemma_column: str, rank_column: str) -> dict[str, dict[str, float | int]]:
    rows: dict[str, dict[str, float | int]] = {}
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            lemma = normalize(row[lemma_column])
            rank_text = row[rank_column].strip().rstrip(".")
            if not lemma or not rank_text:
                continue
            rows[lemma] = {
                "rank": int(float(rank_text)),
                "frequencyPerMillion": float(
                    row.get("Adjusted Frequency per Million (U)")
                    or row.get("U (Freq/million")
                    or 0
                ),
            }
    return rows


def read_teaching_forms(path: Path) -> dict[str, set[str]]:
    forms: dict[str, set[str]] = defaultdict(set)
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for raw_row in csv.reader(handle):
            if not raw_row or raw_row[0].strip().startswith("##"):
                continue
            lemma = normalize(raw_row[0])
            if not lemma:
                continue
            forms[lemma].add(lemma)
            for raw_form in raw_row[1:]:
                form = normalize(raw_form)
                if form and len(form) <= 60 and VALID_SURFACE.fullmatch(form):
                    forms[lemma].add(form)
    return forms


def read_supplementary(path: Path) -> tuple[set[str], dict[str, set[str]]]:
    lemmas: set[str] = set()
    forms: dict[str, set[str]] = defaultdict(set)
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.reader(handle):
            if not row:
                continue
            lemma = normalize(row[0])
            if not lemma:
                continue
            lemmas.add(lemma)
            forms[lemma].add(lemma)
            for raw_form in row[1:]:
                form = normalize(raw_form)
                if form and len(form) <= 60 and VALID_SURFACE.fullmatch(form):
                    forms[lemma].add(form)
    return lemmas, forms


def read_wordnet_pos(
    archive_path: Path, candidate_lemmas: set[str]
) -> tuple[dict[str, set[str]], dict[str, int]]:
    pos_by_lemma: dict[str, set[str]] = defaultdict(set)
    sense_count: dict[str, int] = defaultdict(int)
    pos_map = {"n": "noun", "v": "verb", "a": "adjective", "s": "adjective", "r": "adverb"}

    with zipfile.ZipFile(archive_path) as archive:
        entry_files = sorted(
            name for name in archive.namelist() if name.startswith("entries-")
        )
        for name in entry_files:
            with archive.open(name) as handle:
                entries = json.load(handle)
            for written_form, pos_entries in entries.items():
                lemma = normalize(written_form)
                if lemma not in candidate_lemmas:
                    continue
                for raw_pos, details in pos_entries.items():
                    pos = pos_map.get(raw_pos[0].lower())
                    if not pos:
                        continue
                    pos_by_lemma[lemma].add(pos)
                    sense_count[lemma] += len(details.get("sense", []))

    return pos_by_lemma, sense_count


def estimate_level(
    lemma: str,
    ndl: dict[str, dict[str, float | int]],
    ngsl: dict[str, dict[str, float | int]],
    supplementary: set[str],
) -> tuple[str, float, str]:
    if lemma in supplementary:
        return "A1", 0.72, "ngsl-supplementary-young-learner-review"

    if lemma in ndl:
        rank = int(ndl[lemma]["rank"])
        if rank <= 300:
            return "PRE_A1", 0.68, "ndl-young-learner-rank"
        return "A1", 0.78, "ndl-young-learner-membership"

    rank = int(ngsl[lemma]["rank"])
    if rank <= 1200:
        return "A2", 0.58, "ngsl-frequency-band"
    if rank <= 2400:
        return "B1", 0.52, "ngsl-frequency-band"
    return "OUT_OF_SCOPE", 0.45, "ngsl-conservative-b1-ceiling"


def at_least_level(current: str, minimum: str) -> str:
    return minimum if LEVEL_ORDER[minimum] > LEVEL_ORDER[current] else current


def infer_form_levels(
    lemma: str,
    forms: set[str],
    parts_of_speech: set[str],
    base_level: str,
    overrides: dict[str, dict[str, str]],
) -> dict[str, str]:
    form_levels = {form: base_level for form in forms}

    if base_level != "OUT_OF_SCOPE":
        if "verb" in parts_of_speech:
            for form in forms:
                if form != lemma and (form.endswith("ing") or form.endswith("ed")):
                    form_levels[form] = at_least_level(base_level, "A1")

        if "adjective" in parts_of_speech or "adverb" in parts_of_speech:
            for form in forms:
                if form != lemma and (form.endswith("er") or form.endswith("est")):
                    form_levels[form] = at_least_level(base_level, "A1")

    for form, level in overrides.get(lemma, {}).items():
        normalized_form = normalize(form)
        if normalized_form in forms and level in LEVEL_ORDER:
            form_levels[normalized_form] = level

    return dict(sorted(form_levels.items()))


def build() -> dict[str, Any]:
    lock = json.loads(LOCK_PATH.read_text(encoding="utf-8"))
    verify_sources(lock)

    ndl = read_stats(
        LEXICON_DIR / "sources" / "ndl-1.1-stats.csv", "Word", "Rank"
    )
    ngsl = read_stats(
        LEXICON_DIR / "sources" / "ngsl-1.2-stats.csv", "Lemma", "SFI Rank"
    )
    ndl_forms = read_teaching_forms(
        LEXICON_DIR / "sources" / "ndl-1.1-teaching.txt"
    )
    ngsl_forms = read_teaching_forms(
        LEXICON_DIR / "sources" / "ngsl-1.2-teaching.csv"
    )
    supplementary, supplementary_forms = read_supplementary(
        LEXICON_DIR / "sources" / "ngsl-1.2-supplementary.csv"
    )

    candidates = set(ndl) | set(ngsl) | supplementary
    pos_by_lemma, sense_count = read_wordnet_pos(
        LEXICON_DIR / "cache" / "english-wordnet-2025-json.zip", candidates
    )

    raw_topics: dict[str, list[str]] = json.loads(
        TOPICS_PATH.read_text(encoding="utf-8")
    )
    morphology_overrides: dict[str, list[str]] = json.loads(
        MORPHOLOGY_OVERRIDES_PATH.read_text(encoding="utf-8")
    )
    form_level_overrides: dict[str, dict[str, str]] = json.loads(
        FORM_LEVEL_OVERRIDES_PATH.read_text(encoding="utf-8")
    )
    topics_by_lemma: dict[str, set[str]] = defaultdict(set)
    for topic, lemmas in raw_topics.items():
        for lemma in lemmas:
            topics_by_lemma[normalize(lemma)].add(topic)

    entries: list[dict[str, Any]] = []
    level_counts: dict[str, int] = defaultdict(int)
    topic_counts: dict[str, int] = defaultdict(int)

    for lemma in candidates:
        level, confidence, method = estimate_level(lemma, ndl, ngsl, supplementary)
        all_forms = (
            {lemma}
            | ndl_forms.get(lemma, set())
            | ngsl_forms.get(lemma, set())
            | supplementary_forms.get(lemma, set())
        )
        if lemma in morphology_overrides:
            all_forms = {
                normalize(form) for form in morphology_overrides[lemma]
            }
        parts_of_speech = pos_by_lemma.get(lemma, set())
        form_levels = infer_form_levels(
            lemma,
            all_forms,
            parts_of_speech,
            level,
            form_level_overrides,
        )
        topics = sorted(topics_by_lemma.get(lemma, set()))
        for topic in topics:
            topic_counts[topic] += 1
        level_counts[level] += 1

        source_ids: list[str] = []
        if lemma in ndl:
            source_ids.append("ndl-1.1")
        if lemma in ngsl or lemma in supplementary:
            source_ids.append("ngsl-1.2")
        if pos_by_lemma.get(lemma):
            source_ids.append("oewn-2025")

        ranks: dict[str, int] = {}
        if lemma in ndl:
            ranks["ndl"] = int(ndl[lemma]["rank"])
        if lemma in ngsl:
            ranks["ngsl"] = int(ngsl[lemma]["rank"])

        entries.append(
            {
                "id": f"{lemma.replace(' ', '-')}",
                "lemma": lemma,
                "partsOfSpeech": sorted(parts_of_speech),
                "forms": sorted(all_forms),
                "formLevels": form_levels,
                "topics": topics,
                "introducedAt": level,
                "levelConfidence": confidence,
                "levelMethod": method,
                "reviewStatus": "source-backed" if lemma in ndl else "provisional",
                "youngLearnerRelevant": lemma in ndl,
                "senseCount": sense_count.get(lemma, 0),
                "ranks": ranks,
                "sourceIds": source_ids,
            }
        )

    entries.sort(
        key=lambda entry: (
            LEVEL_ORDER[entry["introducedAt"]],
            entry["ranks"].get("ndl", 99999),
            entry["ranks"].get("ngsl", 99999),
            entry["lemma"],
        )
    )

    return {
        "metadata": {
            "name": "AtoZ Young-Learner Lexicon",
            "version": "0.1.0",
            "license": lock["artifactLicense"],
            "scope": ["PRE_A1", "A1", "A2", "B1"],
            "classificationNotice": (
                "Levels are conservative, provisional estimates based on young-learner "
                "membership and frequency. They are not official CEFR classifications."
            ),
            "sourceIds": [source["id"] for source in lock["sources"]],
            "entryCount": len(entries),
            "levelCounts": dict(sorted(level_counts.items())),
            "topicCounts": dict(sorted(topic_counts.items())),
        },
        "entries": entries,
    }


def main() -> int:
    try:
        artifact = build()
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_PATH.write_text(
            json.dumps(artifact, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(
            f"Wrote {artifact['metadata']['entryCount']} entries to "
            f"{OUTPUT_PATH.relative_to(ROOT)}"
        )
        return 0
    except Exception as error:
        print(f"Lexicon build failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
