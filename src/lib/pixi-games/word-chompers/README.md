# Word Bite and Sentence Swim

Beta. Same-screen practice for 2–4 players. The sentences come from [Sentence Builder](../sentence-builder/content.ts). A run stays on one grammar structure.

These games keep their own `PIXI.Application` in `WordChompersScreen` because the content is a fixed practice set, not a quiz handed through `GameConfig`.

## Word Bite

`/practice/word-bite`

The clue is a sentence with one blank. **Verb forms** blank the verb (`She ___ an apple` → `eats`). Present continuous and WH questions also blank `am` / `is` / `are`. **Pronouns** blank the subject (`___ eats an apple` → `She`, not `Her`).

Words drift around a table. Each player has a crocodile on their edge. A tap near it stretches the crocodile and bites the word in front. The first correct bite wins the round. A wrong bite drops a point if the player has one, then that player waits 2 seconds. Ten rounds, 14 seconds each.

A blue card reverses the drift. A red card makes the next answer safe for a moment and aims it at last place. Clues are drawn twice, once turned around, so the far side of the table can read them. The final board is one list in the center.

## Sentence Swim

`/practice/sentence-swim`

Each round puts four pictures in the pool. A player can join any subject to a verb that agrees with it, then any object from the pool. She eats an apple and She eats some soup both count. She eat an apple does not.

Each person word starts with one fewer copy than there are players. Every agreeing verb form for those people stays on screen (`am` / `is` / `are`, `eat` / `eats`). Only extra shared words, such as `-ing` verbs, wait in reserve: two of those types are on screen at a time, with the same copy count. When the last copy of a word is eaten, the pair comes back after two seconds, or a waiting `-ing` type rotates in. The grammar card stays on screen, so the table can see Present continuous or whichever structure was chosen. The sentence slots stay empty until a word is eaten.

Touch uses a joystick in each corner: push it and the crocodile swims that way. Keyboard makes the crocodile spin until the player holds a key or the button on their edge. Keys are bottom Space, left Shift, right 6, and top Caps Lock. Dots in front of the nose show the heading. A wrong word stuns for 2 seconds, then the player has 1 second to swim clear before another wrong word can stun them. The miss names the slot and leaves the sentence already built. One off-tense word is in the pool; the rest are the singular and plural forms for the chosen structure. Most finished sentences in 60 seconds wins the round. Five rounds.

## Code

| File | Role |
|------|------|
| `content.ts` | Bite blanks and swim sentences derived from Sentence Builder |
| `round.ts` | Round counts, swim stock, keyboard map, and the prefix check |
| `crocodile.ts` | Top-down crocodile, closed while swimming and open for a bite |
| `WordChompersGame.ts` | PixiJS v8 view |
| `src/components/game_ui/word-chompers/WordChompersScreen.tsx` | Setup and the canvas lifecycle |
| `src/app/practice/word-bite/page.tsx` | Word Bite route |
| `src/app/practice/sentence-swim/page.tsx` | Sentence Swim route |

Theme ink and Grandstander match Sentence Builder. Word Bite draws tinted crocodiles. Sentence Swim uses the frames in `public/images/sentence_swim`: still on frame 0, frames 0, 2, 1, 3, 5, 3, 2 at 150ms each while swimming, and BITE_0000, BITE_0001, BITE_0002 at 100ms each when it touches a word. Word bubbles use the same ink border as the React cards.
