# 3D Game Requirements and Integration Contract

Canonical guide for adding Three.js classroom games to AtoZ Pixi. Hub: [CONTEXT.md](../CONTEXT.md). Shared startup: [GAME_STARTUP_FLOW.mdc](../.cursor/rules/GAME_STARTUP_FLOW.mdc). Pixi manager details: [engineHelperDoc.md](../src/lib/pixi-engine/engineHelperDoc.md).

3D games plug into the existing quiz platform with **minimal Pixi engine changes**. They do not pretend to be a Pixi renderer. They share `GameSession` (events, rules, scoring, timers, audio, input, state) and the React HUD. Each renderer owns its own world and frame loop.

---

## Architecture (v0)

| Layer | Owner | Notes |
|-------|--------|--------|
| React HUD | `GameplayView` | Scores, nav, settings, game over. Shared overlay for Pixi and Three. |
| Mode registry | `src/lib/game-engine/modes/` | Explicit slug → renderer + runtime factory. Unknown slugs fail. |
| Shared session | `GameSession` | EventBus + managers. RuleEngine **last**. |
| Pixi path | `PixiEngine` via `PixiRuntimeAdapter` | Existing `BaseGame` API unchanged. |
| Three path | `ThreeRuntime` + `ThreeWorld` + `ThreeGame` | One RAF loop. No Pixi stage. |
| Quiz content | `QuizDataSource` | Fetches `/api/quizzes/{id}`. No Pixi `Assets`. |

**Do not** overlay a Pixi WebGL canvas on the Three canvas in v0. HUD is DOM.

**Do not** change Prisma schema or quiz APIs for the first 3D mode. `quiz-room-3d` consumes existing multiple-choice questions (`answers: string[]`, `correctAnswer: string`).

---

## Folder and registration contract

A 3D game lives under `src/lib/three-games/<slug>/` and is registered in `src/lib/game-engine/modes/builtinGameModes.ts`.

Required pieces:

1. **`ThreeGame` implementation** — scene objects, raycasting, question flow. Never constructs managers.
2. **Pure logic module** (eligibility, payloads) — unit-tested without WebGL.
3. **Registry entry** — `slug`, `renderer: 'three'`, `questionTimerId`, eligibility, `buildControls`, `buildAssets`, `loadRuntime`.
4. **Picker card** — `src/app/games/[quizId]/page.tsx` plus `GameModeId` in `src/lib/game-mode-eligibility.ts`.
5. **Route** — `/games/[quizId]/[gameSlug]`. Unknown slugs render “Invalid game link”.

```typescript
loadRuntime: async () => {
  const [{ ThreeRuntime }, { MyGame }] = await Promise.all([
    import('@/lib/three-engine/ThreeRuntime'),
    import('@/lib/three-games/my-game/MyGame'),
  ])
  return new ThreeRuntime((context) => new MyGame(context))
}
```

Pixi games keep the same registry shape and return `new PixiRuntimeAdapter(gameFactory)`.

---

## ThreeGame lifecycle

`ThreeRuntime` owns exactly one animation loop. The game implements:

| Method | When | Responsibility |
|--------|------|----------------|
| `init()` | After world + session are ready | Load quiz via `QuizDataSource`, build scene, subscribe to events |
| `start()` | After React HUD attaches listeners | Set `GamePhase.PLAYING`, show first question, start timers |
| `update(deltaMs)` | Each RAF frame while not paused | Animation only. Do not score here. |
| `pause()` / `resume()` | HUD dropdown emits `GAME_PAUSED` / `GAME_RESUMED` | Freeze input; `ThreeRuntime` pauses timers |
| `onResize(width, height)` | Fullscreen / container resize | Camera is updated by `ThreeWorld`; adjust game layout if needed |
| `destroy()` | Unmount / failed init | Remove listeners, clear timeouts, `disposeObject3D`, remove timers |

`ThreeGameContext` provides:

