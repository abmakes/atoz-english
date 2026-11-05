# PixiJS 8.17 migration and optional integrations

Assessment date: 2026-08-26

Target: move the runtime from the lockfile's PixiJS 8.9.2 to **8.17.1**, then evaluate
PixiJS Layout and the official PixiJS AI skills as separate integrations.

## Recommendation

Proceed with the runtime upgrade, but do not combine it with a layout rewrite.

The dependency change itself is low-to-moderate risk. The release remains within PixiJS
v8, and AtoZ Pixi already follows the v8 `Application`, `Assets`, `GifSource`, and
`GifSprite` patterns. Validation risk is medium-to-high because animated question media,
text bounds, filters, and fullscreen resizing are visually sensitive and currently have
almost no automated rendering coverage.

Use 8.17.1 rather than 8.17.0. The patch release fixes center-aligned text when a word
exceeds `wordWrapWidth`, which is directly relevant to long quiz questions.

Keep these as three independently reversible changes:

1. PixiJS 8.17.1 runtime upgrade and compatibility work.
2. Official PixiJS AI skills integration.
3. A small `@pixi/layout` pilot, only if the runtime upgrade is stable.

## Important distinctions

- **The AI skills are not a feature of PixiJS 8.17.** They can be installed while the
  project remains on 8.9. They are more useful after upgrading because their guidance
  tracks current PixiJS v8 APIs, but they do not affect the production bundle.
- **Flexbox-style layout is not built into `pixi.js` 8.17.** It comes from the separate
  `@pixi/layout` package, backed by Yoga. Upgrading `pixi.js` alone will not change or
  simplify the current layouts.
- **The 8.17 GIF API is not a new API.** It preserves the model already used here:
  register `pixi.js/gif`, let `Assets.load` cache a `GifSource`, and create a fresh
  `GifSprite` for each display site.

## Current architecture and upgrade surface

The engine lifecycle is sound:

`GameplayView` owns one `PixiEngine`; the engine initializes the Pixi application,
Assets, managers, RuleEngine last, and then the selected game. It destroys the engine on
React unmount. See [CONTEXT.md](../CONTEXT.md),
[GAME_STARTUP_FLOW.mdc](../.cursor/rules/GAME_STARTUP_FLOW.mdc), and
[engineHelperDoc.md](../src/lib/pixi-engine/engineHelperDoc.md).

The current installed/declaration state is:

| Package | Declared | Locked | Assessment |
| --- | --- | --- | --- |
| `pixi.js` | `^8.9.1` | 8.9.2 | Upgrade target is exactly 8.17.1 during validation |
| `@pixi/ui` | `^2.2.2` | 2.2.4 | Peer range accepts PixiJS v8; keep stable during the first upgrade |
| `@pixi/gif` | `^3.0.1` | 3.0.1 | Unused legacy dependency; runtime code uses `pixi.js/gif` |
| `@pixi/devtools` | `^2.0.1` | 2.0.1 | Compatible with PixiJS v8; not on the critical runtime path |

The caret declaration for `pixi.js` already permits later v8 minors even though the
lockfile currently resolves 8.9.2. Treat the migration as an intentional lockfile change,
not as a routine reinstall.

### Layout today

Both games use custom imperative layout rather than a Pixi layout package:

- Multiple Choice computes a height-scaled `LayoutProfile`, then rebuilds and positions
  media, question text, buttons, panel graphics, and timer on resize. The calculated
  aspect ratio is currently logged but not used.
- Splash Dash scales a fixed profile from a 1200×700 reference. Its bottom UI height is
  also used by the player and background systems, so changing that layout affects
  gameplay coordinates as well as presentation.
- Resizing flows through `ResizeObserver` → `PixiApplication` → `PixiEngine` →
  `ENGINE_EVENTS.RESIZED` → game UI/background managers.

Primary files:

