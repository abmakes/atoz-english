# Sentence Builder

Built-in ESL practice game. It does not load a teacher quiz. Pictures, grammar targets, and word choices live in [`content.ts`](content.ts).

## Play

1. The student picks **one** grammar structure, then Score Run or Survival.
2. The student sees one activity picture. The structure name stays on screen for the whole run. A short question appears only when the sentence needs one (`Was she sad?`).
3. Four choices appear for the **next word only**. Keys `1`–`4` match the buttons. The other three choices are forms of the same word (`kicked`, `kick`, `kicks`, `kicking`). Articles stay on the noun (`an apple`, not a separate `a` / `an` / `the` slot).
4. A correct word locks into the sentence. The next set of choices appears.
5. Each sentence has a 20-second timer. Finishing scores **100 points**, plus up to **100** more for time remaining.
6. A wrong word in **Score Run** costs 2.5 seconds and that choice is removed. In **Survival**, one wrong word or a timeout ends the run.

Score Run asks 20 questions from the chosen structure, one per picture, shuffled. The results screen shows how many of those 20 were finished. Survival stays inside that same structure and reshuffles without repeating the sentence that just finished.

The 20 pictures are shared, but a run never mixes structures. The structures are present simple, present continuous, WH questions, `am` / `is` / `are` / `isn't`, `was` / `were` / `wasn't` / `weren't`, `has` / `have`, and past simple with regular and irregular verbs.

The play canvas stays opaque, with `#f7fbff` as its base color, and the pale wash is drawn on that canvas. Startup uses the same `background` option as the version that already ran.

## Code

| File | Role |
|------|------|
| `content.ts` | 20 scenes and eight 20-prompt grammar banks |
| `round.ts` | Scoring, penalties, score-run and survival queues |
| `SentenceBuilderGame.ts` | PixiJS v8 view. One `Application` is created in `SentenceBuilderScreen` and destroyed on unmount |
| `src/app/games/sentence-builder/page.tsx` | Route |

Theme colors come from `getPixiThemeConfig('default')`. Scene textures are loaded with `PIXI.Assets` and unloaded in `destroy()`.

This game keeps its own application instead of `PixiEngine` because the content is a fixed practice set, not a quiz handed through `GameConfig`.
