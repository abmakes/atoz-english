/**
 * Built-in Sentence Builder scenes and prompts.
 * Each picture is reused across tenses. Score Run flags exactly one prompt per scene.
 */

export type GrammarFocus =
  | 'present-simple'
  | 'present-continuous'
  | 'wh-question'
  | 'be-present'
  | 'be-past'
  | 'has-have'
  | 'past-simple-regular'
  | 'past-simple-irregular'

export interface WordSlot {
  correct: string
  options: readonly [string, string, string, string]
}

export interface SentencePrompt {
  id: string
  sceneId: string
  focus: GrammarFocus
  label: string
  instruction: string
  teacherPrompt?: string
  punctuation: '.' | '?'
  slots: WordSlot[]
  answer: string
  scoreRun: boolean
}

export interface Scene {
  id: string
  image: string
  alt: string
}

export const GRAMMAR_LABELS: Record<GrammarFocus, string> = {
  'present-simple': 'Present simple',
  'present-continuous': 'Present continuous',
  'wh-question': 'WH question',
  'be-present': 'am / is / isn\'t',
  'be-past': 'was / were / wasn\'t / weren\'t',
  'has-have': 'has / have',
  'past-simple-regular': 'Past simple · regular',
  'past-simple-irregular': 'Past simple · irregular',
}

const scene = (id: string, alt: string): Scene => ({
  id,
  image: `/images/sentence-builder/${id}.jpg`,
  alt,
})

export const SCENES: Scene[] = [
  scene('maya-apple', 'A girl holding a red apple in a kitchen'),
  scene('leo-bike', 'A boy riding a blue bicycle'),
  scene('sara-book', 'A woman reading a book in a chair'),
  scene('omar-cook', 'A man stirring a pot of soup'),
  scene('kids-soccer', 'Two children playing soccer'),
  scene('nina-water', 'A girl drinking a glass of water'),
  scene('ben-letter', 'A boy writing a letter at a desk'),
  scene('ms-lee-class', 'A teacher teaching three students'),
  scene('ami-sleep', 'A girl sleeping in bed'),
  scene('kai-run', 'A boy running on a park path'),
  scene('lena-car', 'A woman driving a red car'),
  scene('paulo-dishes', 'A man washing dishes'),
  scene('twins-draw', 'Two children drawing with crayons'),
  scene('noah-guitar', 'A boy playing a guitar'),
  scene('hana-teeth', 'A girl brushing her teeth'),
  scene('family-breakfast', 'A family eating breakfast together'),
  scene('sam-dog', 'A man walking a dog'),
  scene('lina-swim', 'A girl swimming in a pool'),
  scene('jo-dance', 'A girl dancing and smiling'),
  scene('eli-door', 'A boy standing in an open yellow door'),
]

function slot(correct: string, a: string, b: string, c: string): WordSlot {
  return { correct, options: [correct, a, b, c] }
}

function prompt(def: {
  id: string
  sceneId: string
  focus: GrammarFocus
  label: string
  instruction: string
  teacherPrompt?: string
  punctuation?: '.' | '?'
  scoreRun?: boolean
  slots: WordSlot[]
}): SentencePrompt {
  const punctuation = def.punctuation ?? '.'
  return {
    id: def.id,
    sceneId: def.sceneId,
    focus: def.focus,
    label: def.label,
    instruction: def.instruction,
    teacherPrompt: def.teacherPrompt,
    punctuation,
    slots: def.slots,
    answer: `${def.slots.map((item) => item.correct).join(' ')}${punctuation}`,
    scoreRun: def.scoreRun ?? false,
  }
}