- [MultipleChoiceLayoutManager.ts](../src/lib/pixi-games/multiple-choice/managers/MultipleChoiceLayoutManager.ts)
- [MultipleChoiceUIManager.ts](../src/lib/pixi-games/multiple-choice/managers/MultipleChoiceUIManager.ts)
- [SplashDashLayoutManager.ts](../src/lib/pixi-games/splash-dash/managers/SplashDashLayoutManager.ts)
- [SplashDashUIManager.ts](../src/lib/pixi-games/splash-dash/managers/SplashDashUIManager.ts)
- [SplashDashBackgroundManager.ts](../src/lib/pixi-games/splash-dash/managers/SplashDashBackgroundManager.ts)

### Animated media today

The question-media flow is:

1. Setup warmup or a quiz data manager calls `Assets.load(url)`.
2. The Pixi cache stores a texture, spritesheet, or `GifSource`.
3. `AssetLoader.getDisplayObject(url)` creates a new `Sprite`, `AnimatedSprite`, or
   `GifSprite`.
4. Multiple Choice, Splash Dash, or a transition screen sizes the object and starts
   animation.

This is the correct PixiJS v8 ownership model. The fragile details are:

- GIF parser registration is transitive through
  [AssetLoader.ts](../src/lib/pixi-engine/assets/AssetLoader.ts). A future load path that
  imports only `Assets` could run before `pixi.js/gif` is registered.
- Warmup identifies GIFs with a `.gif` URL regular expression. Signed, blob, or endpoint
  URLs without that extension cannot be reliably classified from the URL.
- `instanceof` can fail if duplicate Pixi module copies are bundled. `AssetLoader`
  already has a structural fallback, which should be retained until dependency
  deduplication is proven.
- React warmup initializes the global `Assets` singleton before `PixiEngine` tries to
  initialize it with a manifest. The engine compensates by manually adding bundles.
- Question display objects are destroyed, but successful question-media loads are not
  systematically unloaded when a game ends. GIFs decode frames into separate textures,
  so long sessions can retain substantial memory.
- Splash Dash directly destroys Assets-managed water textures. Cache-owned resources
  should ultimately be released through `Assets.unload` or `Assets.unloadBundle`.
- The installed `@pixi/gif` package is not used. It is a different, older GIF API and
  should not be mistaken for the built-in `pixi.js/gif` entry point.

Primary files:

- [AssetLoader.ts](../src/lib/pixi-engine/assets/AssetLoader.ts)
- [game-asset-warmup.ts](../src/lib/game-asset-warmup.ts)
- [BaseQuizDataManager.ts](../src/lib/pixi-engine/game/BaseQuizDataManager.ts)
- [QuestionScene.ts](../src/lib/pixi-games/multiple-choice/scenes/QuestionScene.ts)
- [SplashDashUIManager.ts](../src/lib/pixi-games/splash-dash/managers/SplashDashUIManager.ts)
- [TransitionScreen.ts](../src/lib/pixi-engine/ui/TransitionScreen.ts)

## Benefits of moving from 8.9.2 to 8.17.1

### Benefits available without redesign

1. **Renderer and filter stability**
   - Fixes include filter texture-pool corruption, filter offsets, stale Graphics bounds,
     destroyed render-resource handling, and renderer listener cleanup.
   - These are relevant to Splash Dash's animated water and `DisplacementFilter`, the
     Multiple Choice blur power-down, repeated resize, and React mount/unmount.

2. **More consistent text measurement and wrapping**
   - Releases between 8.9 and 8.17 improve measurement caching, center/right alignment,
     long-word wrapping, web-font loading, and parity between `Text`, `BitmapText`, and
     `HTMLText`.
   - AtoZ currently uses canvas `Text`, centered alignment, and `wordWrapWidth`, so the
     practical benefit is more predictable long-question layout rather than access to a
     new renderer.

3. **Text performance foundations**
   - Shared `TextStyle` instances can share cached text textures, and repeated
     measurements use an LRU cache.
   - The engine will receive some measurement-cache benefit automatically. Texture
     sharing requires a later refactor because most current text styles are created
     inline per text object.

