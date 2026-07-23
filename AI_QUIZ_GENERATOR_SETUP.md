# AI Quiz Generator

## Overview

The generator creates short multiple-choice questions for young learners. It
uses:

- teacher-selected level, topic, word-class, and grammar tags;
- the open AtoZ Young-Learner Lexicon for retrieval;
- Gemini 2.5 Flash Lite for drafting;
- a post-generation language audit that checks questions and answers.

Publisher book names, unit sequences, example sentences, and proprietary
wordlists are not generation inputs.

## Environment

```env
GEMINI_QUIZ_API_KEY="your_gemini_api_key_here"
```

## Supported scope

- Pre-A1
- A1
- A2
- B1

These bands are app-authored curriculum estimates, not an official
certification. The current artifact is intentionally conservative and records
confidence, method, and source provenance for each entry.

## Generation flow

1. The teacher chooses a level and one or more tags.
2. The resolver selects cumulative, in-scope words from the lexicon.
3. Grammar tags add short structural patterns.
4. Gemini receives a bounded vocabulary allowlist.
5. Questions and all four answers are audited.
6. If the draft uses unknown or above-level language, it is rewritten once.
7. A draft that still fails is rejected instead of being silently added.

## Building the lexicon

See [`lexicon/README.md`](lexicon/README.md).

```bash
npm run build:lexicon
npm test
```

The generated app artifact is
`src/generated/young-learner-lexicon.json`. Do not edit it manually.

## Licensing and attribution

The lexical artifact is CC BY-SA 4.0 and is built from pinned snapshots of:

- New Dolch List 1.1;
- New General Service List 1.2;
- Open English WordNet 2025.

Full provenance and notices are in:

- `lexicon/sources.lock.json`
- `lexicon/ATTRIBUTION.md`
- `lexicon/LICENSES/`

CEFR-J is not included in the public artifact because its stated terms do not
clearly grant redistribution of an adapted dataset.

## Troubleshooting

- **Not enough reviewed vocabulary:** broaden the topic or remove a restrictive
  word-class tag.
- **Outside the selected level:** the automatic rewrite failed; adjust the tags
  or try again.
- **Invalid question format:** Gemini did not return the required JSON shape.
- **Lexicon build checksum error:** an upstream file changed; review and pin a
  deliberate source update instead of accepting it silently.
