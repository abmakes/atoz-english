# Word Play (prototype)

Drag-and-drop classroom game for **SORTING** (word order arrangement) and
**MATCHING** (pair matching) questions. Played in team turns like Team Quiz,
with the same timers, transitions, power-up wheel, and RuleEngine scoring.

> Hub: [CONTEXT.md](../../../../CONTEXT.md) ·
> Startup flow: [.cursor/rules/GAME_STARTUP_FLOW.mdc](../../../../.cursor/rules/GAME_STARTUP_FLOW.mdc)

## Data contract (no schema changes)

Word Play reads the same `Question` rows the creation forms and
`/api/questions` already write:

| Type | `answers` | `correctAnswer` |
|------|-----------|-----------------|
| `SORTING` | words/chunks of the sentence | JSON `string[]` in correct order |
| `MATCHING` | flat even-length `[left, right, ...]` | JSON `[{ "left", "right" }]` |

Parsing lives in [`wordPlayQuestion.ts`](./wordPlayQuestion.ts) (pure,
unit-tested in `tests/lib/pixi-games/word-play/`). Fallbacks: sorting uses the
`answers` array as the correct order when `correctAnswer` isn't valid JSON;
matching derives consecutive pairs from `answers`.

## Gameplay

- **Sorting round:** numbered drop slots (one per word) above a tray of
  shuffled word tiles. Arrange all words, then press **Check!**.
- **Matching round:** fixed left-item anchors with a drop slot beside each;
  the shuffled right-side tiles start in the tray.
- Correct arrangements score through the shared `ANSWER_SELECTED` RuleEngine
  rules (basic fixed 10 pts / boosted progressive via timer
  `wordPlayQuestionTimer`). Timeouts count as incorrect.

## Mobile-friendly controls

`ui/DraggableTile.ts` + `ui/DropSlot.ts` implement both interaction styles:

- **Drag and drop:** pointer events (`pointerdown` on the tile, move/up on the
  stage) work identically for touch and mouse; tiles lift and scale while
  dragging; slots highlight under the pointer; drops snap-animate.
- **Tap-to-place:** tapping a tray tile immediately fills the first empty slot
  from left to right (Bamboozle-style); tapping a placed tile (or its occupied
  slot) returns it to the tray. Dragging remains available for exact placement
  and reordering.
- Tiles keep ≥48px touch targets on small screens plus padded hit areas.

## Structure

```
word-play/
├── WordPlayGame.ts              # BaseGame subclass: turns, timers, scoring
├── wordPlayQuestion.ts          # Pure parsing + correctness checks (tested)
├── managers/
│   ├── WordPlayDataManager.ts   # BaseQuizDataManager + round parsing/filtering
│   ├── WordPlayUIManager.ts     # Board, tray, check button, feedback, timer
│   └── WordPlayLayoutManager.ts # Responsive sizing (touch-friendly minimums)
└── ui/
    ├── DraggableTile.ts         # Drag + tap gestures, snap animations
    └── DropSlot.ts              # Drop target with hover highlight, tap-to-place
```

Reused from the shared engine / Team Quiz: `GameBackgroundManager`,
`PixiTimer`, `TransitionScreen` (+ power-up wheel), `VisualEffectsManager`,
`BaseQuizDataManager`/`QuestionSequencer`, and theme values from
`src/lib/themes.ts`.

## Wiring

- Eligibility + mode card: `src/lib/game-mode-eligibility.ts`
  (`isWordPlayEligible`) and `src/app/games/[quizId]/page.tsx`.
- Registration: `loadGameConstructor('word-play')` in
  `src/components/game_ui/GameContainer.tsx` (pointer-first controls; boosted
  scoring timer id switched per slug).
- Demo data: `npm run seed:word-play` seeds a quiz with sorting + matching
  questions (see `scripts/seed-word-play-quiz.mjs`).

## Prototype limits

- Question images show above the prompt but boards are text-first.
- MC-specific power-ups (50/50, blurred vision) spin on the wheel but have no
  board effect here; timer/score power-ups work.
- Board capacity: ≤10 words per sorting question, ≤6 matching pairs
  (enforced by eligibility).
