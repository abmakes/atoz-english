# Word Bite and Sentence Swim

Beta. Same-screen practice for 2–4 players. The sentences come from [Sentence Builder](../sentence-builder/content.ts). A run stays on one grammar structure.

These games keep their own `PIXI.Application` in `WordChompersScreen` because the content is a fixed practice set, not a quiz handed through `GameConfig`.

## Word Bite

`/practice/word-bite`

The clue is a sentence with one blank. **Verb forms** blank the verb (`She ___ an apple` → `eats`). Present continuous and WH questions also blank `am` / `is` / `are`. **Pronouns** blank the subject (`___ eats an apple` → `She`, not `Her`).

Words drift around a table. Each player has a chomper on their edge. A tap near it stretches the chomper and bites the word in front. The first correct bite wins the round. A wrong bite drops a point if the player has one, then that player waits 2 seconds. Ten rounds, 14 seconds each.

A blue card reverses the drift. A red card makes the next answer safe for a moment and aims it at last place. Clues, scores, and the final board are drawn twice, once turned around, so the far side of the table can read them.

## Sentence Swim

`/practice/sentence-swim`

Each round puts four different sentences in the pool, taken from four pictures. The starters and the verbs change, so a player can build She eats an apple or They read a book. A sentence still has to agree: She eats an apple counts, and They eats an apple does not.

Extra bubbles are the other verb forms, or the wrong pronoun case in a question. Players drag a corner joystick and eat words in order. The words drift around the pool inside bubbles and turn over so the player on the far side can read them. A wrong word stuns for 2 seconds and does not erase the words already eaten. Each player's sentence sits on their side of the tablet. The round timer is a ring in the middle. Most finished sentences in 60 seconds wins the round. Five rounds.

## Code

| File | Role |
|------|------|
| `content.ts` | Bite blanks and swim sentences derived from Sentence Builder |
| `round.ts` | Round counts, shuffle, and the swim prefix check |
| `WordChompersGame.ts` | PixiJS v8 view |
| `src/components/game_ui/word-chompers/WordChompersScreen.tsx` | Setup and the canvas lifecycle |
| `src/app/practice/word-bite/page.tsx` | Word Bite route |
| `src/app/practice/sentence-swim/page.tsx` | Sentence Swim route |

Theme ink and Grandstander match Sentence Builder. Chompers are drawn in Pixi (ears, eyes, belly, a mouth that opens) instead of a pie-slice token. Word tiles use the same ink border and offset shadow as the React cards.