4. **Better current-platform fallback**
   - 8.16 added an experimental Canvas 2D renderer fallback for environments without
     WebGL/WebGPU. This may broaden basic compatibility.
   - Do not claim full AtoZ support until Splash Dash filters, animation, and interaction
     have been tested under Canvas; the fallback does not guarantee feature parity.

5. **Improved asset control**
   - The newer asset API supports explicit parser selection for extensionless URLs. This
     gives the project a robust way to load an extensionless GIF when the quiz data also
     identifies its media type.
   - Resolver alias removal and numerous loader fixes improve long-running dynamic asset
     management, although the project must opt into the relevant APIs.

### Benefits that require product or engine work

1. **Tagged text**
   - `Text` can render inline tag styles, useful for emphasizing keywords, formulas, or
     instructions without coordinating multiple text objects.
   - Only use tags in trusted or escaped content. Quiz text should not become an
     unrestricted markup channel.

2. **SplitText and SplitBitmapText**
   - These enable per-line, per-word, or per-character animation. They could improve turn
     transitions and celebration effects.
   - They are not needed for ordinary questions and can increase object count. Character
     splitting can also differ from browser kerning.

3. **BitmapText improvements**
   - White-space modes, word breaking, dynamic font scaling, and kerning are improved.
   - There is no immediate AtoZ benefit because the games do not currently use
     `BitmapText`. A switch should be justified by profiling, not included in this
     migration.

4. **Optimized blur**
   - The new default `BlurFilter` algorithm produces smoother high-strength blur with
     less GPU work.
   - This is also the clearest visual compatibility risk: the Blurred Vision power-down
     starts at strength 18 and will look different. Product must approve the new look or
     explicitly retain legacy blur behavior.

5. **Scene-management conveniences**
   - Newer v8 releases add stable-origin transforms, child replacement that preserves
     transforms, and the 8.17 `visibleChanged` container event.
   - These could simplify future transitions or visibility-driven cleanup, but current
     AtoZ code does not need them to complete the upgrade.

## Risk assessment

| Area | Risk | Reason and required decision |
| --- | --- | --- |
| Blurred Vision filter | High | 8.17 deliberately changes `BlurFilter` output; compare and choose optimized or legacy appearance |
| GIF load/display lifecycle | Medium-high | Upstream API is stable, but parser registration, URL detection, global cache ownership, and missing unload coverage are fragile |
| Centered wrapped question text | Medium | 8.16/8.17.1 alignment and long-word fixes can move measured bounds |
| Splash Dash water/filter | Medium | Filter fixes should help, but its 40-frame animation and displacement output need visual comparison |
| Asset warmup/manifest handoff | Medium | Two paths initialize the global `Assets` singleton |
| `@pixi/ui` answer buttons | Medium | Verify pointer hit areas, enabled states, resize rebuild, and filtered button views |
| Fullscreen/resize | Medium | Layout is timing-sensitive and includes delayed resize work |
| Engine init/destroy | Low | Lifecycle guards are already present; renderer cleanup changes are favorable |
| New flex layout | No direct upgrade risk | It is not installed and must remain outside the runtime upgrade |

## Migration plan

### Gate 0 — capture the 8.9.2 baseline

Do this before changing dependencies:

- Record Multiple Choice and Splash Dash at 375×667, 768×1024, 1200×700, and
  1920×1080.
- Include normal window, enter fullscreen, exit fullscreen, and resize during a loading
  transition.
- Use a fixed media fixture set:
  - uploaded `.gif`;
  - Giphy GIF URL, including query parameters;
  - any supported extensionless or signed GIF URL;
  - static PNG/JPEG/WebP;
  - the Splash Dash water frames and player spritesheet.
- Capture a long question, a single unbroken long word, punctuation/hyphen wrapping,
  multiline answers, and the Grandstander font on a cold page load.
- Capture Blurred Vision at activation, midpoint, and completion.
- Play at least ten GIF-bearing questions, exit, start another game, and record browser
  heap/GPU memory behavior.
- Record the current console output and network request count so duplicate loads and
  duplicate canvases are visible.
- Confirm the existing typecheck, Vitest suite, asset verification, and production build
  pass before attributing failures to PixiJS.

