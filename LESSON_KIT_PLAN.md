# Lesson kit

Read against `origin/main` at `b9085e1`. Plan only. No feature code in this change.

A teacher can already make one quiz, including with AI and a pasted image. The next step is a **lesson**: take that quiz (or a story) and produce the rest of the class from it. The home for this is the profile tab.

This follows the quiz content plan. Classroom games keep playing `Question` rows. Sentence Builder, Word Bite, and Sentence Swim share one practice pack. That pack is not stored in `correctAnswer`. Story and video stay on `Story` / `StoryPanel` / `StoryRecording`. Word Play is a later practice-page rebuild and is not part of this kit.

## Where it lives today

| Piece | Today |
| --- | --- |
| Profile | Nav label **Profile** goes to `/quizzes`. `ProfileShell` in `src/app/quizzes/page.tsx` is Published, Drafts, Liked, and Favorites. Owned quizzes come from `GET /api/quizzes?authorId=me`. Drafts are `localStorage` (`src/lib/quiz-draft-storage.ts`), not the database. A card can edit, play (`/games/:id`), or delete. No lessons, stories, or speaking tasks. |
| Quiz form | `QuizEditor` (`src/components/management_ui/QuizEditor.tsx`) on `/create` and `/quizzes/[id]/edit`. Steps: setup, questions, publish. Questions can be typed (`QuizForm`), uploaded as CSV (`UploadForm`), pasted as a prompt (`PromptImportForm`), or generated (`AIGenerationForm`). `QuizTypeGrid` offers Multiple Choice, Sorting, and Matching. |
| Pasted image, two different jobs | **Lesson page:** `LessonPageCapture` on the AI form and on `StoryBriefForm`. `POST /api/ai/analyze-lesson-image` returns level, topics, grammar, vocabulary, and patterns. The file is not stored. **Question picture:** `PasteQuestionImageButton` → `POST /api/images/upload` saves a WebP and sets `question.imageUrl`. |
| AI generation | `POST /api/ai/generate-question-shapes`, then `POST /api/ai/generate-questions`, then `AIQuestionReviewPanel`. The brief is `GenerationBrief` in `src/lib/ai/generation-brief.ts`. Approved rows become normal `Question`s. Generation accepts multiple choice only. |
| Story assignment | `Story` has `shareToken` from `createShareToken()` (`src/lib/stories/tokens.ts`). Students open `/story/[token]` with no account, record per panel, and the teacher reviews submissions. The movie is `/story/[token]/watch/[submissionId]`. Print is `/tools/story-creator/[storyId]/print` (`window.print()`, no PDF). |
| Funny Faces | The shipped name is **Thoughts** (`/tools/thoughts`). One `ThoughtChallenge` is a speaking prompt plus a class link. Students build a sticker face from `public/images/thoughts/` and record. `allowFunnyVoices` is already on the challenge. Same token helper, student page `/thoughts/[token]`. |
| Practice | `/practice` lists Sentence Builder, Word Bite, and Sentence Swim. All three read `src/lib/pixi-games/sentence-builder/content.ts` (20 pictures × 8 focuses). Word Bite and Sentence Swim derive their rounds in `src/lib/pixi-games/word-chompers/content.ts`. The code and tests call that pair the word chompers. No route is named Word Snap. |
| Class quiz play | `/games/:quizId` → setup with teams (the panel starts at two) → Team Quiz, Splash Dash, Ninja Climb, or Tug of War. They load `GET /api/quizzes/:id` and score `answerText === correctAnswer`. |

There is no worksheet for a quiz, no single-player homework link, and no record that ties a quiz to a story or a speaking task.

## Quiz form, kept as it is

Teachers stay on this form. A lesson does not replace it.

The form still needs these fixes. They are not this project. Do them when that screen is touched, and do not block the kit on them:

- Matching publish checks `pair.prompt` and `pair.answer` (`QuizEditor`). The form and `POST /api/questions` save `left` and `right`, so a matching quiz cannot reach publish.
- AI generation returns an error for every type except `MULTIPLE_CHOICE`.
- `FILL_IN_THE_BLANK` is on the enum and unused. A gap item is a multiple-choice stem that contains `___` or `_____`.
- The generation brief (notes, model sentence, lesson summary, ticked shapes) exists only inside the local draft. `Quiz` does not store it.
- A pasted lesson page is discarded after analysis. Only a picture pasted onto a question is kept.
- Drafts never leave the browser.

What the lesson screen has to ask, because the quiz row does not:

