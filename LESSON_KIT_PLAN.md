# Lesson kit

Read against `origin/main` at `b9085e1`. Plan only. No feature code in this change.

A teacher already has a quiz. The first slice lets them open that quiz from the profile and add two pieces: a printable worksheet, and a single-player Sentence Builder. Each of those waits for a check first: an AI pass that says whether the quiz fits the activity and converts it when it does not, then a teacher pass in the same spirit as the AI question review. Funny Faces and storytelling stay later. They show up as cards, and they do nothing yet.

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
| **Add worksheet** | Live. Opens the check for a worksheet, then the print page. |
| **Add sentence builder** | Live. Opens the check for sentences, then single-player Sentence Builder. |
| **Funny Faces** | Same white button, caption **Later**. No route. |
| **Storytelling** | Same white button, caption **Later**. No route. |

Worksheet and Sentence Builder use the white card. Leave the violet treatment for AI generate on the quiz form. When a piece has already been approved, the caption changes to **Open** and the button goes to that piece. Opening it again can rerun the check. It does not skip ahead and generate a pile of new lines.

## The check

This sits in front of both live cards. Nothing is printed, and no Sentence Builder bank is built, until the teacher commits the approved rows.

### AI assessment

Add one route next to `POST /api/ai/generate-questions`. Use the same Gemini text call that route already uses (`generateText`). Send the saved questions (stem, answers, `correctAnswer`, type, `imageUrl`) and the target: `worksheet` or `sentence-builder`. Do not call `generate-questions` to invent a new quiz. Do not write the `Question` rows.

A gap item does not need the model to fill the blank. Apply this rule first, for Sentence Builder:

```text
question:      "he is ___ the ball"
answers:       ["kicking", "kick", "kicks", "kicked"]
correctAnswer: "kicking"
type:          MULTIPLE_CHOICE
```

The blank is `___` or `_____`. `FILL_IN_THE_BLANK` is unused. When the type is `MULTIPLE_CHOICE`, the stem has a blank, there are exactly four answers, and `correctAnswer` is one of them, the converted sentence is **he is kicking the ball**. The editor's multiple-choice form is four boxes. Mark the item converted. Leave the stored row as the blank and the four choices, so Team Quiz, Splash Dash, Ninja Climb, and Tug of War still score `answerText === correctAnswer`.

Send the model the items that rule cannot handle: no blank, fewer than four answers, or `correctAnswer` holding sorting or matching JSON. For each one it returns `compatible`, a short reason, and a converted line when it can make one. A vocabulary stem ("What color is the sky?" / Blue) is not yet a sentence. The model may offer a sentence, or say it does not fit. It does not invent three extra forms of "he" or "the ball".

For a worksheet, a multiple-choice item with a stem and two to four choices is already a line: picture, stem, choices to circle. A gap stays a blank on the paper (`he is ______ the ball`). Sorting and matching JSON is not a worksheet line. The model can offer a plain sentence or a circle-the-answer line. The raw JSON is not what gets printed.

The lexicon audit on `generate-questions` is a soft warning. That route says it never rejects the batch for a lexicon mismatch. This check does the same. Warnings can show. They do not drop a row.

### Teacher check

Reuse `AIQuestionReviewPanel` (`src/components/management_ui/AIQuestionReviewPanel.tsx`).

Today `AIGenerationForm` does this after a successful `generate-questions` response: it sets `reviewQuestions` with `status: 'pending'`, and the `if (reviewQuestions)` branch replaces the brief with the panel. Each row is `pending`, `approved`, or `rejected`. The teacher edits the stem in the text field and the answers in the row. The green check approves. The trash control rejects, and **Restore** brings it back. **Regenerate** calls `generate-questions` again with `numberOfQuestions: 1`. The footer is **Add N approved questions to quiz**. `toPlainQuestions` keeps only `status === 'approved'`. Zero approved shows "Approve at least one question before adding to the quiz." Level warnings open a dialog and still let the teacher add the rows. `onCancel` is **Back to brief**.

The lesson screen does that same swap. **Add worksheet** or **Add sentence builder** runs the assessment, then the card grid is replaced by the panel. One row per source question. The editable text is the worksheet line or the converted sentence, plus the short reason when the model converted it or refused it. The source question is shown so the teacher can see what it came from. Approve and reject stay. Commit is **Use N approved items**. Cancel is **Back to pieces**. Regenerating one row re-runs the assessment for that item only.

Picking an image also sets `approved` in the current panel (a suggestion click, or paste). That is how a new quiz question gets its picture. This check is "is this good?" Add a purpose on the panel so the quiz flow is unchanged and this use hides the keyword pills, the image grid, and paste-to-approve. The check button is the approval.

Commit writes only the approved rows. Rejected rows are left out. The `Question` table is not updated. The converted sentence is not written into `correctAnswer`.