Exit criterion: repeatable baseline evidence and known pre-existing failures.

### Gate 1 — dependency-only upgrade

- Change `pixi.js` to exact version 8.17.1 for the validation period and refresh the
  lockfile.
- Do not add `@pixi/layout`, change game layout logic, switch text renderer, or upgrade
  `@pixi/ui` in the same change.
- Keep the existing `pixi.js/gif` imports.
- Confirm that the dependency tree contains one runtime copy of `pixi.js`.
- Run typecheck, tests, asset verification, and production build.
- Remove the unused `@pixi/gif` dependency in a separate, easily reviewable change after
  confirming there are still no imports from it.

Exit criterion: clean build and dependency tree with no source compatibility changes
hidden by unrelated refactors.

### Gate 2 — GIF compatibility gate

For every GIF fixture, verify:

- the GIF extension is registered before the first `Assets.load`;
- the cache entry is a `GifSource` or the accepted structural equivalent;
- each display site receives a fresh `GifSprite` rather than sharing mutable playback
  state;
- transition and question views can use the same cached source safely;
- playback starts, loops, pauses/cleans up, and restarts on a later question;
- original dimensions and aspect ratio survive resize and fullscreen;
- warmup followed by engine initialization does not trigger a second decode or lose
  configured bundles;
- exit and replay do not leave live shared-ticker listeners or steadily increasing frame
  textures.

For extensionless URLs, do not guess from the URL. Preserve media MIME/type metadata from
ingestion and use the explicit `gif` parser only when the asset is known to be a GIF.

Ownership rule for future implementation:

- `Assets` owns the cached `GifSource`.
- Each scene owns its `GifSprite`.
- Destroying a scene destroys its sprite.
- The final owner of a question-media URL calls `Assets.unload(url)`.
- Never destroy a shared source or Assets-managed frame texture from one sprite while
  another scene may still use it.

Exit criterion: all GIF fixtures pass both games, transitions, resize, exit/replay, and a
memory check.

### Gate 3 — visual and interaction compatibility

- Compare Blurred Vision against baseline and make an explicit product decision:
  optimized 8.17 appearance or legacy parity.
- Compare centered/word-wrapped question and answer bounds at every baseline viewport.
- Confirm button hit areas still match rendered bounds after resize.
- Compare Splash Dash water displacement, contrast overlay, corner art, and bottom UI.
- Exercise keyboard and touch/pointer controls, including modifier keys where supported.
- Rapidly mount/unmount/remount `GameplayView` in development Strict Mode; confirm one
  canvas, one engine, and no post-destroy updates.
- Repeat the full automated checks and production build.

Exit criterion: approved visual diffs and no lifecycle, interaction, or memory regression.

### Gate 4 — rollout and rollback

- Roll out the runtime upgrade without the layout pilot.
- Monitor media-load failures, WebGL/WebGPU/Canvas selection, renderer crashes, and game
  exit/restart behavior.
- Keep the dependency-only commit independently revertible.
- Roll back if GIF failures, memory growth, or input regressions cannot be explained and
  fixed without broad engine changes.

## Optional `@pixi/layout` integration

As of this assessment, `@pixi/layout` 3.2.1 declares PixiJS `^8` compatibility. It is a
separate production dependency using Yoga and is opt-in per display object.

### Where it could help

- The Multiple Choice answer panel is the best pilot. It is a conventional responsive
  grid/column UI, is already rebuilt on resize, and can be isolated from the media area.
- It could replace hand-maintained button widths, gaps, wrapping, and alignment with
  flex direction, wrapping, gap, and alignment rules.
- Intrinsic text measurement could make variable-length answers less dependent on fixed
  multipliers.

### Where not to start

- Do not convert the whole canvas or engine.
- Do not put Splash Dash world/player positioning under flex layout. Player movement and
  spawn positions depend on gameplay coordinates.
- Do not convert the Splash Dash bottom UI until its `bottomUIHeight` contract with the
  background and player managers is explicit.