- **One target grammar**, a single value from `GRAMMAR_TAGS` (`src/lib/taxonomy/quiz-taxonomy.ts`). Quiz tags are a flat list and can mix level, topic, and several grammar labels. `resolveGrammarTags`, `resolveTopicTags`, and `levelFromTags` can pre-fill the screen from those tags.
- Level, topic, and a notes box when the tags and the draft brief are thin.
- Characters and story type when a story will be made. `StoryBriefForm` already collects these. The quiz form does not.
- A speaking prompt when Funny Faces will be made. `ThoughtChallenge` only stores `title` and `prompt`.

## The lesson record

New table. It points at the pieces. It does not copy their rows.

| Field | Holds |
| --- | --- |
| `authorId`, `title` | Owner and the name shown on the profile. |
| `targetGrammar` | One grammar tag, required. `Present Continuous` is the tag the quiz taxonomy already uses. |
| `level`, `topic`, `notes` | The extras above. Level uses the same CEFR strings as quiz tags (`A1`, …). |
| `quizId` | The class quiz. Also the quiz sent home. Null until a story-first lesson has generated one. |
| `storyId` | Storytelling piece. Null until created. The story row stays the source of panels, audio, and the movie. |
| `thoughtChallengeId` | Funny Faces piece. |
| `practicePackId` | Set when a pack has been written for the practice games. |
| `sentences` | JSON list the teacher can edit: `{ text, imageUrl?, questionId? }`. These are full sentences, not blanks. |

Child tables are unnecessary for that short list.

**Assignments** use the story-link pattern and add a category. `Story` and `ThoughtChallenge` already have their own `shareToken`, status (`DRAFT` / `READY` / `ARCHIVED`), and submission review. Keep those. Add one `Assignment` row per thing that goes home:

| Category | Points at | Student URL |
| --- | --- | --- |
| `HOMEWORK_QUIZ` | `quizId`, plus a new `shareToken` from `createShareToken()` | `/homework/[token]` (new page) |
| `SPEAKING` | `thoughtChallengeId` | existing `/thoughts/[token]` |
| `STORY` | `storyId` | existing `/story/[token]` |

Class play and the paper worksheet are not assignments. Resetting a homework link rotates only that assignment token. `/games/:quizId` stays the class URL.

## From a gap item to a sentence

A lesson reads the quiz as examples. It does not rewrite the stored question. Classroom games still need the blank and the four choices.

```text
question:      "he is ___ the ball"
answers:       ["kicking", "kick", "kicks", "kicked"]
correctAnswer: "kicking"
type:          MULTIPLE_CHOICE
```

Replace the blank with `correctAnswer` → **he is kicking the ball**. That string, and the question's `imageUrl` if it has one, go into `sentences`. The teacher can fix the wording.

Only do this when the type is `MULTIPLE_CHOICE`, the stem contains a blank, there are 2–4 answers, and `correctAnswer` is one of them. A find-the-mistake item (four full sentences, no blank) stays on the quiz. A vocabulary item with no blank stays on the quiz. Say so on the lesson page.

`Present Continuous` on the lesson maps to the practice focus `present-continuous` in `sentence-builder/content.ts`. The pack's eight focuses are a shorter list than `GRAMMAR_TAGS` (it splits past simple into regular and irregular, and it has no tag for every grammar label). Other tags still get a quiz, a worksheet, homework, a speaking prompt, and a story. They get Sentence Builder slots only after a focus exists for that tag.

## The four kit pieces

Once the lesson has a target grammar and its sentences, the profile lesson page shows these four. The same quiz is also what goes home.

### 1. Quiz to play in class — reused

`lesson.quizId` is the quiz they started from. **Play in class** goes to `/games/:quizId`. Team Quiz, Splash Dash, Ninja Climb, and Tug of War are unchanged. Eligibility stays multiple choice, 2–4 answers.

Started from a story instead: take each panel `exampleSentence`, plus `targetGrammar`, level, and topic, and call the existing generate-questions route. Save a new multiple-choice `Quiz` and set `quizId`. The teacher reviews it in the current review panel before it is attached. Story panels are not copied onto `Question`.

### 2. Funny Faces for home — reused Thoughts

Create a `ThoughtChallenge` through the existing thoughts service. Title from the lesson. Prompt seeded from the grammar and the first sentence, then edited:

> What is he doing? He is kicking the ball. Say what is happening.

Set status to `READY`, add a `SPEAKING` assignment, and copy `/thoughts/:shareToken`. Students still build the sticker face and record. The teacher still approves clips. Picture-led grammars such as present continuous are the ones this seed fits. The prompt is just text, so any lesson can still send one.

### 3. Worksheet for class — new

No quiz worksheet exists. Story print is a 2×2 picture page and stays that.

Add `/quizzes` → lesson → print. Same technique as the story print page: HTML, `@media print`, `window.print()`. Header is the lesson title, a name line, and the target grammar. Each question prints its `imageUrl` when it has one, the stem, and the choices to circle. Gap items can print the blank instead of the answer. A toggle shows or hides the example sentences. Images come from question rows and from `sentences[].imageUrl`. A lesson-page screenshot cannot be printed, because that upload is never stored.

