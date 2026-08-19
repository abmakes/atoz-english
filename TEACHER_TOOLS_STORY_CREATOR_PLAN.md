# Teacher Tools & Story Creator — Implementation Plan

**Status:** Proposal — no code written yet.
**Owner surface:** New "Teacher Tools" tab; first tool is the **Story Creator** (Cambridge Movers storytelling practice).

---

## 1. Product summary

Cambridge YLE Movers includes a speaking task where students see a 4-picture story and narrate what happens in each picture. The Story Creator turns that into a full classroom workflow:

1. **Teacher generates a story** from a topic prompt (or a pasted textbook screenshot), with level/grammar controls and an AI-written example story to model the target language.
2. **Teacher reviews**: regenerates any weak picture, edits example sentences, and places a cartoon mouth on the character in each picture.
3. **Teacher prints** a 2×2 worksheet with writing lines under each picture; students write their own version of the story on paper.
4. **Teacher shares a link**; students (often on a parent's phone) open it, record one voice clip per picture, listen back, re-record if needed, and submit.
5. **Output**: a playable "movie" performed live in the browser — a virtual camera zooms and pans across the 4 pictures while the student's audio plays and the character's mouth animates in sync with the voice. **No video file is ever generated.** Teacher reviews submissions; the movie page is shareable; optional file download via in-browser capture is a later bonus.

Future tools under the same tab (placeholders only for now): class timer, random name picker.

---

## 2. What we reuse from the existing app

| Need | Existing system we build on |
|------|------------------------------|
| Teacher auth & route protection | Clerk + `requireAuth` (`src/lib/auth.ts`), middleware pattern used by `/create` and `/quizzes` |
| Topic / level / grammar selection | `src/lib/taxonomy/quiz-taxonomy.ts` categories + `TagDrawer` UI |
| Paste-a-screenshot → structured brief | `LessonPageCapture` component + `POST /api/ai/analyze-lesson-image` (Gemini multimodal) |
| AI text generation & prompt patterns | `src/lib/ai/` (`generation-brief.ts`, `quiz-generation.ts`), same `GEMINI_QUIZ_API_KEY` |
| Age-appropriate vocabulary control | Soft lexicon audit (`src/lib/lexicon/`) applied to generated example stories |
| File storage (images, audio) | Vercel Blob (`@vercel/blob`), same pattern as quiz/question image uploads |
| Student access without accounts | Public-URL pattern used by `/games/[quizId]/...`, hardened with unguessable tokens |
| Canvas rendering & animation | PixiJS v8 already in the stack — used for the mouth-placement editor and the lip-synced movie player |
| DB & validation | Prisma → PostgreSQL, Zod schemas in `src/lib/schemas.ts` conventions |

**Net-new capabilities** (nothing in the codebase does these today):

1. **AI image generation** — 4 story panels with a consistent character.
2. **Browser audio recording** — MediaRecorder + mic permissions, mobile-first.
3. **Printing** — print-optimized worksheet page.
4. **Share tokens & anonymous submissions** — student-facing write path.

---

## 3. User flows

### 3.1 Teacher: create a story

```
/tools  →  /tools/story-creator/new
```

1. **Brief step** (mirrors the AI quiz wizard):
   - Free-text story idea / topic prompt.
   - Optional: paste a lesson screenshot (reuse `LessonPageCapture` → analyze route) to auto-fill topic, grammar, vocabulary, and level.
   - Level (Pre-A1/A1/A2), grammar focus (multi-select from taxonomy — e.g. Past Simple for Movers storytelling), story type (everyday mishap, adventure, funny surprise…), main character description (e.g. "a girl and her dog").
2. **Generate**: one Gemini text call produces a structured story plan:
   - Story title.
   - 4 scene descriptions (beginning → problem → action → resolution, the Movers narrative arc).
   - An **example story** — 1–2 sentences per picture in the target grammar, run through the soft lexicon audit so vocabulary is level-appropriate.
   - A consistent character sheet (appearance description reused in every image prompt).
   Then 4 image-generation calls (`gemini-2.5-flash-image`, same Gemini API key) produce the panels. Panel 1 is generated from the character sheet; panels 2–4 pass panel 1 (or the previous panel) as a reference image to keep the character consistent.
3. **Review step**:
   - 2×2 preview of the panels; each has **Regenerate picture** (optionally with a tweak note: "make the dog bigger") and an editable example sentence.
   - Regeneration replaces only that panel, again passing a kept panel as the character reference.
4. **Mouth placement step**:
   - On generate, we ask Gemini vision for the main character's mouth bounding box per panel (it already does structured JSON extraction for lesson images, so this is the same pattern). That gives an automatic default.
   - A small Pixi (or plain absolutely-positioned DOM) editor lets the teacher drag/resize/rotate a cartoon mouth sprite on each picture, and pick a mouth style (big cartoon lips, duck bill, monster mouth — exaggerated is the point). Stored as normalized coordinates `{x, y, scale, rotation, style}` per panel.
5. **Save** → story goes to the teacher's story list at `/tools/story-creator` with actions: Print, Share link, View submissions.

### 3.2 Teacher: print the worksheet

`/tools/story-creator/[storyId]/print` — a print-optimized page (A4 portrait):

- Header: story title, name/date line, and optionally the example story in a box ("Read the example, then write your own").
- 2×2 grid; under each picture, 3–4 ruled writing lines.
- Toggle before printing: include example sentences under each picture (scaffolded) or blank lines only (freer practice).
- Implementation: plain HTML + `@media print` CSS + `window.print()`. No PDF library needed for v1; the browser's "Save as PDF" covers file export.

### 3.3 Student: record via link

Teacher copies a link like `/story/[token]` (unguessable token, no login).

Mobile-first, giant buttons, minimal text (students are ~8 years old, possibly on a parent's phone):

1. **Landing**: story title, the 4 pictures, "Type your name" (first name only), big Start button. First tap requests mic permission with a friendly explainer screen ("We need your microphone so you can tell the story!").
2. **Per-picture loop** (picture 1 → 4): the picture fills the screen; tap the big red button to record; tap again to stop; auto-playback follows immediately with **"Sounds good ✓"** / **"Try again ↻"** buttons. Re-recording is unlimited. A live waveform/level meter shows recording is working.
3. **Review screen**: all four recordings play in sequence over the pictures — the student previews their whole movie (with the mouth animating) before submitting. Any picture can be re-recorded from here.
4. **Submit**: uploads the 4 audio clips; friendly "Your movie was sent to your teacher!" confirmation. Recordings are held in memory/IndexedDB until submit so a flaky connection doesn't lose work.

### 3.4 Teacher: review and the final movie

`/tools/story-creator/[storyId]/submissions`:

- List of submissions (student name, time, status).
- Each opens the **cinematic movie player** (see §6): a full-screen Pixi stage with a virtual camera that zooms and pans across the panels while the mouth animates to the student's audio — the movie is *performed live in the browser*, never encoded as a video file. Title card with the story title and student name; end card ("A film by Mia").
- Teacher can mark a submission reviewed, or delete it (re-recording is just the student opening the link again).
- The movie page itself is shareable read-only via its own token (`/story/[token]/watch/[submissionId]`), so parents can watch on any device. Optional file download is a bonus, not a requirement (see §7).

---

## 4. Data model (Prisma additions)

```prisma
model Story {
  id            String   @id @default(cuid())
  authorId      String
  title         String
  topicPrompt   String
  tags          String[]              // reuse discovery tags: level, topic, grammar
  storyType     String?
  characterSheet String?              // AI character description reused for regeneration
  exampleStory  String?               // full example text (also printed)
  status        StoryStatus @default(DRAFT)   // DRAFT | READY | ARCHIVED
  shareToken    String   @unique      // student link token (regenerable)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  panels        StoryPanel[]
  submissions   StorySubmission[]
}

model StoryPanel {
  id              String  @id @default(cuid())
  storyId         String
  order           Int                    // 1–4
  imageUrl        String                 // Vercel Blob
  sceneDescription String                // AI scene text (used for regeneration)
  exampleSentence String?
  mouth           Json?                  // {x, y, scale, rotation, style} normalized 0–1
  story           Story   @relation(...)
  @@unique([storyId, order])
}

model StorySubmission {
  id          String   @id @default(cuid())
  storyId     String
  studentName String
  status      SubmissionStatus @default(SUBMITTED)  // SUBMITTED | REVIEWED
  createdAt   DateTime @default(now())
  recordings  StoryRecording[]
  story       Story    @relation(...)
}

model StoryRecording {
  id            String @id @default(cuid())
  submissionId  String
  panelOrder    Int
  audioUrl      String        // Vercel Blob
  mimeType      String        // audio/webm (Chrome/Android) or audio/mp4 (iOS Safari)
  durationMs    Int
  submission    StorySubmission @relation(...)
  @@unique([submissionId, panelOrder])
}
```

Notes:

- `tags String[]` matches the existing `Quiz.tags` convention (no join table).
- Mouth placement in normalized coordinates so it survives any render size (print, phone, movie player).
- `shareToken` is a long random slug; the teacher can regenerate it to revoke old links.

## 5. API routes

All teacher routes use `requireAuth`; student routes authenticate by token only.

| Route | Purpose |
|-------|---------|
| `POST /api/stories/generate` | Brief → story plan (Gemini text) → 4 images (Gemini image) → Blob → create `Story` + panels. Likely split into plan + per-image steps client-side to stay inside serverless time limits and stream progress. |
| `POST /api/stories/[id]/panels/[order]/regenerate` | Regenerate one image (optional tweak note, reference image for consistency) |
| `PATCH /api/stories/[id]` / `PATCH .../panels/[order]` | Edit title, example sentences, mouth placement, status |
| `GET/DELETE /api/stories`, `/api/stories/[id]` | Teacher CRUD |
| `POST /api/stories/[id]/share` | (Re)generate share token |
| `GET /api/story-session/[token]` | Public: story + panels + mouths for the student page (no example story leakage unless teacher enables it) |
| `POST /api/story-session/[token]/submit` | Public: multipart upload of name + 4 audio clips → Blob → `StorySubmission`. Validated: max clip duration (~60 s), max size (~5 MB each), audio MIME types only, rate-limited per token. |
| `GET /api/stories/[id]/submissions` | Teacher: list/review submissions |

The existing `/api/ai/analyze-lesson-image` route is reused as-is for the screenshot-to-brief path; we extend its output mapping into the story brief the same way `AIGenerationForm` maps it into the quiz brief.

## 6. Lip sync & movie playback

**Core decision: the movie is never encoded as a video file.** It is performed live in the browser by a Pixi stage — mouth animation + virtual camera + audio. This removes video generation from the product entirely; file download becomes an optional bonus (§7).

### Lip sync: amplitude-driven mouth animation

Not phoneme-level — for exaggerated cartoon mouths, volume-driven animation reads as "talking" and is entirely client-side:

1. Precompute an **amplitude envelope** (RMS per ~50 ms window) once at submit time via Web Audio and store it alongside the recording (small JSON). Playback then never touches audio analysis — it just looks up `envelope[t]`.
2. Each mouth style is a tiny frame set (closed / half / open / wide); envelope value maps to frame + a slight scale wobble. Deliberately simple and very forgiving.

### Virtual camera: making 4 stills feel like a film

All four panels live in one Pixi container laid out as a **horizontal 1×4 filmstrip** (the *player* layout is independent of the 2×2 *print* layout — same images, arranged however the camera wants). The "camera" is just an animated transform on that container:

- **Ken Burns per panel**: while a panel's audio plays, the camera slowly zooms in (odd panels) or out (even panels), with gentle ease-in/out. Static image + moving camera + moving mouth + voice = film, not slideshow.
- **Transitions between panels**: default is a smooth lateral **pan/sweep** along the strip to the next panel (single-axis, accordion feel). Alternative transition styles (fade-to-black, crossfade) are a per-story or per-player setting — cheap to offer since they're all just container/alpha tweens.
- **Framing**: 16:9 letterbox with black bars; title card in, end card out. Panel duration = that clip's audio length + a beat of padding.
- The whole performance is **deterministic**: given the images, mouth placements, envelopes, and clip durations, frame `t` is a pure function of time. That matters for §7.

Same player component is used in three places: student preview (§3.3 step 3), teacher review, and the shared watch page — one code path.

The player follows existing engine rules where it applies (single Pixi lifecycle owned by a React view, destroyed on unmount), but it's a lightweight standalone stage — it does **not** need the full `PixiEngine`/manager/RuleEngine stack, which is quiz-game infrastructure.

## 7. Download options (all optional, none require a video-generation server)

The shareable **watch page is the primary deliverable** — replayable on any device, nothing to encode or store. If teachers want a file, options in ascending effort:

| Option | How | Output | Trade-offs |
|--------|-----|--------|------------|
| **A. Share link only** (default) | Watch URL with its own token | — | Zero cost; requires internet to view |
| **B. Realtime canvas capture** | `canvas.captureStream()` + Web Audio destination → `MediaRecorder` | WebM | Near-zero code on top of the player; records in realtime (2-min movie = 2-min wait); desktop Chrome/Edge |
| **C. WebCodecs offline render** | Because playback is deterministic (§6), render frame-by-frame with `VideoEncoder`/`AudioEncoder` + `mp4-muxer` | Real MP4, faster than realtime | More code; Chrome/Edge only — fine for a teacher-side export button |
| **D. ffmpeg.wasm** | Encode/mux in-browser via wasm ffmpeg | MP4/WebM | ~30 MB wasm download, slower than C, no advantage here — not recommended |
| **E. Server-side render** (Remotion / ffmpeg worker) | Background worker or rendering service | MP4 at scale | Real infra + cost; doesn't fit Vercel serverless; only if bulk auto-generation is ever needed |

**Plan: ship A with the player; add B as the first export button if requested; upgrade to C if teachers need MP4 specifically.** D and E are documented dead ends unless requirements change.

## 8. Recording: mobile constraints we design around

- **iOS Safari records `audio/mp4`**, Chrome/Android `audio/webm` — we store the MIME type per clip and play back via `<audio>`/Web Audio, both of which handle either. No transcoding needed.
- Mic permission must be requested from a **user gesture**; the friendly explainer screen provides it.
- Clips stay client-side until final submit (memory/IndexedDB), so partial progress isn't lost and re-records don't hit the network.
- Hard caps: ~60 s per clip, ~5 MB per file, server-validated.

## 9. Safety & privacy (children's voice recordings)

- First names only, no accounts, no emails for students.
- Recordings are only reachable via unguessable tokens + the owning teacher's authed routes; never listed publicly.
- Teacher can delete submissions; add a retention note in the UI (e.g. auto-delete after 90 days — implement as a cron/scheduled cleanup later).
- Mic permission language is parent-friendly; nothing records without an explicit tap.

## 10. Teacher Tools tab

- New nav item **Tools** in `Navigation.tsx` (protected like Create/Profile via middleware `/tools(.*)`).
- `/tools` is a card grid: **Story Creator** (live), **Class Timer** and **Random Name Picker** (disabled "coming soon" cards) — establishes the surface for future tools with near-zero extra work.

## 11. Build phases

Each phase is a shippable PR; order chosen so risk is proven early.

1. **Phase 1 — Tools hub + skeleton.** Nav item, `/tools` page with cards, middleware protection, empty `/tools/story-creator` list page. *(Small: nav + 2 pages.)*
2. **Phase 2 — Spike: image generation + recording feasibility.** Throwaway-quality but real: one route calling `gemini-2.5-flash-image` for a 4-panel set with a reference image for consistency, and a bare recording test page (MediaRecorder on iOS Safari + Android Chrome). **Go/no-go on character consistency and mobile recording before building the full product.**
3. **Phase 3 — Story generation pipeline.** Prisma models + migrations, brief UI (with screenshot paste reuse), story plan + example story generation with lexicon audit, image generation → Blob, review UI with per-panel regenerate, story CRUD.
4. **Phase 4 — Mouth placement + printout.** Auto mouth detection via Gemini vision, drag/resize editor, mouth styles; print page with scaffold toggle.
5. **Phase 5 — Student recording flow + submissions.** Share tokens, public session API, mobile recording UX (record → playback → confirm/redo per picture → full preview → submit), Blob upload, teacher submissions list.
6. **Phase 6 — Cinematic movie player.** Pixi player with amplitude-envelope lip sync and the virtual camera (filmstrip layout, Ken Burns zoom, pan/fade transitions, title/end cards), used in preview/review/watch pages; shareable watch links. **No video encoding.** Export buttons (§7 options B/C) only if teachers ask for files.

## 12. Key risks & open questions

| Risk | Mitigation |
|------|------------|
| Character consistency across 4 generated panels | Reference-image chaining + character sheet in every prompt; per-panel regenerate as the escape hatch; Phase 2 spike validates before we commit |
| Image generation cost/quota on the Gemini key | 4 images per story + regenerates; show generation progress, debounce regenerate, consider per-teacher daily caps |
| Serverless timeouts on generation | Split plan/image calls into separate short requests orchestrated from the client with visible progress |
| iOS Safari MediaRecorder quirks | Phase 2 spike on a real device; store native MIME per clip; fall back messaging if unsupported browser |
| Mouth auto-detection accuracy | It's only a default — the teacher editor is the source of truth |
| Storage growth (audio + images on Blob) | Size caps, teacher delete, later retention cron |

**Open decisions to confirm before Phase 3:** whether the example story is visible to students on the recording page (or paper-only); whether one story link is shared class-wide (proposed — simplest) vs per-student links; mouth style art (commission/generate a small sprite set).