- Do not introduce `@pixi/react`; AtoZ's imperative Pixi lifecycle remains the project
  architecture.

### Layout pilot acceptance criteria

- Add the package only after 8.17.1 is stable.
- Import/register it once at the Pixi engine boundary.
- Convert one isolated Multiple Choice answer panel behind an easy rollback boundary.
- Preserve the existing EventBus resize flow while comparing output.
- Test intrinsic sizing for `Text`, `Sprite`, and `GifSprite`; verify object-fit behavior
  rather than assuming HTML/CSS parity.
- Compare output at the four baseline viewports and with the longest supported answers.
- Profile resize/reflow cost and bundle-size impact.
- Expand only if the pilot materially removes custom layout code without weakening
  deterministic game positioning.

The likely value is maintainability and more predictable responsive UI, not a rendering
speed increase.

## Official PixiJS AI skills integration

The [official skills repository](https://github.com/pixijs/pixijs-skills) contains focused
guidance for PixiJS v8 application lifecycle, Assets, GIFs, text, filters, events,
performance, and scene objects.

Recommended integration:

1. Add it as a Cursor remote rule/skill or install the skill collection independently of
   the runtime upgrade.
2. Keep AtoZ's workspace rules authoritative where they are more specific:
   one `PixiEngine` in `GameplayView`, RuleEngine initialized last, themes sourced from
   `src/lib/themes.ts`, and no `@pixi/react`.
3. Use the `pixijs-assets`, `pixijs-scene-gif`, `pixijs-scene-text`,
   `pixijs-application`, and `pixijs-performance` skills first.
4. Review generated suggestions against the project's exact installed Pixi version and
   canonical docs; a skill improves context but does not prove compatibility.
5. Pin or periodically review the imported skill revision if deterministic agent
   behavior matters.

Concrete benefit: agents are less likely to suggest v7 APIs, treat a GIF as a `Texture`,
forget the `pixi.js/gif` registration side effect, or destroy cache-owned textures
incorrectly.

Current limitation: the published skill list does not include a dedicated
`@pixi/layout` skill, so it should not be treated as the layout migration authority.

## Test coverage to add during implementation

There are no current Pixi rendering/GIF integration tests. Before calling the migration
complete, add coverage for:

- `isUsableQuestionMedia` with texture, `GifSource`, structural GIF fallback,
  spritesheet, and invalid values;
- `AssetLoader.getDisplayObject` returning independent `GifSprite` instances from one
  cached source;
- warmup and engine initialization sharing one `Assets` lifecycle;
- known GIF, extensionless known-GIF, static texture, and load-failure cases;
- unload ownership after transition/question reuse and game exit;
- layout calculations and long wrapped text at fixed viewport sizes;
- engine mount/unmount with no duplicate canvas or ticker listener.

Unit tests cannot approve filter output, text rasterization, GIF playback, or responsive
layout by themselves. Keep a small browser-based visual smoke suite or recorded manual
matrix for those behaviors.

## Final go/no-go criteria

Go when:

- dependency tree and all automated checks are clean;
- every GIF fixture works in both games and transitions;
- memory stabilizes after exit/replay;
- text, blur, water/filter, input, and fullscreen diffs are approved;
- one engine/canvas survives Strict Mode and rapid navigation.

No-go when:

- GIF parser registration depends on accidental import order;
- extensionless media is claimed as supported without type metadata;
- cached GIF sources or water textures are destroyed by individual display objects;
- the runtime upgrade and flex-layout rewrite cannot be tested or reverted separately.

## External references

- [PixiJS 8.17.0 release notes](https://pixijs.com/blog/8.17.0)
- [PixiJS 8.17.1 patch release](https://github.com/pixijs/pixijs/releases/tag/v8.17.1)
- [PixiJS 8.17.1 documentation](https://pixijs.download/v8.17.1/docs/index.html)
- [PixiJS Layout v3 announcement](https://pixijs.com/blog/layout-v3)
- [PixiJS Layout documentation](https://layout.pixijs.io/)
- [Official PixiJS AI skills](https://github.com/pixijs/pixijs-skills)
