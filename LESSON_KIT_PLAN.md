# Lesson kit

Read against `origin/main` at `b9085e1`. Plan only. No feature code in this change.

A teacher already has a quiz. The first slice lets them open that quiz from the profile and add two pieces: a printable worksheet, and a single-player Sentence Builder. Funny Faces and storytelling stay later parts. They show up as cards, and they do nothing yet.

Classroom games keep playing `Question` rows. The practice pack stays out of `correctAnswer`. Story and video stay on `Story`, `StoryPanel`, and `StoryRecording`. Word Play stays a later practice-page rebuild.

## 1. Profile cards

Nav **Profile** is `/quizzes` (`ProfileShell` in `src/app/quizzes/page.tsx`: Published, Drafts, Liked, Favorites). An owned quiz card in `QuizList` can edit, play (`/games/:id`), or delete. Add one action on an owned quiz: open `/quizzes/[id]/lesson`.

That screen copies the question-source step in `QuizEditor`, the block that renders when `creationStep === 'content'` and `questionsList` is empty (`src/components/management_ui/QuizEditor.tsx`).

The editor is a row:

- **Left rail** (`lg:basis-1/4`). White panel, `border-[--border-dark]`, hard shadow `4px 4px 0`. It shows the quiz title, question count, cover (`aspect-[16/9]`, hidden on small screens), description, and tag badges.
- **Center panel** (`basis-3/4`). The same white border and hard shadow, `rounded-lg`. This is the square in the middle. Empty state is centered: a heading, one line of help, then a grid.

The grid is `grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2`. Each source is a `<button>`:

- at least `9rem` tall, column, centered, `rounded-xl`, `border-2`, shadow `4px 4px 0`
- a 48px round icon, a `text-base font-semibold` label, a `text-xs` caption
- white cards use `hover:bg-[--primary-light]`
- the AI card is the violet one: `border-violet-700 bg-violet-600 text-white`

The four buttons today are **Add question** (Plus, "Write it manually"), **Upload file** (Upload), **Prompt** (ClipboardCopy, "Copy for ChatGPT / Gemini"), and **AI generate** (Sparkles, "Create with AI").

Reuse that markup. Do not draw a new card style. On the lesson screen the left rail is the quiz they already saved (title, count, cover, description, tags). The center heading is **Add a piece**. The grid is the same two-by-two:

| Card | Slice 1 |
| --- | --- |
| **Add worksheet** | Live. Opens the print page. |
| **Add sentence builder** | Live. Builds the sentences, then opens single-player Sentence Builder. |
| **Funny Faces** | Same white button, caption **Later**. No route. |
| **Storytelling** | Same white button, caption **Later**. No route. |

Worksheet and Sentence Builder use the white card. Leave the violet treatment for AI generate on the quiz form. When a piece already exists, the caption changes to **Open** and the button goes to that piece.

## 2. Worksheet

**Add worksheet** goes to `/quizzes/[id]/print`.

No quiz worksheet exists. Story print (`src/app/tools/story-creator/[storyId]/print/page.tsx`) is the pattern to copy: a `no-print` toolbar, then `window.print()`. No PDF library. That story page stays the 2×2 picture worksheet. This page is a different layout.

Load `GET /api/quizzes/:id`. Header is the quiz title, plus Name and Date lines, matching the story sheet. Each multiple-choice question prints its `imageUrl` when it has a real picture (skip the placeholder), the stem, and the choices to circle. A gap stem stays a blank on the paper (`he is ______ the ball`). The stored row is not changed. Questions that are not multiple choice are left off the sheet. The class games already refuse them.

## 3. Sentence Builder

**Add sentence builder** reads the same quiz and plays it in the existing single-player game.

A gap item is already multiple choice. The blank is only the `___` or `_____` in the stem. `FILL_IN_THE_BLANK` is unused.

```text
question:      "he is ___ the ball"
answers:       ["kicking", "kick", "kicks", "kicked"]
correctAnswer: "kicking"
type:          MULTIPLE_CHOICE
```

Replace the blank with `correctAnswer` → **he is kicking the ball**. Keep the `Question` row as the blank and the four choices, so Team Quiz, Splash Dash, Ninja Climb, and Tug of War still score `answerText === correctAnswer`.

