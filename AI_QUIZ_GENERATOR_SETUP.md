# AI Quiz Generator

## Overview

The generator helps teachers draft multiple-choice questions from a **teacher
brief**, not from a hard vocabulary allowlist.

Inputs, in priority order:

1. the example question shapes the teacher ticks;
2. teacher notes and an optional example sentence;
3. optional textbook / worksheet screenshot analysis;
4. classroom discovery tags (Level, Topic, Grammar), which guide the sample only;
5. optional form hints (affirmative, negative, yes/no, wh-question, fill the gap, find the mistake);
6. open lexicon examples used as a **soft** level assistant on the full-question call.

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

1. Teacher completes quiz setup (title, description, tags, type) and chooses
   **Create Questions** or the premium **AI Generate** path.
2. AI Generate opens with those setup values already filled. The teacher can add
   notes, paste one example question, and optionally hint at forms to try.
3. Optional image analysis returns an editable lesson summary.
4. **Show 6 examples** asks Gemini for question stems only: no answers and no
   image keywords. About half stay close to the teacher's example. The rest are
   other forms of the same language point. Tags do not add a second task.
   Find-the-mistake items use four complete sentences as options, not a single
   word to swap. Fill-the-gap items stay as a blank plus a word or short phrase.
5. The teacher ticks the shapes to keep, can edit a stem, and chooses how many
   questions to write (10, 15, 20, or another count from 1 to 20).
6. Gemini writes the full multiple-choice items, with answers and image keywords,
   split across the ticked shapes only.
7. The lexicon adds **non-blocking** level warnings. It does not rewrite a batch
   once shapes have been selected.
8. Teacher reviews each question: edit, approve, reject, regenerate, simplify, keep words,
   and choose among three image suggestions (stored library first, then Pixabay).
9. Only approved questions enter the quiz editor, replacing an empty stub if
   present, and discovery tags sync back to quiz metadata.

## API routes

- `POST /api/ai/analyze-lesson-image` — multipart image upload, ephemeral analysis
- `POST /api/ai/generate-question-shapes` — six question stems plus an answer-style line
- `POST /api/ai/generate-questions` — accepts a `GenerationBrief` (+ quiz type). `selectedShapes` binds the batch to the stems the teacher ticked.

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