Worksheet print uses the approved lines. Sentence Builder plays the approved sentences. Approving a sentence does not approve a worksheet line. The other card runs the check again for its own target.

## 2. Worksheet

After the teacher commits the worksheet check, **Add worksheet** goes to `/quizzes/[id]/print`.

No quiz worksheet exists. Story print (`src/app/tools/story-creator/[storyId]/print/page.tsx`) is the pattern to copy: a `no-print` toolbar, then `window.print()`. No PDF library. That story page stays the 2×2 picture worksheet. This page is a different layout.

Header is the quiz title, plus Name and Date lines, matching the story sheet. Each approved item prints its picture when `imageUrl` is a real picture (skip the placeholder), the line the teacher approved, and the choices to circle when those were kept. A gap stem that was approved as a blank stays a blank. The stored question is not changed.

## 3. Sentence Builder

After the teacher commits the sentence check, the approved sentences are the activity.

Turn each approved sentence into a `SentencePrompt` (`src/lib/pixi-games/sentence-builder/content.ts`):

- The word that filled the blank is the only choice. Its `options` are the question's four answers, and `correct` is `correctAnswer`.
- Every other word is a fixed tile: `correct` set, no choices. `renderSentence` already draws an earlier slot as a solid tile. Skip fixed slots instead of asking for a word the quiz never stored.
- The picture is the question's `imageUrl`, then the quiz cover, then `/images/placeholder.webp`.

`SentenceBuilderGame` takes `LaunchOptions` `{ mode, focus, sounds, random? }` and, in `init`, sets `this.bank = promptsForFocus(this.focus)`. Add an optional `prompts` list. When it is set, that list is the bank. When it is absent, the built-in 20 scenes and 8 focuses stay as they are.

`SentenceBuilderScreen` (`src/components/game_ui/sentence-builder/SentenceBuilderScreen.tsx`) is what `/practice/sentence-builder` renders, and it always asks the player to pick one of those eight focuses. Pass the approved prompts in and skip that picker. New route: `/quizzes/[id]/sentence-builder`. The screen still owns its own Pixi `Application`. It does not go through `PixiEngine`, `GameConfig`, or the classroom eligibility gate. Score Run length is the number of approved sentences, not 20.

Word Bite and Sentence Swim keep reading the built-in pack. They can take this prompt list in a later part. This slice does not open them.

If every row is rejected, or none can become a sentence, the card says so and does not start a game.

## What slice 1 stores

One row, created the first time the teacher opens **Add a piece** for that quiz:

| Field | Slice 1 |
| --- | --- |
| `authorId`, `quizId`, `title` | The teacher and the quiz they picked. Title starts as the quiz title. |
| `worksheetItems` | JSON of the approved worksheet lines. Empty until that check is committed. |
| `sentences` | JSON `{ text, imageUrl?, questionId? }[]` of the approved sentences. Empty until that check is committed. |

No `storyId`, no `thoughtChallengeId`, no share token, no assignment category. Those belong to the later parts. The paper sheet is still not a file. It is the approved lines rendered for print.

## Later parts

The two inert cards become real in this order. Not in the first slice. Each one goes through this same check before any challenge or story is created.

4. **Funny Faces.** The shipped tool is Thoughts (`/tools/thoughts`, `ThoughtChallenge`, student page `/thoughts/[token]`). Turn the card on. The check seeds a speaking prompt from the target grammar and the first approved sentence ("What is he doing? He is kicking the ball. Say what is happening."). The teacher approves that prompt, then it is saved. Students still build a sticker face and record. The lesson row then stores `thoughtChallengeId`. It does not copy sticker parts or audio onto `Question`.

5. **Storytelling.** Turn the card on. The check shows the story brief (topic, level, the approved sentences as the language to model). After the teacher approves, create the story with the existing `POST /api/stories` path. The teacher still reviews panels in Story Creator and copies `/story/[token]`. The movie stays `/story/[token]/watch/[submissionId]` over `StoryRecording`. The lesson row then stores `storyId`.

Also later, and not one of these five steps: a single-player homework link for the multiple-choice quiz, starting from a story and generating a quiz, Word Bite, Sentence Swim, and Word Play.

The quiz form stays the place questions are written. Its leftover fixes are not this slice: matching publish checks `pair.prompt` / `pair.answer` while the form saves `left` / `right`; AI generation accepts multiple choice only; the generation brief lives in the local draft, not on `Quiz`; a pasted lesson page is discarded after `POST /api/ai/analyze-lesson-image`, while a picture pasted onto a question is stored.

## Build order

One branch off `main`. Stop after any step.

1. Profile screen for an owned quiz. Left rail plus the four cards. Worksheet and Sentence Builder open the check. Funny Faces and Storytelling render as **Later**.
2. The check, then `/quizzes/[id]/print` of the approved worksheet lines.
3. The same check for sentences, saved off the question row, then Sentence Builder plays only those sentences.