export const PROMPTS: SentencePrompt[] = [
  prompt({
    id: 'maya-ate',
    sceneId: 'maya-apple',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    scoreRun: true,
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('ate', 'eated', 'eaten', 'eat'),
      slot('an', 'a', 'the', 'some'),
      slot('apple', 'book', 'bike', 'ball'),
    ],
  }),
  prompt({
    id: 'maya-eats',
    sceneId: 'maya-apple',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does she do?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('eats', 'eat', 'eating', 'ate'),
      slot('an', 'a', 'the', 'some'),
      slot('apple', 'book', 'bike', 'ball'),
    ],
  }),
  prompt({
    id: 'maya-eating',
    sceneId: 'maya-apple',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('eating', 'eats', 'ate', 'eat'),
      slot('an', 'a', 'the', 'some'),
      slot('apple', 'book', 'bike', 'ball'),
    ],
  }),
  prompt({
    id: 'maya-what',
    sceneId: 'maya-apple',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('she', 'he', 'they', 'I'),
      slot('eating', 'eat', 'eats', 'ate'),
    ],
  }),
  prompt({
    id: 'maya-has',
    sceneId: 'maya-apple',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    slots: [
      slot('She', 'They', 'I', 'We'),
      slot('has', 'have', 'is', 'had'),
      slot('an', 'a', 'the', 'some'),
      slot('apple', 'bike', 'book', 'dog'),
    ],
  }),
  prompt({
    id: 'maya-hungry',
    sceneId: 'maya-apple',
    focus: 'be-present',
    label: GRAMMAR_LABELS['be-present'],
    instruction: 'Use is.',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'am', 'are', "isn't"),
      slot('hungry', 'thirsty', 'tired', 'scared'),
    ],
  }),

  prompt({
    id: 'leo-riding',
    sceneId: 'leo-bike',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    scoreRun: true,
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('riding', 'rides', 'rode', 'ride'),
      slot('a', 'an', 'the', 'some'),
      slot('bike', 'car', 'book', 'ball'),
    ],
  }),
  prompt({
    id: 'leo-rides',
    sceneId: 'leo-bike',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does he do?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('rides', 'ride', 'riding', 'rode'),
      slot('a', 'an', 'the', 'some'),
      slot('bike', 'car', 'book', 'ball'),
    ],
  }),
  prompt({
    id: 'leo-rode',
    sceneId: 'leo-bike',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('rode', 'rided', 'ridden', 'ride'),
      slot('a', 'an', 'the', 'some'),
      slot('bike', 'car', 'book', 'ball'),
    ],
  }),
  prompt({
    id: 'leo-what',
    sceneId: 'leo-bike',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('he', 'she', 'they', 'I'),
      slot('riding', 'ride', 'rides', 'rode'),
    ],
  }),
  prompt({
    id: 'leo-has',
    sceneId: 'leo-bike',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('has', 'have', 'is', 'had'),
      slot('a', 'an', 'the', 'some'),
      slot('bike', 'apple', 'book', 'dog'),
    ],
  }),

  prompt({
    id: 'sara-reading',
    sceneId: 'sara-book',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    scoreRun: true,
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('reading', 'reads', 'read', 'ate'),
      slot('a', 'an', 'the', 'some'),
      slot('book', 'apple', 'bike', 'letter'),
    ],
  }),
  prompt({
    id: 'sara-reads',
    sceneId: 'sara-book',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does she do?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('reads', 'read', 'reading', 'ate'),
      slot('a', 'an', 'the', 'some'),
      slot('book', 'apple', 'bike', 'letter'),
    ],
  }),
  prompt({
    id: 'sara-what',
    sceneId: 'sara-book',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('she', 'he', 'they', 'I'),
      slot('reading', 'reads', 'read', 'ate'),
    ],
  }),
  prompt({
    id: 'sara-has',
    sceneId: 'sara-book',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    slots: [
      slot('She', 'They', 'He', 'I'),
      slot('has', 'have', 'is', 'had'),
      slot('a', 'an', 'the', 'some'),
      slot('book', 'apple', 'bike', 'guitar'),
    ],
  }),

  prompt({
    id: 'omar-cooked',
    sceneId: 'omar-cook',
    focus: 'past-simple-regular',
    label: GRAMMAR_LABELS['past-simple-regular'],
    instruction: 'Past simple. The verb is regular.',
    scoreRun: true,
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('cooked', 'cookd', 'cooking', 'cooks'),
      slot('some', 'a', 'an', 'the'),
      slot('soup', 'salad', 'pizza', 'rice'),
    ],
  }),
  prompt({
    id: 'omar-cooking',
    sceneId: 'omar-cook',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('cooking', 'cooks', 'cooked', 'cook'),
      slot('soup', 'salad', 'pizza', 'rice'),
    ],
  }),
  prompt({
    id: 'omar-cooks',
    sceneId: 'omar-cook',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does he do?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('cooks', 'cook', 'cooking', 'cooked'),
      slot('soup', 'salad', 'pizza', 'rice'),
    ],
  }),
  prompt({
    id: 'omar-what',
    sceneId: 'omar-cook',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('he', 'she', 'they', 'I'),
      slot('cooking', 'cook', 'cooks', 'cooked'),
    ],
  }),

  prompt({
    id: 'kids-were',
    sceneId: 'kids-soccer',
    focus: 'be-past',
    label: GRAMMAR_LABELS['be-past'],
    instruction: 'Use were.',
    teacherPrompt: 'Were they happy?',
    scoreRun: true,
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('were', 'was', 'are', "weren't"),
      slot('happy', 'sad', 'angry', 'scared'),
    ],
  }),
  prompt({
    id: 'kids-playing',
    sceneId: 'kids-soccer',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('are', 'is', 'am', 'were'),
      slot('playing', 'play', 'played', 'plays'),
      slot('soccer', 'tennis', 'basketball', 'piano'),
    ],
  }),
  prompt({
    id: 'kids-play',
    sceneId: 'kids-soccer',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What do they do?',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('play', 'plays', 'playing', 'played'),
      slot('soccer', 'tennis', 'basketball', 'piano'),
    ],
  }),
  prompt({
    id: 'kids-played',
    sceneId: 'kids-soccer',
    focus: 'past-simple-regular',
    label: GRAMMAR_LABELS['past-simple-regular'],
    instruction: 'Past simple. The verb is regular.',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('played', 'playd', 'playing', 'plays'),
      slot('soccer', 'tennis', 'basketball', 'piano'),
    ],
  }),
  prompt({
    id: 'kids-what',
    sceneId: 'kids-soccer',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('are', 'is', 'were', 'do'),
      slot('they', 'she', 'he', 'I'),
      slot('playing', 'play', 'played', 'plays'),
    ],
  }),
  prompt({
    id: 'kids-have',
    sceneId: 'kids-soccer',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('have', 'has', 'are', 'had'),
      slot('a', 'an', 'the', 'some'),
      slot('ball', 'bike', 'book', 'dog'),
    ],
  }),
  prompt({
    id: 'kids-are-happy',
    sceneId: 'kids-soccer',
    focus: 'be-present',
    label: GRAMMAR_LABELS['be-present'],
    instruction: 'Use are.',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('are', 'is', 'am', 'were'),
      slot('happy', 'sad', 'angry', 'scared'),
    ],
  }),

  prompt({
    id: 'nina-what',
    sceneId: 'nina-water',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    scoreRun: true,
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('she', 'he', 'they', 'I'),
      slot('drinking', 'drink', 'drinks', 'drank'),
    ],
  }),
  prompt({
    id: 'nina-drinking',
    sceneId: 'nina-water',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('drinking', 'drinks', 'drank', 'drink'),
      slot('water', 'juice', 'milk', 'soda'),
    ],
  }),
  prompt({
    id: 'nina-drank',
    sceneId: 'nina-water',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('drank', 'drinked', 'drunk', 'drink'),
      slot('some', 'a', 'an', 'the'),
      slot('water', 'juice', 'milk', 'soda'),
    ],
  }),
  prompt({
    id: 'nina-thirsty',
    sceneId: 'nina-water',
    focus: 'be-present',
    label: GRAMMAR_LABELS['be-present'],
    instruction: 'Use is.',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'am', 'are', "isn't"),
      slot('thirsty', 'hungry', 'tired', 'scared'),
    ],
  }),
  prompt({
    id: 'nina-has',
    sceneId: 'nina-water',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    slots: [
      slot('She', 'They', 'He', 'I'),
      slot('has', 'have', 'is', 'had'),
      slot('a', 'an', 'the', 'some'),
      slot('glass', 'apple', 'bike', 'book'),
    ],
  }),

  prompt({
    id: 'ben-wrote',
    sceneId: 'ben-letter',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    scoreRun: true,
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('wrote', 'writed', 'written', 'write'),
      slot('a', 'an', 'the', 'some'),
      slot('letter', 'book', 'song', 'email'),
    ],
  }),
  prompt({
    id: 'ben-writing',
    sceneId: 'ben-letter',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('writing', 'writes', 'wrote', 'write'),
      slot('a', 'an', 'the', 'some'),
      slot('letter', 'book', 'song', 'email'),
    ],
  }),
  prompt({
    id: 'ben-writes',
    sceneId: 'ben-letter',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does he do?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('writes', 'write', 'writing', 'wrote'),
      slot('a', 'an', 'the', 'some'),
      slot('letter', 'book', 'song', 'email'),
    ],
  }),
  prompt({
    id: 'ben-what',
    sceneId: 'ben-letter',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('he', 'she', 'they', 'I'),
      slot('writing', 'write', 'writes', 'wrote'),
    ],
  }),

  prompt({
    id: 'mslee-teaches',
    sceneId: 'ms-lee-class',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does she do?',
    scoreRun: true,
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('teaches', 'teach', 'teaching', 'taught'),
      slot('a', 'an', 'the', 'some'),
      slot('class', 'song', 'car', 'meal'),
    ],
  }),
  prompt({
    id: 'mslee-teaching',
    sceneId: 'ms-lee-class',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('teaching', 'teaches', 'taught', 'teach'),
      slot('a', 'an', 'the', 'some'),
      slot('class', 'song', 'car', 'meal'),
    ],
  }),
  prompt({
    id: 'mslee-taught',
    sceneId: 'ms-lee-class',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('taught', 'teached', 'teaching', 'teach'),
      slot('a', 'an', 'the', 'some'),
      slot('class', 'song', 'car', 'meal'),
    ],
  }),
  prompt({
    id: 'mslee-who',
    sceneId: 'ms-lee-class',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with Who.',
    punctuation: '?',
    slots: [
      slot('Who', 'What', 'Where', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('teaching', 'teach', 'teaches', 'taught'),
    ],
  }),

  prompt({
    id: 'ami-am',
    sceneId: 'ami-sleep',
    focus: 'be-present',
    label: GRAMMAR_LABELS['be-present'],
    instruction: 'What would she say? Use am.',
    scoreRun: true,
    slots: [
      slot('I', 'She', 'He', 'They'),
      slot('am', 'is', 'are', 'was'),
      slot('tired', 'hungry', 'thirsty', 'scared'),
    ],
  }),
  prompt({
    id: 'ami-is-tired',
    sceneId: 'ami-sleep',
    focus: 'be-present',
    label: GRAMMAR_LABELS['be-present'],
    instruction: 'Use is.',
    slots: [
      slot('She', 'I', 'He', 'They'),
      slot('is', 'am', 'are', "isn't"),
      slot('tired', 'hungry', 'thirsty', 'scared'),
    ],
  }),
  prompt({
    id: 'ami-was',
    sceneId: 'ami-sleep',
    focus: 'be-past',
    label: GRAMMAR_LABELS['be-past'],
    instruction: 'Use was.',
    slots: [
      slot('She', 'They', 'He', 'I'),
      slot('was', 'were', 'is', "wasn't"),
      slot('tired', 'hungry', 'thirsty', 'awake'),
    ],
  }),
  prompt({
    id: 'ami-wasnt',
    sceneId: 'ami-sleep',
    focus: 'be-past',
    label: GRAMMAR_LABELS['be-past'],
    instruction: 'Use wasn\'t.',
    teacherPrompt: 'Was she awake?',
    slots: [
      slot('She', 'They', 'He', 'I'),
      slot("wasn't", "weren't", "isn't", 'was'),
      slot('awake', 'asleep', 'tired', 'happy'),
    ],
  }),
  prompt({
    id: 'ami-sleeping',
    sceneId: 'ami-sleep',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('sleeping', 'sleeps', 'slept', 'sleep'),
      slot('now', 'yesterday', 'tomorrow', 'later'),
    ],
  }),
  prompt({
    id: 'ami-slept',
    sceneId: 'ami-sleep',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('slept', 'sleeped', 'sleeping', 'sleep'),
      slot('in', 'on', 'at', 'under'),
      slot('bed', 'school', 'park', 'class'),
    ],
  }),

  prompt({
    id: 'kai-was',
    sceneId: 'kai-run',
    focus: 'be-past',
    label: GRAMMAR_LABELS['be-past'],
    instruction: 'Use was.',
    teacherPrompt: 'Was he fast?',
    scoreRun: true,
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('was', 'were', 'is', "wasn't"),
      slot('fast', 'slow', 'sad', 'late'),
    ],
  }),
  prompt({
    id: 'kai-running',
    sceneId: 'kai-run',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('running', 'runs', 'ran', 'run'),
      slot('now', 'yesterday', 'tomorrow', 'later'),
    ],
  }),
  prompt({
    id: 'kai-ran',
    sceneId: 'kai-run',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('ran', 'runned', 'running', 'run'),
      slot('in', 'on', 'at', 'under'),
      slot('the', 'a', 'an', 'some'),
      slot('park', 'pool', 'kitchen', 'class'),
    ],
  }),
  prompt({
    id: 'kai-runs',
    sceneId: 'kai-run',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does he do?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('runs', 'run', 'running', 'ran'),
      slot('every', 'yesterday', 'now', 'tomorrow'),
      slot('day', 'week', 'night', 'year'),
    ],
  }),
  prompt({
    id: 'kai-where',
    sceneId: 'kai-run',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with Where.',
    punctuation: '?',
    slots: [
      slot('Where', 'What', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('he', 'she', 'they', 'I'),
      slot('running', 'run', 'runs', 'ran'),
    ],
  }),

  prompt({
    id: 'lena-drives',
    sceneId: 'lena-car',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does she do?',
    scoreRun: true,
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('drives', 'drive', 'driving', 'drove'),
      slot('a', 'an', 'the', 'some'),
      slot('car', 'bike', 'bus', 'train'),
    ],
  }),
  prompt({
    id: 'lena-driving',
    sceneId: 'lena-car',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('driving', 'drives', 'drove', 'drive'),
      slot('a', 'an', 'the', 'some'),
      slot('car', 'bike', 'bus', 'train'),
    ],
  }),
  prompt({
    id: 'lena-drove',
    sceneId: 'lena-car',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('drove', 'drived', 'driven', 'drive'),
      slot('a', 'an', 'the', 'some'),
      slot('car', 'bike', 'bus', 'train'),
    ],
  }),
  prompt({
    id: 'lena-what',
    sceneId: 'lena-car',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('she', 'he', 'they', 'I'),
      slot('driving', 'drive', 'drives', 'drove'),
    ],
  }),
  prompt({
    id: 'lena-has',
    sceneId: 'lena-car',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    slots: [
      slot('She', 'They', 'He', 'I'),
      slot('has', 'have', 'is', 'had'),
      slot('a', 'an', 'the', 'some'),
      slot('car', 'bike', 'book', 'dog'),
    ],
  }),

  prompt({
    id: 'paulo-washed',
    sceneId: 'paulo-dishes',
    focus: 'past-simple-regular',
    label: GRAMMAR_LABELS['past-simple-regular'],
    instruction: 'Past simple. The verb is regular.',
    scoreRun: true,
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('washed', 'washt', 'washing', 'washes'),
      slot('the', 'a', 'an', 'some'),
      slot('dishes', 'clothes', 'windows', 'car'),
    ],
  }),
  prompt({
    id: 'paulo-washing',
    sceneId: 'paulo-dishes',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('washing', 'washes', 'washed', 'wash'),
      slot('dishes', 'clothes', 'windows', 'car'),
    ],
  }),
  prompt({
    id: 'paulo-washes',
    sceneId: 'paulo-dishes',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does he do?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('washes', 'wash', 'washing', 'washed'),
      slot('dishes', 'clothes', 'windows', 'car'),
    ],
  }),
  prompt({
    id: 'paulo-what',
    sceneId: 'paulo-dishes',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('he', 'she', 'they', 'I'),
      slot('washing', 'wash', 'washes', 'washed'),
    ],
  }),

  prompt({
    id: 'twins-have',
    sceneId: 'twins-draw',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    scoreRun: true,
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('have', 'has', 'are', 'had'),
      slot('some', 'a', 'an', 'the'),
      slot('crayons', 'pencils', 'books', 'apples'),
    ],
  }),
  prompt({
    id: 'twins-drawing',
    sceneId: 'twins-draw',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('are', 'is', 'am', 'were'),
      slot('drawing', 'draw', 'drew', 'draws'),
      slot('pictures', 'letters', 'music', 'soup'),
    ],
  }),
  prompt({
    id: 'twins-drew',
    sceneId: 'twins-draw',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('drew', 'drawed', 'drawn', 'draw'),
      slot('a', 'an', 'the', 'some'),
      slot('picture', 'letter', 'song', 'car'),
    ],
  }),
  prompt({
    id: 'twins-what',
    sceneId: 'twins-draw',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('are', 'is', 'were', 'do'),
      slot('they', 'she', 'he', 'I'),
      slot('drawing', 'draw', 'drew', 'draws'),
    ],
  }),

  prompt({
    id: 'noah-playing',
    sceneId: 'noah-guitar',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    scoreRun: true,
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('playing', 'plays', 'played', 'play'),
      slot('a', 'an', 'the', 'some'),
      slot('guitar', 'piano', 'drum', 'violin'),
    ],
  }),
  prompt({
    id: 'noah-plays',
    sceneId: 'noah-guitar',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does he do?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('plays', 'play', 'playing', 'played'),
      slot('a', 'an', 'the', 'some'),
      slot('guitar', 'piano', 'drum', 'violin'),
    ],
  }),
  prompt({
    id: 'noah-played',
    sceneId: 'noah-guitar',
    focus: 'past-simple-regular',
    label: GRAMMAR_LABELS['past-simple-regular'],
    instruction: 'Past simple. The verb is regular.',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('played', 'playd', 'playing', 'plays'),
      slot('a', 'an', 'the', 'some'),
      slot('guitar', 'piano', 'drum', 'violin'),
    ],
  }),
  prompt({
    id: 'noah-has',
    sceneId: 'noah-guitar',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    slots: [
      slot('He', 'They', 'She', 'I'),
      slot('has', 'have', 'is', 'had'),
      slot('a', 'an', 'the', 'some'),
      slot('guitar', 'piano', 'drum', 'violin'),
    ],
  }),
  prompt({
    id: 'noah-what',
    sceneId: 'noah-guitar',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('he', 'she', 'they', 'I'),
      slot('playing', 'play', 'plays', 'played'),
    ],
  }),

  prompt({
    id: 'hana-what',
    sceneId: 'hana-teeth',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    scoreRun: true,
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('she', 'he', 'they', 'I'),
      slot('brushing', 'brush', 'brushes', 'brushed'),
    ],
  }),
  prompt({
    id: 'hana-brushing',
    sceneId: 'hana-teeth',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('brushing', 'brushes', 'brushed', 'brush'),
      slot('her', 'his', 'their', 'my'),
      slot('teeth', 'hair', 'shoes', 'hands'),
    ],
  }),
  prompt({
    id: 'hana-brushed',
    sceneId: 'hana-teeth',
    focus: 'past-simple-regular',
    label: GRAMMAR_LABELS['past-simple-regular'],
    instruction: 'Past simple. The verb is regular.',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('brushed', 'brushd', 'brushing', 'brushes'),
      slot('her', 'his', 'their', 'my'),
      slot('teeth', 'hair', 'shoes', 'hands'),
    ],
  }),
  prompt({
    id: 'hana-brushes',
    sceneId: 'hana-teeth',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does she do?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('brushes', 'brush', 'brushing', 'brushed'),
      slot('her', 'his', 'their', 'my'),
      slot('teeth', 'hair', 'shoes', 'hands'),
    ],
  }),

  prompt({
    id: 'family-werent',
    sceneId: 'family-breakfast',
    focus: 'be-past',
    label: GRAMMAR_LABELS['be-past'],
    instruction: 'Use weren\'t.',
    teacherPrompt: 'Were they late?',
    scoreRun: true,
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot("weren't", "wasn't", "aren't", 'were'),
      slot('late', 'early', 'hungry', 'sad'),
    ],
  }),
  prompt({
    id: 'family-eating',
    sceneId: 'family-breakfast',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('are', 'is', 'am', 'were'),
      slot('eating', 'eat', 'ate', 'eats'),
      slot('breakfast', 'lunch', 'dinner', 'cake'),
    ],
  }),
  prompt({
    id: 'family-ate',
    sceneId: 'family-breakfast',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('ate', 'eated', 'eaten', 'eat'),
      slot('breakfast', 'lunch', 'dinner', 'cake'),
    ],
  }),
  prompt({
    id: 'family-hungry',
    sceneId: 'family-breakfast',
    focus: 'be-present',
    label: GRAMMAR_LABELS['be-present'],
    instruction: 'Use are.',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('are', 'is', 'am', 'were'),
      slot('hungry', 'thirsty', 'tired', 'scared'),
    ],
  }),
  prompt({
    id: 'family-have',
    sceneId: 'family-breakfast',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    slots: [
      slot('They', 'She', 'He', 'I'),
      slot('have', 'has', 'are', 'had'),
      slot('breakfast', 'lunch', 'dinner', 'cake'),
    ],
  }),

  prompt({
    id: 'sam-has',
    sceneId: 'sam-dog',
    focus: 'has-have',
    label: GRAMMAR_LABELS['has-have'],
    instruction: 'Use has or have.',
    scoreRun: true,
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('has', 'have', 'is', 'had'),
      slot('a', 'an', 'the', 'some'),
      slot('dog', 'cat', 'bike', 'ball'),
    ],
  }),
  prompt({
    id: 'sam-walking',
    sceneId: 'sam-dog',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('walking', 'walks', 'walked', 'walk'),
      slot('a', 'an', 'the', 'some'),
      slot('dog', 'cat', 'bike', 'ball'),
    ],
  }),
  prompt({
    id: 'sam-walked',
    sceneId: 'sam-dog',
    focus: 'past-simple-regular',
    label: GRAMMAR_LABELS['past-simple-regular'],
    instruction: 'Past simple. The verb is regular.',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('walked', 'walkd', 'walking', 'walks'),
      slot('a', 'an', 'the', 'some'),
      slot('dog', 'cat', 'bike', 'ball'),
    ],
  }),
  prompt({
    id: 'sam-what',
    sceneId: 'sam-dog',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('he', 'she', 'they', 'I'),
      slot('walking', 'walk', 'walks', 'walked'),
    ],
  }),

  prompt({
    id: 'lina-is',
    sceneId: 'lina-swim',
    focus: 'be-present',
    label: GRAMMAR_LABELS['be-present'],
    instruction: 'Use is.',
    scoreRun: true,
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'am', 'are', "isn't"),
      slot('happy', 'sad', 'scared', 'angry'),
    ],
  }),
  prompt({
    id: 'lina-swimming',
    sceneId: 'lina-swim',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('swimming', 'swims', 'swam', 'swim'),
      slot('now', 'yesterday', 'tomorrow', 'later'),
    ],
  }),
  prompt({
    id: 'lina-swam',
    sceneId: 'lina-swim',
    focus: 'past-simple-irregular',
    label: GRAMMAR_LABELS['past-simple-irregular'],
    instruction: 'Past simple. The verb is irregular.',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('swam', 'swimmed', 'swimming', 'swim'),
      slot('in', 'on', 'at', 'under'),
      slot('a', 'an', 'the', 'some'),
      slot('pool', 'park', 'kitchen', 'class'),
    ],
  }),
  prompt({
    id: 'lina-where',
    sceneId: 'lina-swim',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with Where.',
    punctuation: '?',
    slots: [
      slot('Where', 'What', 'Who', 'When'),
      slot('is', 'are', 'did', 'was'),
      slot('she', 'he', 'they', 'I'),
      slot('swimming', 'swim', 'swam', 'swims'),
    ],
  }),
  prompt({
    id: 'lina-swims',
    sceneId: 'lina-swim',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does she do?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('swims', 'swim', 'swimming', 'swam'),
      slot('every', 'yesterday', 'now', 'tomorrow'),
      slot('day', 'week', 'night', 'year'),
    ],
  }),

  prompt({
    id: 'jo-isnt',
    sceneId: 'jo-dance',
    focus: 'be-present',
    label: GRAMMAR_LABELS['be-present'],
    instruction: 'Use isn\'t.',
    teacherPrompt: 'Is she sad?',
    scoreRun: true,
    slots: [
      slot('She', 'They', 'He', 'I'),
      slot("isn't", "aren't", "wasn't", 'is'),
      slot('sad', 'happy', 'hungry', 'tired'),
    ],
  }),
  prompt({
    id: 'jo-dancing',
    sceneId: 'jo-dance',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('dancing', 'dances', 'danced', 'dance'),
      slot('now', 'yesterday', 'tomorrow', 'later'),
    ],
  }),
  prompt({
    id: 'jo-danced',
    sceneId: 'jo-dance',
    focus: 'past-simple-regular',
    label: GRAMMAR_LABELS['past-simple-regular'],
    instruction: 'Past simple. The verb is regular.',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('danced', 'danceed', 'dancing', 'dances'),
      slot('yesterday', 'today', 'now', 'tomorrow'),
    ],
  }),
  prompt({
    id: 'jo-am',
    sceneId: 'jo-dance',
    focus: 'be-present',
    label: GRAMMAR_LABELS['be-present'],
    instruction: 'What would she say? Use am.',
    slots: [
      slot('I', 'She', 'He', 'They'),
      slot('am', 'is', 'are', 'was'),
      slot('happy', 'sad', 'tired', 'scared'),
    ],
  }),
  prompt({
    id: 'jo-dances',
    sceneId: 'jo-dance',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does she do?',
    slots: [
      slot('She', 'He', 'They', 'I'),
      slot('dances', 'dance', 'dancing', 'danced'),
      slot('every', 'yesterday', 'now', 'tomorrow'),
      slot('day', 'week', 'night', 'year'),
    ],
  }),

  prompt({
    id: 'eli-wasnt',
    sceneId: 'eli-door',
    focus: 'be-past',
    label: GRAMMAR_LABELS['be-past'],
    instruction: 'Use wasn\'t.',
    teacherPrompt: 'Was he scared?',
    scoreRun: true,
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot("wasn't", "weren't", "isn't", 'was'),
      slot('scared', 'happy', 'hungry', 'tired'),
    ],
  }),
  prompt({
    id: 'eli-opened',
    sceneId: 'eli-door',
    focus: 'past-simple-regular',
    label: GRAMMAR_LABELS['past-simple-regular'],
    instruction: 'Past simple. The verb is regular.',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('opened', 'openned', 'opening', 'opens'),
      slot('the', 'a', 'an', 'some'),
      slot('door', 'window', 'book', 'box'),
    ],
  }),
  prompt({
    id: 'eli-opens',
    sceneId: 'eli-door',
    focus: 'present-simple',
    label: GRAMMAR_LABELS['present-simple'],
    instruction: 'Present simple. What does he do?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('opens', 'open', 'opening', 'opened'),
      slot('the', 'a', 'an', 'some'),
      slot('door', 'window', 'book', 'box'),
    ],
  }),
  prompt({
    id: 'eli-what',
    sceneId: 'eli-door',
    focus: 'wh-question',
    label: GRAMMAR_LABELS['wh-question'],
    instruction: 'Ask a question with What.',
    punctuation: '?',
    slots: [
      slot('What', 'Where', 'Who', 'When'),
      slot('did', 'does', 'is', 'was'),
      slot('he', 'she', 'they', 'I'),
      slot('open', 'opened', 'opening', 'opens'),
    ],
  }),
  prompt({
    id: 'eli-opening',
    sceneId: 'eli-door',
    focus: 'present-continuous',
    label: GRAMMAR_LABELS['present-continuous'],
    instruction: 'Present continuous. What is happening now?',
    slots: [
      slot('He', 'She', 'They', 'I'),
      slot('is', 'are', 'am', 'was'),
      slot('opening', 'opens', 'opened', 'open'),
      slot('the', 'a', 'an', 'some'),
      slot('door', 'window', 'book', 'box'),
    ],
  }),
]

const sceneMap = new Map(SCENES.map((item) => [item.id, item]))

export function getScene(sceneId: string): Scene {
  const found = sceneMap.get(sceneId)
  if (!found) {
    throw new Error(`Unknown sentence-builder scene: ${sceneId}`)
  }
  return found
}
