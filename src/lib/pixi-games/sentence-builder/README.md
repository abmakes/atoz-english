# Sentence Builder

Built-in ESL practice game. It does not load a teacher quiz. Pictures, grammar targets, and word choices live in [`content.ts`](content.ts).

## Play

1. The student sees one activity picture and a grammar instruction (`Present simple`, `Use wasn't`, `Ask a question with What`, and so on).
2. Four choices appear for the **next word only**. Keys `1`–`4` match the buttons.
3. A correct word locks into the sentence. The next set of choices appears.
4. Each sentence has a 20-second timer. Finishing scores **100 points**, plus up to **100** more for time remaining.
5. A wrong word in **Score Run** costs 2.5 seconds and that choice is removed. In **Survival**, one wrong word or a timeout ends the run.

Score Run asks 20 questions, one per picture, shuffled. Survival walks the full prompt bank and reshuffles without repeating the sentence that just finished.

The same 20 pictures are reused for present simple, present continuous, WH questions, `am` / `is` / `isn't`, `was` / `were` / `wasn't` / `weren't`, `has` / `have`, and past simple with regular and irregular verbs.

## Code

| File | Role |
|------|------|
| `content.ts` | 20 scenes and the prompt bank |
| `round.ts` | Scoring, penalties, score-run and survival queues |
| `SentenceBuilderGame.ts` | PixiJS v8 view. One `Application` is created in `SentenceBuilderScreen` and destroyed on unmount |
| `src/app/games/sentence-builder/page.tsx` | Route |

Theme colors come from `getPixiThemeConfig('default')`. Scene textures are loaded with `PIXI.Assets` and unloaded in `destroy()`.

This game keeps its own application instead of `PixiEngine` because the content is a fixed practice set, not a quiz handed through `GameConfig`.