### 4. Storytelling for home — reused Story Creator

Call the existing story create path (`StoryBriefForm` / `POST /api/stories`) with the lesson topic, level, `targetGrammar` as `grammarFocus`, notes, and the example sentences as the language to model. Default art style stays the story default. The teacher still reviews the four panels, mouths, and the example story in Story Creator, then copies `/story/:shareToken`. Video stays the watch page over `StoryRecording`. The lesson only stores `storyId`.

The other direction uses the same record. Profile lists the teacher's stories (`GET /api/stories`). **Start a lesson** on a story sets `storyId`, asks for target grammar if the story tags do not already have one, and then piece 1 generates the quiz.

### Same quiz, sent home — new player, same rows

`HOMEWORK_QUIZ` is how the quiz is reused as single-player homework. New page `/homework/[token]`: one player, the question image, the choices, a score at the end. No teams, no power-ups, no `GameSetupPanel`. Load the same questions the class games load. Score the same way (`selected === correctAnswer`). Students need no account, matching `/story/[token]` and `/thoughts/[token]`.

### Practice games — one pack, written from the sentences

The filled sentence is not yet something Sentence Builder can play. Each word needs the correct form and three other forms of that word (`WordSlot` in `content.ts`). Word Bite and Sentence Swim already derive from those prompts. They should keep doing that.

Generate a practice pack in the shape the content plan already specifies (`PracticeScene` + `PracticePrompt`, four options per slot, `options` includes `correct`). One question image becomes one scene. Store it as `PracticePack`, and set `practicePackId`. Open the three games with `?pack=`. Missing pack falls back to the built-in 20 scenes.

Word Bite can also take the gap row directly, before a pack exists: clue = stem, answer = `correctAnswer`, decoys = the other answers, example = the filled sentence. That is a `BiteQuestion` only. It does not produce swim pools or builder slots.

Sentence Swim needs several agreeing sentences across pictures. Offer it when the lesson has at least four sentences of one focus. One sentence is enough for a speaking prompt and for a single Word Bite item. It is not a swim round.

There is no Word Snap mode to feed. The sentence goes to Sentence Builder (one word at a time), Word Bite (the word chomper), and Sentence Swim.

## Reuse and new

| Reuse | New |
| --- | --- |
| Quiz form, AI brief, both paste paths, review panel | `Lesson` and `Assignment` |
| `Quiz` / `Question` and the four class games | Profile **Lessons** tab, and start-from-quiz / start-from-story |
| `createShareToken`, story and thoughts student pages, submission review | `/homework/[token]` single-player page |
| Story create, story print, story movie | Quiz worksheet print page |
| Thoughts sticker catalog and recording | Seeded speaking prompt from the lesson sentence |
| `biteQuestions`, `swimFrames`, `promptsForFocus` | Pack JSON generated from the lesson sentences, `?pack=` |

Leave alone: putting slots or pairs into `correctAnswer`; playing practice games through `GameConfig`; folding story audio or sticker faces into `Question`; Word Play; a matching or sorting player; the built-in 20-scene editor (that stays with the practice-pack work).

## Build order

One branch off `main`. Every step shows up on the profile. Stop after any step and the earlier pieces still work.

1. **Lesson on the profile.** Table, `GET/POST /api/lessons`. New Lessons tab beside Published. **Create a lesson** asks for target grammar, level, topic, and notes, and saves. **Start a lesson** on an owned quiz card pre-fills those from its tags and sets `quizId`. List owned stories on the profile and let one start a lesson the same way. No generation yet.
2. **Sentences.** On the lesson page, fill blanks from the attached quiz and show the list. Teacher edits and saves `sentences`. **Play in class** links to `/games/:quizId`.
3. **Worksheet.** Print route from the quiz images and questions. This is the class paper piece.
4. **Homework quiz.** `HOMEWORK_QUIZ` assignment, copy link, `/homework/[token]` plays that quiz for one student.
5. **Funny Faces.** Create the `ThoughtChallenge`, link it, copy the thoughts link.
6. **Story, both directions.** From the lesson, create the story and link it. From a story-first lesson, generate the multiple-choice quiz with the current AI route, review it, and set `quizId`.
7. **Practice pack.** Write the pack from the confirmed sentences. Sentence Builder, Word Bite, and Sentence Swim take `?pack=`. Word Bite's gap import can land in this step for lessons that only have blank items.

After step 6 the kit the teacher asked for is complete: a quiz to play in class, Funny Faces speaking for home, a worksheet for class, and storytelling for home. Step 4 is the quiz sent home. Step 7 is the same sentences in the practice games.
