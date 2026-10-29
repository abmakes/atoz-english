/**
 * Built-in Sentence Builder scenes and prompts.
 * Each practice run uses one grammar structure and all 20 pictures.
 * A choice is another form of the same word. Articles stay attached to the
 * noun so "a guitar" and "the guitar" are never rival answers.
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

export const GRAMMAR_FOCUSES: readonly GrammarFocus[] = [
  'present-simple',
  'present-continuous',
  'wh-question',
  'be-present',
  'be-past',
  'has-have',
  'past-simple-regular',
  'past-simple-irregular',
]

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
}

export interface Scene {
  id: string
  image: string
  alt: string
}

export const GRAMMAR_LABELS: Record<GrammarFocus, string> = {
  'present-simple': 'Present simple',
  'present-continuous': 'Present continuous',
  'wh-question': 'WH questions',
  'be-present': 'am / is / are / isn\'t',
  'be-past': 'was / were / wasn\'t / weren\'t',
  'has-have': 'has / have',
  'past-simple-regular': 'Past simple, regular',
  'past-simple-irregular': 'Past simple, irregular',
}

export const GRAMMAR_BLURBS: Record<GrammarFocus, string> = {
  'present-simple': 'She eats an apple.',
  'present-continuous': 'She is eating an apple.',
  'wh-question': 'What is she eating?',
  'be-present': 'I am tired. She isn\'t sad.',
  'be-past': 'He wasn\'t scared. They weren\'t sad.',
  'has-have': 'She has an apple.',
  'past-simple-regular': 'He washed the dishes.',
  'past-simple-irregular': 'She ate an apple.',
}

type Person = 'She' | 'He' | 'They'
type BeAux = 'is' | 'are' | 'am' | "isn't" | 'was' | 'were' | "wasn't" | "weren't"
type WhWord = 'What' | 'Where' | 'Who'

interface BeLine {
  who?: Person | 'I'
  aux: BeAux
  adjective: readonly [string, string, string, string]
  instruction: string
  teacherPrompt?: string
}

interface VerbLine {
  verb: readonly [string, string, string, string]
  object: WordSlot
}

interface SceneLine {
  id: string
  alt: string
  who: Person
  object: WordSlot
  simple: readonly [string, string, string, string]
  continuous: readonly [string, string, string, string]
  wh: {
    word: WhWord
    verb: readonly [string, string, string, string]
  }
  bePresent: BeLine
  bePast: BeLine
  possession: WordSlot
  regular: VerbLine
  irregular: VerbLine
}

function choice(correct: string, a: string, b: string, c: string): WordSlot {
  const options = [correct, a, b, c] as const
  if (new Set(options).size !== 4) {
    throw new Error(`Sentence Builder choices must be four different forms: ${options.join(' | ')}`)
  }
  return { correct, options }
}

function subjectSlot(who: Person | 'I'): WordSlot {
  if (who === 'She') return choice('She', 'Her', 'Hers', 'Shes')
  if (who === 'He') return choice('He', 'Him', 'His', 'Hes')
  if (who === 'They') return choice('They', 'Them', 'Their', 'Theyre')
  return choice('I', 'Me', 'My', 'Im')
}

function questionSubject(who: Person): WordSlot {
  if (who === 'She') return choice('she', 'her', 'hers', 'shes')
  if (who === 'He') return choice('he', 'him', 'his', 'hes')
  return choice('they', 'them', 'their', 'theyre')
}

function whWord(word: WhWord): WordSlot {
  if (word === 'What') return choice('What', 'Whats', 'Whating', 'Whatd')
  if (word === 'Where') return choice('Where', 'Wheres', 'Whering', 'Whered')
  return choice('Who', 'Whos', 'Whoing', 'Whod')
}

function auxiliary(correct: 'is' | 'are'): WordSlot {
  return correct === 'is' ? choice('is', 'are', 'am', 'be') : choice('are', 'is', 'am', 'be')
}

function beSlot(correct: BeAux): WordSlot {
  const table: Record<BeAux, readonly [string, string, string, string]> = {
    is: ['is', 'are', 'am', 'be'],
    are: ['are', 'is', 'am', 'be'],
    am: ['am', 'is', 'are', 'be'],
    "isn't": ["isn't", "aren't", 'am', 'be'],
    was: ['was', 'were', 'be', 'been'],
    were: ['were', 'was', 'be', 'been'],
    "wasn't": ["wasn't", "weren't", 'was', 'were'],
    "weren't": ["weren't", "wasn't", 'were', 'was'],
  }
  const [right, a, b, c] = table[correct]
  return choice(right, a, b, c)
}

function haveSlot(who: Person): WordSlot {
  return who === 'They'
    ? choice('have', 'has', 'having', 'haves')
    : choice('has', 'have', 'having', 'haves')
}

function verbSlot(forms: readonly [string, string, string, string]): WordSlot {
  return choice(forms[0], forms[1], forms[2], forms[3])
}

const LINES: SceneLine[] = [
  {
    id: 'maya-apple',
    alt: 'A girl holding a red apple in a kitchen',
    who: 'She',
    object: choice('an apple', 'a apple', 'apple', 'an apples'),
    simple: ['eats', 'eat', 'eating', 'ate'],
    continuous: ['eating', 'eats', 'eat', 'ate'],
    wh: { word: 'What', verb: ['eating', 'eats', 'eat', 'ate'] },
    bePresent: {
      aux: 'is',
      adjective: ['hungry', 'hungrily', 'hungrys', 'hungries'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: "wasn't",
      adjective: ['sad', 'sadly', 'sads', 'saddly'],
      instruction: "Answer no. Use wasn't.",
      teacherPrompt: 'Was she sad?',
    },
    possession: choice('an apple', 'a apple', 'apple', 'an apples'),
    regular: {
      verb: ['picked', 'pick', 'picks', 'picking'],
      object: choice('an apple', 'a apple', 'apple', 'an apples'),
    },
    irregular: {
      verb: ['ate', 'eat', 'eats', 'eaten'],
      object: choice('an apple', 'a apple', 'apple', 'an apples'),
    },
  },
  {
    id: 'leo-bike',
    alt: 'A boy riding a blue bicycle',
    who: 'He',
    object: choice('a bike', 'an bike', 'bike', 'a bikes'),
    simple: ['rides', 'ride', 'riding', 'rode'],
    continuous: ['riding', 'rides', 'ride', 'rode'],
    wh: { word: 'What', verb: ['riding', 'rides', 'ride', 'rode'] },
    bePresent: {
      aux: 'is',
      adjective: ['happy', 'happily', 'happys', 'happyly'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: "wasn't",
      adjective: ['tired', 'tiredly', 'tire', 'tireds'],
      instruction: "Answer no. Use wasn't.",
      teacherPrompt: 'Was he tired?',
    },
    possession: choice('a bike', 'an bike', 'bike', 'a bikes'),
    regular: {
      verb: ['pedaled', 'pedal', 'pedals', 'pedaling'],
      object: choice('a bike', 'an bike', 'bike', 'a bikes'),
    },
    irregular: {
      verb: ['rode', 'ride', 'rides', 'ridden'],
      object: choice('a bike', 'an bike', 'bike', 'a bikes'),
    },
  },
  {
    id: 'sara-book',
    alt: 'A woman reading a book in a chair',
    who: 'She',
    object: choice('a book', 'an book', 'book', 'a books'),
    simple: ['reads', 'read', 'reading', 'readed'],
    continuous: ['reading', 'reads', 'read', 'readed'],
    wh: { word: 'What', verb: ['reading', 'reads', 'read', 'readed'] },
    bePresent: {
      aux: 'is',
      adjective: ['quiet', 'quietly', 'quiets', 'quietes'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['quiet', 'quietly', 'quiets', 'quietes'],
      instruction: 'Past. Use was.',
    },
    possession: choice('a book', 'an book', 'book', 'a books'),
    regular: {
      verb: ['opened', 'open', 'opens', 'opening'],
      object: choice('a book', 'an book', 'book', 'a books'),
    },
    irregular: {
      verb: ['held', 'hold', 'holds', 'holding'],
      object: choice('a book', 'an book', 'book', 'a books'),
    },
  },
  {
    id: 'omar-cook',
    alt: 'A man stirring a pot of soup',
    who: 'He',
    object: choice('some soup', 'an soup', 'a soups', 'soups'),
    simple: ['cooks', 'cook', 'cooking', 'cooked'],
    continuous: ['cooking', 'cooks', 'cook', 'cooked'],
    wh: { word: 'What', verb: ['cooking', 'cooks', 'cook', 'cooked'] },
    bePresent: {
      aux: 'is',
      adjective: ['busy', 'busily', 'busys', 'busyed'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['busy', 'busily', 'busys', 'busyed'],
      instruction: 'Past. Use was.',
    },
    possession: choice('some soup', 'an soup', 'a soups', 'soups'),
    regular: {
      verb: ['cooked', 'cook', 'cooks', 'cooking'],
      object: choice('some soup', 'an soup', 'a soups', 'soups'),
    },
    irregular: {
      verb: ['made', 'make', 'makes', 'making'],
      object: choice('some soup', 'an soup', 'a soups', 'soups'),
    },
  },
  {
    id: 'kids-soccer',
    alt: 'Two children playing soccer',
    who: 'They',
    object: choice('soccer', 'soccers', 'an soccer', 'soccered'),
    simple: ['play', 'plays', 'playing', 'played'],
    continuous: ['playing', 'play', 'plays', 'played'],
    wh: { word: 'What', verb: ['playing', 'play', 'plays', 'played'] },
    bePresent: {
      aux: 'are',
      adjective: ['happy', 'happily', 'happys', 'happyly'],
      instruction: 'Present. Use are.',
    },
    bePast: {
      aux: "weren't",
      adjective: ['sad', 'sadly', 'sads', 'saddly'],
      instruction: "Answer no. Use weren't.",
      teacherPrompt: 'Were they sad?',
    },
    possession: choice('a ball', 'an ball', 'ball', 'a balls'),
    regular: {
      verb: ['kicked', 'kick', 'kicks', 'kicking'],
      object: choice('a ball', 'an ball', 'ball', 'a balls'),
    },
    irregular: {
      verb: ['ran', 'run', 'runs', 'running'],
      object: choice('after a ball', 'after an ball', 'after ball', 'after a balls'),
    },
  },
  {
    id: 'nina-water',
    alt: 'A girl drinking a glass of water',
    who: 'She',
    object: choice('some water', 'an water', 'a waters', 'waters'),
    simple: ['drinks', 'drink', 'drinking', 'drank'],
    continuous: ['drinking', 'drinks', 'drink', 'drank'],
    wh: { word: 'What', verb: ['drinking', 'drinks', 'drink', 'drank'] },
    bePresent: {
      aux: 'is',
      adjective: ['thirsty', 'thirstily', 'thirsts', 'thirsted'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['thirsty', 'thirstily', 'thirsts', 'thirsted'],
      instruction: 'Past. Use was.',
    },
    possession: choice('some water', 'an water', 'a waters', 'waters'),
    regular: {
      verb: ['sipped', 'sip', 'sips', 'sipping'],
      object: choice('some water', 'an water', 'a waters', 'waters'),
    },
    irregular: {
      verb: ['drank', 'drink', 'drinks', 'drinking'],
      object: choice('some water', 'an water', 'a waters', 'waters'),
    },
  },
  {
    id: 'ben-letter',
    alt: 'A boy writing a letter at a desk',
    who: 'He',
    object: choice('a letter', 'an letter', 'letter', 'a letters'),
    simple: ['writes', 'write', 'writing', 'wrote'],
    continuous: ['writing', 'writes', 'write', 'wrote'],
    wh: { word: 'What', verb: ['writing', 'writes', 'write', 'wrote'] },
    bePresent: {
      aux: 'is',
      adjective: ['quiet', 'quietly', 'quiets', 'quietes'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['quiet', 'quietly', 'quiets', 'quietes'],
      instruction: 'Past. Use was.',
    },
    possession: choice('a letter', 'an letter', 'letter', 'a letters'),
    regular: {
      verb: ['started', 'start', 'starts', 'starting'],
      object: choice('a letter', 'an letter', 'letter', 'a letters'),
    },
    irregular: {
      verb: ['wrote', 'write', 'writes', 'writing'],
      object: choice('a letter', 'an letter', 'letter', 'a letters'),
    },
  },
  {
    id: 'ms-lee-class',
    alt: 'A teacher teaching three students',
    who: 'She',
    object: choice('the class', 'an class', 'a classes', 'classed'),
    simple: ['teaches', 'teach', 'teaching', 'taught'],
    continuous: ['teaching', 'teaches', 'teach', 'taught'],
    wh: { word: 'Who', verb: ['teaching', 'teaches', 'teach', 'taught'] },
    bePresent: {
      aux: 'is',
      adjective: ['helpful', 'helpfully', 'helpfuls', 'helpfull'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['helpful', 'helpfully', 'helpfuls', 'helpfull'],
      instruction: 'Past. Use was.',
    },
    possession: choice('a class', 'an class', 'classed', 'a classes'),
    regular: {
      verb: ['helped', 'help', 'helps', 'helping'],
      object: choice('the class', 'an class', 'a classes', 'classed'),
    },
    irregular: {
      verb: ['taught', 'teach', 'teaches', 'teaching'],
      object: choice('the class', 'an class', 'a classes', 'classed'),
    },
  },
  {
    id: 'ami-sleep',
    alt: 'A girl sleeping in bed',
    who: 'She',
    object: choice('in bed', 'in beds', 'in an bed', 'in a beds'),
    simple: ['sleeps', 'sleep', 'sleeping', 'slept'],
    continuous: ['sleeping', 'sleeps', 'sleep', 'slept'],
    wh: { word: 'What', verb: ['doing', 'does', 'do', 'did'] },
    bePresent: {
      who: 'I',
      aux: 'am',
      adjective: ['tired', 'tiredly', 'tire', 'tireds'],
      instruction: 'Present. Use am.',
      teacherPrompt: 'What would she say?',
    },
    bePast: {
      aux: 'was',
      adjective: ['tired', 'tiredly', 'tire', 'tireds'],
      instruction: 'Past. Use was.',
    },
    possession: choice('a bed', 'an bed', 'bed', 'a beds'),
    regular: {
      verb: ['stayed', 'stay', 'stays', 'staying'],
      object: choice('in bed', 'in beds', 'in an bed', 'in a beds'),
    },
    irregular: {
      verb: ['slept', 'sleep', 'sleeps', 'sleeping'],
      object: choice('in bed', 'in beds', 'in an bed', 'in a beds'),
    },
  },
  {
    id: 'kai-run',
    alt: 'A boy running on a park path',
    who: 'He',
    object: choice('in the park', 'in park', 'in an park', 'in a parks'),
    simple: ['runs', 'run', 'running', 'ran'],
    continuous: ['running', 'runs', 'run', 'ran'],
    wh: { word: 'Where', verb: ['running', 'runs', 'run', 'ran'] },
    bePresent: {
      aux: 'is',
      adjective: ['fast', 'fastly', 'fasts', 'fastes'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['fast', 'fastly', 'fasts', 'fastes'],
      instruction: 'Past. Use was.',
    },
    possession: choice('energy', 'energys', 'a energy', 'energies'),
    regular: {
      verb: ['jogged', 'jog', 'jogs', 'jogging'],
      object: choice('in the park', 'in park', 'in an park', 'in a parks'),
    },
    irregular: {
      verb: ['ran', 'run', 'runs', 'running'],
      object: choice('in the park', 'in park', 'in an park', 'in a parks'),
    },
  },
  {
    id: 'lena-car',
    alt: 'A woman driving a red car',
    who: 'She',
    object: choice('a car', 'an car', 'car', 'a cars'),
    simple: ['drives', 'drive', 'driving', 'drove'],
    continuous: ['driving', 'drives', 'drive', 'drove'],
    wh: { word: 'What', verb: ['driving', 'drives', 'drive', 'drove'] },
    bePresent: {
      aux: 'is',
      adjective: ['careful', 'carefully', 'carefuls', 'carefull'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['careful', 'carefully', 'carefuls', 'carefull'],
      instruction: 'Past. Use was.',
    },
    possession: choice('a car', 'an car', 'car', 'a cars'),
    regular: {
      verb: ['traveled', 'travel', 'travels', 'traveling'],
      object: choice('in a car', 'in an car', 'in car', 'in a cars'),
    },
    irregular: {
      verb: ['drove', 'drive', 'drives', 'driving'],
      object: choice('a car', 'an car', 'car', 'a cars'),
    },
  },
  {
    id: 'paulo-dishes',
    alt: 'A man washing dishes',
    who: 'He',
    object: choice('the dishes', 'a dishes', 'an dishes', 'dishs'),
    simple: ['washes', 'wash', 'washing', 'washed'],
    continuous: ['washing', 'washes', 'wash', 'washed'],
    wh: { word: 'What', verb: ['washing', 'washes', 'wash', 'washed'] },
    bePresent: {
      aux: 'is',
      adjective: ['busy', 'busily', 'busys', 'busyed'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['busy', 'busily', 'busys', 'busyed'],
      instruction: 'Past. Use was.',
    },
    possession: choice('the dishes', 'a dishes', 'an dishes', 'dishs'),
    regular: {
      verb: ['washed', 'wash', 'washes', 'washing'],
      object: choice('the dishes', 'a dishes', 'an dishes', 'dishs'),
    },
    irregular: {
      verb: ['did', 'do', 'does', 'doing'],
      object: choice('the dishes', 'a dishes', 'an dishes', 'dishs'),
    },
  },
  {
    id: 'twins-draw',
    alt: 'Two children drawing with crayons',
    who: 'They',
    object: choice('pictures', 'a pictures', 'an pictures', 'picture'),
    simple: ['draw', 'draws', 'drawing', 'drew'],
    continuous: ['drawing', 'draw', 'draws', 'drew'],
    wh: { word: 'What', verb: ['drawing', 'draw', 'draws', 'drew'] },
    bePresent: {
      aux: 'are',
      adjective: ['happy', 'happily', 'happys', 'happyly'],
      instruction: 'Present. Use are.',
    },
    bePast: {
      aux: 'were',
      adjective: ['happy', 'happily', 'happys', 'happyly'],
      instruction: 'Past. Use were.',
    },
    possession: choice('some crayons', 'a crayons', 'an crayons', 'crayon'),
    regular: {
      verb: ['colored', 'color', 'colors', 'coloring'],
      object: choice('pictures', 'a pictures', 'an pictures', 'picture'),
    },
    irregular: {
      verb: ['drew', 'draw', 'draws', 'drawing'],
      object: choice('pictures', 'a pictures', 'an pictures', 'picture'),
    },
  },
  {
    id: 'noah-guitar',
    alt: 'A boy playing a guitar',
    who: 'He',
    object: choice('a guitar', 'an guitar', 'guitar', 'a guitars'),
    simple: ['plays', 'play', 'playing', 'played'],
    continuous: ['playing', 'plays', 'play', 'played'],
    wh: { word: 'What', verb: ['playing', 'plays', 'play', 'played'] },
    bePresent: {
      aux: 'is',
      adjective: ['happy', 'happily', 'happys', 'happyly'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['happy', 'happily', 'happys', 'happyly'],
      instruction: 'Past. Use was.',
    },
    possession: choice('a guitar', 'an guitar', 'guitar', 'a guitars'),
    regular: {
      verb: ['played', 'play', 'plays', 'playing'],
      object: choice('a guitar', 'an guitar', 'guitar', 'a guitars'),
    },
    irregular: {
      verb: ['held', 'hold', 'holds', 'holding'],
      object: choice('a guitar', 'an guitar', 'guitar', 'a guitars'),
    },
  },
  {
    id: 'hana-teeth',
    alt: 'A girl brushing her teeth',
    who: 'She',
    object: choice('her teeth', 'she teeth', 'hers teeth', 'her tooths'),
    simple: ['brushes', 'brush', 'brushing', 'brushed'],
    continuous: ['brushing', 'brushes', 'brush', 'brushed'],
    wh: { word: 'What', verb: ['brushing', 'brushes', 'brush', 'brushed'] },
    bePresent: {
      aux: "isn't",
      adjective: ['sad', 'sadly', 'sads', 'saddly'],
      instruction: "Answer no. Use isn't.",
      teacherPrompt: 'Is she sad?',
    },
    bePast: {
      aux: 'was',
      adjective: ['careful', 'carefully', 'carefuls', 'carefull'],
      instruction: 'Past. Use was.',
    },
    possession: choice('a toothbrush', 'an toothbrush', 'toothbrush', 'a toothbrushes'),
    regular: {
      verb: ['brushed', 'brush', 'brushes', 'brushing'],
      object: choice('her teeth', 'she teeth', 'hers teeth', 'her tooths'),
    },
    irregular: {
      verb: ['held', 'hold', 'holds', 'holding'],
      object: choice('the brush', 'an brush', 'brush', 'a brushes'),
    },
  },
  {
    id: 'family-breakfast',
    alt: 'A family eating breakfast together',
    who: 'They',
    object: choice('breakfast', 'breakfasts', 'a breakfasts', 'an breakfast'),
    simple: ['eat', 'eats', 'eating', 'ate'],
    continuous: ['eating', 'eat', 'eats', 'ate'],
    wh: { word: 'What', verb: ['eating', 'eat', 'eats', 'ate'] },
    bePresent: {
      aux: 'are',
      adjective: ['hungry', 'hungrily', 'hungrys', 'hungries'],
      instruction: 'Present. Use are.',
    },
    bePast: {
      aux: "weren't",
      adjective: ['sad', 'sadly', 'sads', 'saddly'],
      instruction: "Answer no. Use weren't.",
      teacherPrompt: 'Were they sad?',
    },
    possession: choice('breakfast', 'breakfasts', 'a breakfasts', 'an breakfast'),
    regular: {
      verb: ['shared', 'share', 'shares', 'sharing'],
      object: choice('breakfast', 'breakfasts', 'a breakfasts', 'an breakfast'),
    },
    irregular: {
      verb: ['ate', 'eat', 'eats', 'eaten'],
      object: choice('breakfast', 'breakfasts', 'a breakfasts', 'an breakfast'),
    },
  },
  {
    id: 'sam-dog',
    alt: 'A man walking a dog',
    who: 'He',
    object: choice('a dog', 'an dog', 'dog', 'a dogs'),
    simple: ['walks', 'walk', 'walking', 'walked'],
    continuous: ['walking', 'walks', 'walk', 'walked'],
    wh: { word: 'What', verb: ['walking', 'walks', 'walk', 'walked'] },
    bePresent: {
      aux: 'is',
      adjective: ['kind', 'kinds', 'kindes', 'kinded'],
      instruction: 'Present. Use is.',
    },
    bePast: {
      aux: 'was',
      adjective: ['kind', 'kinds', 'kindes', 'kinded'],
      instruction: 'Past. Use was.',
    },
    possession: choice('a dog', 'an dog', 'dog', 'a dogs'),
    regular: {
      verb: ['walked', 'walk', 'walks', 'walking'],
      object: choice('a dog', 'an dog', 'dog', 'a dogs'),
    },
    irregular: {
      verb: ['led', 'lead', 'leads', 'leading'],
      object: choice('a dog', 'an dog', 'dog', 'a dogs'),
    },
  },
  {
    id: 'lina-swim',
    alt: 'A girl swimming in a pool',
    who: 'She',
    object: choice('in the pool', 'in pool', 'in an pool', 'in a pools'),
    simple: ['swims', 'swim', 'swimming', 'swam'],
    continuous: ['swimming', 'swims', 'swim', 'swam'],
    wh: { word: 'Where', verb: ['swimming', 'swims', 'swim', 'swam'] },
    bePresent: {
      who: 'I',
      aux: 'am',
      adjective: ['wet', 'wetly', 'wets', 'wett'],
      instruction: 'Present. Use am.',
      teacherPrompt: 'What does she say?',
    },
    bePast: {
      aux: 'was',
      adjective: ['wet', 'wetly', 'wets', 'wett'],
      instruction: 'Past. Use was.',
    },
    possession: choice('fun', 'funs', 'an fun', 'funning'),
    regular: {
      verb: ['splashed', 'splash', 'splashes', 'splashing'],
      object: choice('in the pool', 'in pool', 'in an pool', 'in a pools'),
    },
    irregular: {
      verb: ['swam', 'swim', 'swims', 'swimming'],
      object: choice('in the pool', 'in pool', 'in an pool', 'in a pools'),
    },
  },
  {
    id: 'jo-dance',
    alt: 'A girl dancing and smiling',
    who: 'She',
    object: choice('fun', 'funs', 'an fun', 'funning'),
    simple: ['dances', 'dance', 'dancing', 'danced'],
    continuous: ['dancing', 'dances', 'dance', 'danced'],
    wh: { word: 'What', verb: ['doing', 'does', 'do', 'did'] },
    bePresent: {
      who: 'I',
      aux: 'am',
      adjective: ['happy', 'happily', 'happys', 'happyly'],
      instruction: 'Present. Use am.',
      teacherPrompt: 'What does she say?',
    },
    bePast: {
      aux: "wasn't",
      adjective: ['sad', 'sadly', 'sads', 'saddly'],
      instruction: "Answer no. Use wasn't.",
      teacherPrompt: 'Was she sad?',
    },
    possession: choice('fun', 'funs', 'an fun', 'funning'),
    regular: {
      verb: ['danced', 'dance', 'dances', 'dancing'],
      object: choice('fun', 'funs', 'an fun', 'funning'),
    },
    irregular: {
      verb: ['felt', 'feel', 'feels', 'feeling'],
      object: choice('happy', 'happily', 'happys', 'happyly'),
    },
  },
  {
    id: 'eli-door',
    alt: 'A boy standing in an open yellow door',
    who: 'He',
    object: choice('the door', 'an door', 'door', 'a doors'),
    simple: ['opens', 'open', 'opening', 'opened'],
    continuous: ['opening', 'opens', 'open', 'opened'],
    wh: { word: 'What', verb: ['opening', 'opens', 'open', 'opened'] },
    bePresent: {
      aux: "isn't",
      adjective: ['scared', 'scaredly', 'scare', 'scares'],
      instruction: "Answer no. Use isn't.",
      teacherPrompt: 'Is he scared?',
    },
    bePast: {
      aux: "wasn't",
      adjective: ['scared', 'scaredly', 'scare', 'scares'],
      instruction: "Answer no. Use wasn't.",
      teacherPrompt: 'Was he scared?',
    },
    possession: choice('a door', 'an door', 'door', 'a doors'),
    regular: {
      verb: ['opened', 'open', 'opens', 'opening'],
      object: choice('the door', 'an door', 'door', 'a doors'),
    },
    irregular: {
      verb: ['stood', 'stand', 'stands', 'standing'],
      object: choice('in the door', 'in an door', 'in door', 'in a doors'),
    },
  },
]

function scene(id: string, alt: string): Scene {
  return {
    id,
    image: `/images/sentence-builder/${id}.jpg`,
    alt,
  }
}

export const SCENES: Scene[] = LINES.map((line) => scene(line.id, line.alt))

function sentence(
  line: SceneLine,
  focus: GrammarFocus,
  instruction: string,
  slots: WordSlot[],
  punctuation: '.' | '?' = '.',
  teacherPrompt?: string
): SentencePrompt {
  return {
    id: `${line.id}-${focus}`,
    sceneId: line.id,
    focus,
    label: GRAMMAR_LABELS[focus],
    instruction,
    teacherPrompt,
    punctuation,
    slots,
    answer: `${slots.map((item) => item.correct).join(' ')}${punctuation}`,
  }
}

function bePrompt(line: SceneLine, focus: 'be-present' | 'be-past', spec: BeLine): SentencePrompt {
  const who = spec.who ?? line.who
  return sentence(
    line,
    focus,
    spec.instruction,
    [subjectSlot(who), beSlot(spec.aux), verbSlot(spec.adjective)],
    '.',
    spec.teacherPrompt
  )
}

function actionPrompt(
  line: SceneLine,
  focus: GrammarFocus,
  instruction: string,
  verb: readonly [string, string, string, string],
  object: WordSlot,
  includeObject: boolean
): SentencePrompt {
  const slots = [subjectSlot(line.who), verbSlot(verb)]
  if (includeObject) slots.push(object)
  return sentence(line, focus, instruction, slots)
}

export const PROMPTS: SentencePrompt[] = LINES.flatMap((line) => {
  const continuousAux = line.who === 'They' ? 'are' : 'is'
  const whAux = line.wh.word === 'What' && line.who === 'They' ? 'are' : line.wh.word === 'Who' ? 'is' : continuousAux
  const joSkipsObject = line.id === 'jo-dance'
  const continuousSlots = [subjectSlot(line.who), auxiliary(continuousAux), verbSlot(line.continuous)]
  if (!joSkipsObject) continuousSlots.push(line.object)
  return [
    actionPrompt(
      line,
      'present-simple',
      'Present simple.',
      line.simple,
      line.object,
      !joSkipsObject
    ),
    sentence(line, 'present-continuous', 'Present continuous. What is happening now?', continuousSlots),
    sentence(
      line,
      'wh-question',
      `Ask with ${line.wh.word}.`,
      [whWord(line.wh.word), auxiliary(whAux), questionSubject(line.who), verbSlot(line.wh.verb)],
      '?'
    ),
    bePrompt(line, 'be-present', line.bePresent),
    bePrompt(line, 'be-past', line.bePast),
    sentence(line, 'has-have', line.who === 'They' ? 'Use have.' : 'Use has.', [
      subjectSlot(line.who),
      haveSlot(line.who),
      line.possession,
    ]),
    actionPrompt(line, 'past-simple-regular', 'Past simple. Regular verb.', line.regular.verb, line.regular.object, line.id !== 'jo-dance'),
    actionPrompt(
      line,
      'past-simple-irregular',
      'Past simple. Irregular verb.',
      line.irregular.verb,
      line.irregular.object,
      true
    ),
  ]
})

const sceneMap = new Map(SCENES.map((item) => [item.id, item]))

export function getScene(sceneId: string): Scene {
  const found = sceneMap.get(sceneId)
  if (!found) {
    throw new Error(`Unknown sentence-builder scene: ${sceneId}`)
  }
  return found
}

export function promptsForFocus(focus: GrammarFocus): SentencePrompt[] {
  return PROMPTS.filter((item) => item.focus === focus)
}