- `config: Readonly<GameConfig>`
- `services: GameSessionServices`
- `world: ThreeWorld` (`getScene()`, `getCamera()`, `getRenderer()`, `getCanvas()`)
- `quizDataSource: QuizDataSource`

Init order inside `ThreeRuntime`:

1. `ThreeWorld.init(mount)` — WebGLRenderer, canvas appended to the HUD mount node
2. `GameSession.init(config)` — managers, **RuleEngine last**
3. `await game.init()` (QuizDataSource + scene + raycast)
4. Emit `ENGINE_EVENTS.ENGINE_READY_FOR_GAME` (background music rule)
5. `GameplayView` subscribes to HUD events, then `runtime.start()` → `game.start()` + RAF

Destroy order: cancel RAF → unbind HUD pause listeners → `game.destroy()` → `session.destroy()` → `world.destroy()` (renderer dispose + context loss + canvas remove).

---

## GameConfig and QuestionData

`GameContainer` still assembles one `GameConfig` for every mode. 3D games read the same fields Pixi games use.

### Required `GameConfig` fields

| Field | 3D use |
|-------|--------|
| `quizId` | `QuizDataSource.loadQuiz` |
| `gameSlug` | `'quiz-room-3d'` (or the new slug) |
| `teams` | Turn rotation, `ScoringManager.init`, HUD names |
| `gameMode` | Score mode (`type: 'score'`) for classroom quizzes |
| `rules` | Scoring + audio. Do not duplicate in the 3D game. |
| `controls` | From `buildControls`. Optional for pointer-first 3D. |
| `assets` | Pixi bundles; 3D may ignore or add later GLB keys |
| `audio` / mute flags | `AudioManager` via session |
| `powerups` | Available to RuleEngine / PowerUpManager |
| `intensityTimeLimit` | Question countdown seconds |
| `questionHandling` | `QuestionSequencer` distribution / shuffle / fairness |
| `theme` | React HUD CSS. Canvas colors stay in the Three game (not CSS variables). |

### `QuestionData` (API / sequencer)

```typescript
{
  id: string
  question: string
  answers: string[]
  correctAnswer: string
  type: QuestionType
  imageUrl?: string
  quizId?: string
}
```

`QuizDataSource` parses `/api/quizzes/{id}` (raw object or `{ data }`). It rejects missing questions, non-string answers, missing `correctAnswer`, or unknown `type`. It does **not** preload images through Pixi Assets.

`createSequencer(quiz, numberOfTeams, questionHandling)` wraps `QuestionSequencer`.

---

## Manager method matrix

3D games receive these via `context.services`. Call them; do not construct them.

### EventBus

| Method | Use |
|--------|-----|
| `on(event, handler)` | Subscribe (`TIMER_COMPLETED`, etc.) |
| `off(event, handler)` | Always unbind in `destroy()` |
| `emit(event, payload?)` | `GAME_EVENTS.ANSWER_SELECTED`, `GAME_STATE_EVENTS.GAME_ENDED` |

### GameStateManager

| Method | Use |
|--------|-----|
| `init(config)` | Called by `GameSession` so `setActiveTeam` can validate IDs |
| `setPhase(phase)` | `PLAYING`, `PAUSED`, `GAME_OVER` |
| `getCurrentPhase()` / `isPhase()` | Guard input |
| `setActiveTeam(teamId)` | After each turn. HUD listens to `ACTIVE_TEAM_CHANGED` |
| `getActiveTeamId()` / `getActiveTeam()` / `getTeams()` | Read current turn |
| `destroy()` | Session teardown |

### ScoringManager — **do not call `addScore` from the game**

| Method | Who calls it |
|--------|----------------|
| `init(teams, gameMode)` | `GameSession` |
| `addScore` / `subtractScore` / `setScore` | **RuleEngine only** (`modifyScore`) |
| `getScore` / `getAllScores` / `getAllTeamData` | HUD / game-over |
| `resetScore` / `resetAllScores` | Rare; prefer rules |
| Lives helpers | Lives modes only |

