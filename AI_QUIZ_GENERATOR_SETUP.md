# AI Quiz Generator

## Overview

The generator helps teachers draft multiple-choice questions from a **teacher
brief**, not from a hard vocabulary allowlist.

Inputs, in priority order:

1. teacher notes and optional model sentence;
2. optional textbook / worksheet screenshot analysis;
3. classroom discovery tags (Level, Topic, Grammar);
4. AI-only controls (sentence form, question style, vocabulary focus);
5. open lexicon examples used as a **soft** level assistant.

Publisher book names, unit sequences, and proprietary wordlists are not
generation inputs. Screenshot images are processed in memory and discarded.

## Environment

```env
GEMINI_QUIZ_API_KEY="your_gemini_api_key_here"
```

Optional for image suggestions in the review step:

```env
NEXT_PUBLIC_PIXABAY_API_KEY="your_pixabay_key"
```

## Supported scope

- Pre-A1
- A1
- A2
- B1

These bands are app-authored curriculum estimates, not an official
certification. Lexicon levels remain provisional.

## Teacher-first generation flow

1. Teacher writes notes and/or pastes a lesson page image.
2. Optional image analysis returns an editable brief (summary, level, topics,
   grammar, vocabulary, question styles). Analysis never auto-generates.
3. Teacher confirms Level / Topic / Grammar discovery tags plus AI controls.
4. A plain-language brief summary is shown before the Gemini call.
5. Gemini drafts questions from the full `GenerationBrief`.
6. The lexicon adds **non-blocking** level warnings and replacement suggestions.
7. Teacher reviews each question: edit, approve, reject, regenerate, simplify, keep words,
   and choose among three image suggestions (stored library first, then Pixabay).
8. Only approved questions enter the quiz editor, replacing an empty stub if
   present, and discovery tags sync back to quiz metadata.

## API routes

- `POST /api/ai/analyze-lesson-image` — multipart image upload, ephemeral analysis
- `POST /api/ai/generate-questions` — accepts a `GenerationBrief` (+ quiz type)

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

- **Multiple-choice only:** AI generation is disabled for other quiz types with
  an immediate explanation in the form.
- **Invalid question format:** Gemini did not return the required JSON shape.
- **Image analysis failed:** check MIME type (PNG/JPEG/WebP) and the 8 MB limit.
- **Lexicon build checksum error:** an upstream file changed; review and pin a
  deliberate source update instead of accepting it silently.
