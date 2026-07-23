# AtoZ Young-Learner Lexicon

This directory builds the vocabulary boundary used by AtoZ Pixi's AI quiz
generator. The public artifact is intended for short, visual ESL activities
from Pre-A1 through B1.

## Important limitations

- Level assignments in version 0.1 are conservative estimates, not official
  CEFR classifications.
- NDL membership is used as evidence of young-learner relevance.
- NGSL frequency bands provide provisional A2/B1 estimates.
- Open English WordNet supplies parts of speech for candidate lemmas.
- Topic assignments are curated, multi-label seeds. An empty topic list means
  "general vocabulary", not missing data.
- Inflected forms can enter at a later band than their lemma (`go` at Pre-A1,
  `went` at A1, `gone` at A2). Regular-form heuristics are backed by explicit
  overrides for common irregular paradigms.
- CEFR-J is not included because its published terms do not clearly grant
  redistribution of an adapted public dataset.
- The previous publisher-derived word and coursebook files are not inputs.

## Build

Download the pinned Open English WordNet archive:

```bash
mkdir -p lexicon/cache
curl -fsSL \
  https://en-word.net/static/english-wordnet-2025-json.zip \
  -o lexicon/cache/english-wordnet-2025-json.zip
```

Then run:

```bash
npm run build:lexicon
```

The builder verifies every source checksum and writes
`src/generated/young-learner-lexicon.json`.

## Curation workflow

1. Change source snapshots only through an explicit version update in
   `sources.lock.json`.
2. Add topic decisions to `curation/topic-seeds.json` and morphology decisions
   to the two override files in `curation/`.
3. Rebuild the artifact.
4. Run `npm test` and inspect coverage counts in the generated metadata.
5. Record substantial data changes in this README and the app documentation.

Do not hand-edit the generated JSON.

## License

The combined data artifact is distributed under CC BY-SA 4.0. Application
source code remains under the repository's existing terms. See
`ATTRIBUTION.md` and `sources.lock.json`.