### TimerManager

| Method | Use |
|--------|-----|
| `createTimer(id, durationMs, TimerType.COUNTDOWN)` | Per-question timer. Use the registry `questionTimerId` |
| `startTimer` / `pauseTimer` / `resumeTimer` / `removeTimer` | Question lifecycle |
| `getTimer` / `getTimeRemaining` | Payload `remainingTimeMs` for boosted scoring |
| `pauseAll` / `resumeAll` / `stopAllTimers` | Runtime pause / destroy |

`ThreeRuntime` pauses all timers when the HUD emits `GAME_PAUSED`.

### AudioManager

| Method | Use |
|--------|-----|
| `registerSound` | Session registers default SFX/music |
| `play` / `stop` / `stopAll` | Prefer RuleEngine `playSound` |
| `setGlobalVolume` / `setMusicMuted` / `setSfxMuted` | HUD settings events |

### ControlsManager

`init` + `enable` run in `GameSession`. Keyboard mappings come from `buildControls`. Pointer picking in 3D is the game’s raycaster, not ControlsManager.

### PowerUpManager

`update(deltaMs)` is called by `ThreeRuntime` each frame. Activation stays on RuleEngine / existing spin-wheel UI if a future 3D mode uses it.

### RuleEngine

Constructed last with `{ timerManager, gameStateManager, scoringManager, powerUpManager, audioManager, storageManager }`. Games never instantiate it.

---

## Event catalog

Source of truth: `src/lib/pixi-engine/core/EventTypes.ts`. 3D games must use the same names and payloads.

### Engine

| Constant | Payload | 3D note |
|----------|---------|---------|
| `ENGINE_EVENTS.ENGINE_READY_FOR_GAME` | none | Emitted by `ThreeRuntime` after `ThreeGame.init()` (music rule) |
| `ENGINE_EVENTS.RESIZED` | `{ width, height }` | Pixi path. Three uses `runtime.resize` directly |

### Game state

| Constant | Payload | 3D note |
|----------|---------|---------|
| `PHASE_CHANGED` | `{ previousPhase, currentPhase }` | From `setPhase` |
| `ACTIVE_TEAM_CHANGED` | `{ previousTeamId?, currentTeamId }` | HUD highlight |
| `GAME_PAUSED` / `GAME_RESUMED` | none | HUD dropdown; `ThreeRuntime` pause/resume |
| `GAME_ENDED` | none | **Required** to show Game Over. HUD then reads `scoringManager.getAllTeamData()` |

### Scoring

| Constant | Payload |
|----------|---------|
| `SCORE_UPDATED` | `{ teamId, previousScore, currentScore, delta }` |
| `LIFE_LOST` / `TEAM_ELIMINATED` / `HIGH_SCORE_BEATEN` | See `EventTypes.ts` |

### Timers

`TIMER_STARTED`, `TIMER_TICK`, `TIMER_PAUSED`, `TIMER_RESUMED`, `TIMER_STOPPED`, `TIMER_COMPLETED`, `TIMER_MODIFIED` — payload `{ timerId, remaining?, elapsed?, duration? }`.

On `TIMER_COMPLETED` for the question timer, treat as timeout (`selectedOptionId: null`, `isCorrect: false`).

### Gameplay

`GAME_EVENTS.ANSWER_SELECTED` payload (`AnswerSelectedPayload`):

| Field | Required |
|-------|----------|
| `questionId` | yes |
| `selectedOptionId` | yes (`null` on timeout) |
| `isCorrect` | yes |
| `teamId` | yes (RuleEngine `payload.teamId`) |
| `remainingTimeMs` | yes for boosted / progressive scoring |
| `scoreMultiplier` | optional, default `1` |

### Settings (HUD)

`SET_GLOBAL_VOLUME` (0–1), `SET_MUSIC_MUTED`, `SET_SFX_MUTED`.

---

## RuleEngine conditions and actions