Use the item only when the type is `MULTIPLE_CHOICE`, the stem has a blank, there are exactly four answers, and `correctAnswer` is one of them. The editor's multiple-choice form is four boxes. Fewer than four, or no blank, stays on the quiz. Say that on the screen. A vocabulary item does not become a sentence.

Show the filled sentences before play. The teacher can edit the words. Save that list as JSON on a row that points at `quizId`. Do not write it into `correctAnswer`.

Turn each saved sentence into a `SentencePrompt` (`src/lib/pixi-games/sentence-builder/content.ts`):

- The word that filled the blank is the only choice. Its `options` are the question's four answers, and `correct` is `correctAnswer`.
- Every other word is a fixed tile: `correct` set, no choices. `renderSentence` already draws an earlier slot as a solid tile. Skip fixed slots instead of asking for a word the quiz never stored. Do not invent three extra forms of "he" or "the ball" in this slice.
- The picture is the question's `imageUrl`, then the quiz cover, then `/images/placeholder.webp`.

`SentenceBuilderGame` takes `LaunchOptions` `{ mode, focus, sounds, random? }` and, in `init`, sets `this.bank = promptsForFocus(this.focus)`. Add an optional `prompts` list. When it is set, that list is the bank. When it is absent, the built-in 20 scenes and 8 focuses stay as they are.

`SentenceBuilderScreen` (`src/components/game_ui/sentence-builder/SentenceBuilderScreen.tsx`) is what `/practice/sentence-builder` renders, and it always asks the player to pick one of those eight focuses. Pass the quiz prompts in and skip that picker. New route: `/quizzes/[id]/sentence-builder`. The screen still owns its own Pixi `Application`. It does not go through `PixiEngine`, `GameConfig`, or the classroom eligibility gate. Score Run length is the number of sentences from this quiz, not 20.

Word Bite and Sentence Swim keep reading the built-in pack. They can take this prompt list in a later part. This slice does not open them.

If the quiz has no gap items, the card says so and does not start a game.

## What slice 1 stores

One row, created the first time the teacher opens **Add a piece** for that quiz:

| Field | Slice 1 |
| --- | --- |
| `authorId`, `quizId`, `title` | The teacher and the quiz they picked. Title starts as the quiz title. |
| `sentences` | JSON `{ text, imageUrl?, questionId? }[]` after Sentence Builder is generated. Empty until then. |

No `storyId`, no `thoughtChallengeId`, no share token, no assignment category. Those belong to the later parts. The worksheet is not stored. It is the quiz rendered for print.

## Later parts

The two inert cards become real in this order. Not in the first slice.

4. **Funny Faces.** The shipped tool is Thoughts (`/tools/thoughts`, `ThoughtChallenge`, student page `/thoughts/[token]`). Turn the card on. Seed `prompt` from the target grammar and the first filled sentence ("What is he doing? He is kicking the ball. Say what is happening."). The teacher edits that prompt. Students still build a sticker face and record. The lesson row then stores `thoughtChallengeId`. It does not copy sticker parts or audio onto `Question`.

5. **Storytelling.** Turn the card on. Create a story with the existing `POST /api/stories` path, using the quiz topic, level, and the filled sentences as the language to model. The teacher still reviews panels in Story Creator and copies `/story/[token]`. The movie stays `/story/[token]/watch/[submissionId]` over `StoryRecording`. The lesson row then stores `storyId`.

Also later, and not one of these five steps: a single-player homework link for the multiple-choice quiz, starting from a story and generating a quiz, Word Bite, Sentence Swim, and Word Play.

The quiz form stays the place questions are written. Its leftover fixes are not this slice: matching publish checks `pair.prompt` / `pair.answer` while the form saves `left` / `right`; AI generation accepts multiple choice only; the generation brief lives in the local draft, not on `Quiz`; a pasted lesson page is discarded after `POST /api/ai/analyze-lesson-image`, while a picture pasted onto a question is stored.

## Build order

One branch off `main`. Stop after any step.

1. Profile screen for an owned quiz. Left rail plus the four cards. Worksheet and Sentence Builder navigate. Funny Faces and Storytelling render as **Later**.
2. `/quizzes/[id]/print` from the quiz's questions and pictures.
3. Fill the gap sentences, save them off the question row, and play them in Sentence Builder.