Defined on `GameConfig.rules` by `GameContainer` (same rules for Pixi Team Quiz and 3D Quiz Room).

### Conditions (`ConditionDefinition.type`)

| Type | Meaning |
|------|---------|
| `compareState` | Compare `property` on the event payload (e.g. `isCorrect`) with `operator` + `value` |
| `timerCheck` | Timer status / remaining |
| `checkPowerup` | Active power-up |

Operators: `eq`, `ne`, `gt`, `lt`, `gte`, `lte`, `contains`.

### Actions (`ActionDefinition.type`)

| Type | Params (typical) |
|------|------------------|
| `modifyScore` | `target: 'payload.teamId'`, `mode: 'fixed' \| 'progressive'`, `points` or `timerId` + `pointsPerSecond` |
| `playSound` | `soundId` (`correct-sound`, `incorrect-sound`, `background-music`, `victory-sound`) |
| `changePhase` | `newPhase` (`GamePhase` value) |
| `startTimer` | timer id / duration |
| `activatePowerup` | power-up id / target |

Classroom scoring:

- **basic** — `mode: 'fixed'`, `points: 10`
- **boosted** — `mode: 'progressive'`, `timerId` = mode `questionTimerId`, `pointsPerSecond: 5`

A 3D game that emits a complete `ANSWER_SELECTED` payload gets scoring and SFX for free.

---

## Rendering, input, resize, HUD

- **One loop.** Only `ThreeRuntime` calls `requestAnimationFrame`. Games must not start a second loop.
- **Pixel ratio** capped at `1.75`.
- **Raycast** against answer meshes on `pointerup` using NDC from the canvas bounding rect. Set `userData` on pickable objects.
- **Resize.** `GameplayView` calls `runtime.resize` on fullscreen. `ThreeWorld` updates camera aspect + `setSize`.
- **HUD.** DOM overlay. Keep 3D labels in-world (canvas textures) so they stay on the pedestals; scores stay in React.
- **Pause.** Opening the settings dropdown emits `GAME_PAUSED`. Runtime pauses timers and `game.pause()`.

---

## Disposal

GPU leaks fail classroom sessions on cheap Chromebooks. On `destroy()`:

1. Clear `setTimeout` / interval handles.
2. Remove canvas `pointerup` (and any other DOM listeners).
3. `eventBus.off` every handler registered in `init`.
4. Remove question timers.
5. `disposeObject3D` on groups you added (geometry + materials + textures).
6. Let `ThreeWorld.destroy` dispose the scene, `renderer.dispose()`, `forceContextLoss()`, and remove the canvas.

`disposeObject3D` is the shared helper — do not leave `CanvasTexture` maps alive.

---

## Prohibitions

- **Do not** subclass `BaseGame` or import `pixi.js` / `@pixi/*` from a Three game.
- **Do not** create a second `EventBus`, `ScoringManager`, `RuleEngine`, or `AudioManager`.
- **Do not** call `scoringManager.addScore` (or set scores) from the game. Emit events.
- **Do not** fall through unknown slugs to Multiple Choice. Registry `require()` throws; the route treats missing slugs as invalid.
- **Do not** make Three implement the Pixi renderer interface.
- **Do not** change quiz schema for v0 MC smoke tests.
- **Do not** read CSS variables for 3D materials. Use explicit colors (same rule as Pixi themes).

---

## Smoke mode: 3D Quiz Room (`quiz-room-3d`)

Procedural colorful room. Two to four answer pedestals with canvas-texture labels. Click / tap a pedestal to answer. When a question has a real `imageUrl` (not the shared placeholder), the photo loads onto a framed plane beside the prompt. Images are fetched with `crossOrigin = 'anonymous'` and skipped on failure so play can continue.

Eligibility: every question is multiple choice, 2–4 non-empty answers, `correctAnswer` present in `answers`.

Timer id: `quizRoom3dQuestionTimer`.

Payload helper: `createQuizRoomAnswerPayload` in `quizRoomLogic.ts`.
