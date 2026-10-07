import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
  type Ticker,
} from 'pixi.js'
import { ensureFontIsLoaded } from '@/lib/pixi-engine/utils/ensureFontIsLoaded'
import { getPixiThemeConfig } from '@/lib/themes'
import { getScene, PROMPTS, SCENES, type Scene, type SentencePrompt } from './content'
import {
  applyTimePenalty,
  buildScoreRun,
  buildSurvivalQueue,
  pointsForSentence,
  QUESTION_TIME_MS,
  reshuffleSurvival,
  type PlayMode,
  type SentenceBuilderResult,
} from './round'

const theme = getPixiThemeConfig('default')

const INK = hexColor(theme.textColor)
const INK_SOFT = hexColor(theme.textLight)
const ACCENT = hexColor(theme.primaryAccent)
const PANEL = hexColor(theme.panelBg)
const WHITE = hexColor(theme.buttonFillColor)
const PAGE = hexColor(theme.secondaryBg)
const GOOD = 0x15803d
const GOOD_BG = 0xdcfce7
const BAD = 0xdc2626
const BAD_BG = 0xfee2e2
const OFF_BG = 0xe5e7eb

type ButtonState = 'idle' | 'good' | 'bad' | 'off'
type Phase = 'loading' | 'choose' | 'locked' | 'ended'

export interface SentenceBuilderHooks {
  onComplete: (result: SentenceBuilderResult) => void
  onStatus?: (text: string) => void
}

interface LaunchOptions {
  mode: PlayMode
  sounds: boolean
  random?: () => number
}

class ChoiceButton {
  readonly view = new Container()
  private readonly bg = new Graphics()
  private readonly shadow = new Graphics()
  private readonly key = new Text({
    text: '1',
    style: {
      fontFamily: 'Grandstander',
      fontSize: 16,
      fontWeight: '700',
      fill: INK,
    },
  })
  private readonly label = new Text({
    text: '',
    style: {
      fontFamily: 'Grandstander',
      fontSize: 28,
      fontWeight: '700',
      fill: INK,
      align: 'center',
    },
  })

  word = ''
  width = 160
  height = 84

  constructor() {
    this.key.anchor.set(0.5)
    this.label.anchor.set(0.5)
    this.view.addChild(this.shadow, this.bg, this.key, this.label)
    this.view.eventMode = 'static'
    this.view.cursor = 'pointer'
  }

  draw(word: string, index: number, state: ButtonState, width: number, height: number) {
    this.word = word
    this.width = width
    this.height = height
    this.view.hitArea = new Rectangle(0, 0, width, height)
    this.view.eventMode = state === 'off' ? 'none' : 'static'
    this.view.cursor = state === 'off' ? 'default' : 'pointer'

    const fill = state === 'good' ? GOOD_BG : state === 'bad' ? BAD_BG : state === 'off' ? OFF_BG : WHITE
    const border = state === 'good' ? GOOD : state === 'bad' ? BAD : INK
    const text = state === 'off' ? INK_SOFT : state === 'good' ? GOOD : state === 'bad' ? BAD : INK

    this.shadow.clear()
    this.shadow.roundRect(5, 5, width, height, 18).fill({ color: INK, alpha: state === 'off' ? 0.15 : 0.9 })

    this.bg.clear()
    this.bg.roundRect(0, 0, width, height, 18).fill({ color: fill }).stroke({ width: 3, color: border, alignment: 1 })

    this.key.text = String(index + 1)
    this.key.style.fill = text
    this.key.position.set(28, height / 2)

    this.label.style.fill = text
    this.label.text = word
    let fontSize = word.length > 12 ? 22 : 30
    this.label.style.fontSize = fontSize
    while (this.label.width > width - 64 && fontSize > 16) {
      fontSize -= 2
      this.label.style.fontSize = fontSize
    }
    this.label.position.set((width + 36) / 2, height / 2)
  }
}

function hexColor(value: string): number {
  return Number.parseInt(value.replace('#', ''), 16)
}

export class SentenceBuilderGame {
  sounds: boolean
  private readonly app: Application
  private readonly mode: PlayMode
  private readonly random: () => number
  private readonly hooks: SentenceBuilderHooks
  private readonly root = new Container()
  private readonly background = new Graphics()
  private readonly scoreText = new Text({
    text: '0',
    style: { fontFamily: 'Grandstander', fontSize: 28, fontWeight: '800', fill: INK },
  })
  private readonly progressText = new Text({
    text: '',
    style: { fontFamily: 'Grandstander', fontSize: 22, fontWeight: '700', fill: INK_SOFT },
  })
  private readonly timerTrack = new Graphics()
  private readonly timerFill = new Graphics()
  private readonly pictureFrame = new Container()
  private readonly pictureFill = new Graphics()
  private readonly pictureMask = new Graphics()
  private readonly pictureSprite = new Sprite(Texture.EMPTY)
  private readonly textures = new Map<string, Texture>()
  private readonly pictureBorder = new Graphics()
  private readonly pictureFallback = new Text({
    text: '',
    style: {
      fontFamily: 'Grandstander',
      fontSize: 22,
      fontWeight: '700',
      fill: INK,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 240,
    },
  })
  private readonly labelText = new Text({
    text: '',
    style: { fontFamily: 'Grandstander', fontSize: 16, fontWeight: '800', fill: ACCENT },
  })
  private readonly instructionText = new Text({
    text: '',
    style: {
      fontFamily: 'Grandstander',
      fontSize: 28,
      fontWeight: '800',
      fill: INK,
      wordWrap: true,
      wordWrapWidth: 480,
    },
  })
  private readonly teacherText = new Text({
    text: '',
    style: {
      fontFamily: 'Grandstander',
      fontSize: 22,
      fontWeight: '700',
      fill: INK_SOFT,
      wordWrap: true,
      wordWrapWidth: 480,
    },
  })
  private readonly sentenceRow = new Container()
  private readonly feedbackText = new Text({
    text: '',
    style: { fontFamily: 'Grandstander', fontSize: 22, fontWeight: '800', fill: GOOD },
  })
  private readonly loadingText = new Text({
    text: 'Loading pictures...',
    style: { fontFamily: 'Grandstander', fontSize: 32, fontWeight: '800', fill: INK },
  })
  private readonly buttons = [0, 1, 2, 3].map(() => new ChoiceButton())

  private destroyed = false
  private phase: Phase = 'loading'
  private queue: SentencePrompt[] = []
  private queueIndex = 0
  private slotIndex = 0
  private built: string[] = []
  private optionOrder: number[] = [0, 1, 2, 3]
  private eliminated = new Set<number>()
  private remainingMs = QUESTION_TIME_MS
  private questionElapsedMs = 0
  private score = 0
  private sentencesBuilt = 0
  private questionsSeen = 0
  private totalAnswerMs = 0
  private fastestMs: number | null = null
  private scheduleToken = 0
  private timerId: number | null = null
  private ended = false
  private loadedUrls: string[] = []
  private failedUrls = new Set<string>()
  private buttonStates: ButtonState[] = ['idle', 'idle', 'idle', 'idle']

  constructor(app: Application, options: LaunchOptions, hooks: SentenceBuilderHooks) {
    this.app = app
    this.mode = options.mode
    this.sounds = options.sounds
    this.random = options.random ?? Math.random
    this.hooks = hooks
  }

  async init(): Promise<void> {
    await ensureFontIsLoaded('Grandstander', '32px')
    if (this.destroyed) return

    this.pictureFallback.anchor.set(0.5)
    this.pictureSprite.mask = this.pictureMask
    this.pictureFrame.addChild(
      this.pictureFill,
      this.pictureMask,
      this.pictureSprite,
      this.pictureFallback,
      this.pictureBorder
    )
    this.loadingText.anchor.set(0.5)

    this.root.addChild(
      this.background,
      this.scoreText,
      this.progressText,
      this.timerTrack,
      this.timerFill,
      this.pictureFrame,
      this.labelText,
      this.instructionText,
      this.teacherText,
      this.sentenceRow,
      this.feedbackText,
      this.loadingText
    )
    for (const button of this.buttons) {
      button.view.on('pointertap', () => {
        const index = this.buttons.indexOf(button)
        this.chooseVisualIndex(index)
      })
      this.root.addChild(button.view)
      button.view.visible = false
    }
    this.app.stage.addChild(this.root)
    this.app.ticker.add(this.onTick)
    window.addEventListener('keydown', this.onKey)
    this.app.renderer.on('resize', this.onResize)
    this.layout()

    const urls = SCENES.map((item) => item.image)
    await Promise.all(
      urls.map(async (url) => {
        try {
          const loaded: unknown = await Assets.load(url)
          const texture = loaded instanceof Texture ? loaded : null
          if (!texture) {
            throw new Error(`Asset was not a texture: ${url}`)
          }
          this.textures.set(url, texture)
          this.loadedUrls.push(url)
        } catch (error) {
          console.error('[SentenceBuilder] Failed to load scene', url, error)
          this.failedUrls.add(url)
        }
      })
    )
    if (this.destroyed) return

    this.queue =
      this.mode === 'score-run' ? buildScoreRun(PROMPTS, this.random) : buildSurvivalQueue(PROMPTS, this.random)
    this.loadingText.visible = false
    this.beginQuestion()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.clearSchedule()
    this.app.ticker.remove(this.onTick)
    this.app.renderer.off('resize', this.onResize)
    window.removeEventListener('keydown', this.onKey)
    this.root.destroy({ children: true })
    for (const url of this.loadedUrls) {
      void Assets.unload(url).catch(() => undefined)
    }
  }

  private onResize = () => {
    if (!this.destroyed) this.layout()
  }

  private onTick = (ticker: Ticker) => {
    if (this.phase !== 'choose') return
    const delta = ticker.deltaMS
    this.remainingMs -= delta
    this.questionElapsedMs += delta
    if (this.remainingMs <= 0) {
      this.remainingMs = 0
      this.handleTimeout()
      return
    }
    this.drawTimer()
  }

  private onKey = (event: KeyboardEvent) => {
    if (this.phase !== 'choose') return
    if (event.repeat) return
    const match = /^Digit([1-4])$/.exec(event.code) ?? /^Numpad([1-4])$/.exec(event.code)
    if (!match) return
    event.preventDefault()
    this.chooseVisualIndex(Number(match[1]) - 1)
  }

  private beginQuestion(): void {
    const current = this.currentPrompt()
    if (!current) {
      this.complete('finished')
      return
    }
    this.slotIndex = 0
    this.built = []
    this.remainingMs = QUESTION_TIME_MS
    this.questionElapsedMs = 0
    this.eliminated.clear()
    this.questionsSeen += 1
    this.phase = 'choose'
    this.dealOptions()
    this.renderPrompt(current)
    this.drawTimer()
    this.announce(current)
  }

  private currentPrompt(): SentencePrompt | null {
    if (this.queueIndex >= this.queue.length) {
      if (this.mode === 'score-run') return null
      const previousId = this.queue[this.queue.length - 1]?.id
      this.queue = reshuffleSurvival(PROMPTS, previousId, this.random)
      this.queueIndex = 0
    }
    return this.queue[this.queueIndex] ?? null
  }

  private dealOptions(): void {
    this.optionOrder = [0, 1, 2, 3]
      .map((index) => ({ index, roll: this.random() }))
      .sort((a, b) => a.roll - b.roll)
      .map((item) => item.index)
    this.eliminated.clear()
  }

  private chooseVisualIndex(index: number): void {
    if (this.phase !== 'choose') return
    if (this.eliminated.has(index)) return
    const prompt = this.queue[this.queueIndex]
    const slot = prompt?.slots[this.slotIndex]
    if (!prompt || !slot) return
    const optionIndex = this.optionOrder[index]
    const word = optionIndex === undefined ? undefined : slot.options[optionIndex]
    if (!word) return

    if (word === slot.correct) {
      this.playSound('correct')
      this.built.push(word)
      this.phase = 'locked'
      this.feedbackText.text = ''
      this.renderSentence(prompt, this.slotIndex >= prompt.slots.length - 1)
      this.renderChoices(prompt, index, 'good')
      if (this.slotIndex >= prompt.slots.length - 1) {
        this.finishSentence()
      } else {
        this.schedule(280, () => {
          this.slotIndex += 1
          this.dealOptions()
          this.phase = 'choose'
          this.renderSentence(prompt, false)
          this.renderChoices(prompt)
          this.announce(prompt)
        })
      }
      return
    }

    this.playSound('incorrect')
    this.renderChoices(prompt, index, 'bad')
    if (this.mode === 'survival') {
      this.phase = 'locked'
      this.feedbackText.style.fill = BAD
      this.feedbackText.text = `The sentence is: ${prompt.answer}`
      this.schedule(1300, () => {
        this.complete('wrong', prompt.answer, word)
      })
      return
    }

    this.eliminated.add(index)
    this.remainingMs = applyTimePenalty(this.remainingMs)
    this.feedbackText.style.fill = BAD
    this.feedbackText.text = 'Not this word'
    this.drawTimer()
    if (this.remainingMs <= 0) {
      this.handleTimeout()
      return
    }
    this.phase = 'locked'
    this.schedule(420, () => {
      this.phase = 'choose'
      this.feedbackText.text = ''
      this.renderChoices(prompt)
    })
  }

  private finishSentence(): void {
    const gained = pointsForSentence(this.remainingMs)
    this.score += gained
    this.sentencesBuilt += 1
    this.totalAnswerMs += this.questionElapsedMs
    this.fastestMs =
      this.fastestMs === null ? this.questionElapsedMs : Math.min(this.fastestMs, this.questionElapsedMs)
    this.feedbackText.style.fill = GOOD
    this.feedbackText.text = `+${gained}`
    this.scoreText.text = String(this.score)
    this.queueIndex += 1
    const finishedRun = this.mode === 'score-run' && this.queueIndex >= this.queue.length
    this.schedule(850, () => {
      if (finishedRun) {
        this.complete('finished')
        return
      }
      this.beginQuestion()
    })
  }

  private handleTimeout(): void {
    if (this.phase === 'ended') return
    const prompt = this.queue[this.queueIndex]
    if (!prompt) return
    this.phase = 'locked'
    this.remainingMs = 0
    this.drawTimer()
    this.playSound('incorrect')
    this.feedbackText.style.fill = BAD
    this.feedbackText.text = `Time's up. ${prompt.answer}`
    this.renderSentence(prompt, true, true)
    const correctIndex = prompt.slots[this.slotIndex]
    if (correctIndex) {
      const visual = this.optionOrder.findIndex(
        (optionIndex) => prompt.slots[this.slotIndex]?.options[optionIndex] === correctIndex.correct
      )
      if (visual >= 0) this.renderChoices(prompt, visual, 'good')
    }
    if (this.mode === 'survival') {
      this.schedule(1400, () => this.complete('timeout', prompt.answer))
      return
    }
    this.queueIndex += 1
    this.schedule(1200, () => this.beginQuestion())
  }

  private complete(
    endedBy: SentenceBuilderResult['endedBy'],
    missedAnswer?: string,
    missedChoice?: string
  ): void {
    if (this.ended) return
    this.ended = true
    this.phase = 'ended'
    this.hooks.onComplete({
      mode: this.mode,
      score: this.score,
      sentencesBuilt: this.sentencesBuilt,
      questionsSeen: this.questionsSeen,
      totalAnswerMs: this.totalAnswerMs,
      fastestMs: this.fastestMs,
      endedBy,
      missedAnswer,
      missedChoice,
    })
  }

  private renderPrompt(prompt: SentencePrompt): void {
    const scene = getScene(prompt.sceneId)
    this.showPicture(scene)
    this.labelText.text = prompt.label.toUpperCase()
    this.instructionText.text = prompt.instruction
    this.teacherText.text = prompt.teacherPrompt ? `“${prompt.teacherPrompt}”` : ''
    this.feedbackText.text = ''
    this.scoreText.text = String(this.score)
    this.progressText.text =
      this.mode === 'score-run'
        ? `${Math.min(this.questionsSeen, this.queue.length)} / ${this.queue.length}`
        : `Sentence ${this.questionsSeen}`
    this.renderSentence(prompt, false)
    this.renderChoices(prompt)
    this.layout()
  }

  private showPicture(scene: Scene): void {
    const texture = this.textures.get(scene.image)
    if (this.failedUrls.has(scene.image) || !texture) {
      this.pictureSprite.visible = false
      this.pictureFallback.visible = true
      this.pictureFallback.text = scene.alt
      return
    }
    this.pictureSprite.texture = texture
    this.pictureSprite.visible = true
    this.pictureFallback.visible = false
    this.fitPicture(this.pictureFrame.width || this.pictureMask.width || 280)
  }

  private fitPicture(size: number): void {
    const texture = this.pictureSprite.texture
    if (!texture || texture.width < 2 || texture.height < 2 || size < 2) return
    const cover = Math.max(size / texture.width, size / texture.height)
    this.pictureSprite.scale.set(cover)
    this.pictureSprite.position.set((size - texture.width * cover) / 2, (size - texture.height * cover) / 2)
  }

  private renderSentence(prompt: SentencePrompt, completed: boolean, reveal = false): void {
    for (const child of this.sentenceRow.removeChildren()) {
      child.destroy({ children: true })
    }
    const words = reveal ? prompt.slots.map((item) => item.correct) : [...this.built]
    if (!completed && !reveal) words.push('___')
    let x = 0
    words.forEach((word, index) => {
      const chip = new Text({
        text: word,
        style: {
          fontFamily: 'Grandstander',
          fontSize: 32,
          fontWeight: '800',
          fill: word === '___' ? INK_SOFT : INK,
        },
      })
      const padX = 14
      const width = Math.max(word === '___' ? 120 : 64, chip.width + padX * 2)
      const height = 56
      const bg = new Graphics()
      bg.roundRect(0, 0, width, height, 14).fill({ color: word === '___' ? PANEL : WHITE }).stroke({
        width: 3,
        color: word === '___' ? INK_SOFT : INK,
      })
      const holder = new Container()
      chip.anchor.set(0.5)
      chip.position.set(width / 2, height / 2)
      holder.addChild(bg, chip)
      holder.position.set(x, 0)
      this.sentenceRow.addChild(holder)
      x += width + 8
      if (index === words.length - 1 && (completed || reveal)) {
        const mark = new Text({
          text: prompt.punctuation,
          style: { fontFamily: 'Grandstander', fontSize: 28, fontWeight: '800', fill: INK },
        })
        mark.position.set(x, 8)
        this.sentenceRow.addChild(mark)
      }
    })
  }

  private renderChoices(prompt: SentencePrompt, markedIndex = -1, marked: ButtonState = 'idle'): void {
    const slot = prompt.slots[this.slotIndex]
    this.buttonStates = this.buttons.map((_, index) => {
      if (!slot) return 'off'
      if (index === markedIndex) return marked
      if (this.eliminated.has(index)) return 'off'
      return 'idle'
    })
    this.layout()
  }

  private announce(prompt: SentencePrompt): void {
    const slot = prompt.slots[this.slotIndex]
    const options = this.optionOrder.map((index) => slot?.options[index]).filter(Boolean)
    this.hooks.onStatus?.(`${prompt.instruction} Choices: ${options.join(', ')}`)
  }

  private drawTimer(): void {
    const width = this.app.screen.width
    const ratio = Math.max(0, Math.min(1, this.remainingMs / QUESTION_TIME_MS))
    const barWidth = Math.max(0, width - 32)
    const y = 52
    this.timerTrack.clear()
    this.timerTrack.roundRect(16, y, barWidth, 12, 6).fill({ color: WHITE })
    this.timerFill.clear()
    const fillColor = ratio < 0.25 ? BAD : ACCENT
    this.timerFill.roundRect(16, y, Math.max(12, barWidth * ratio), 12, 6).fill({ color: fillColor })
  }

  private layout(): void {
    const width = this.app.screen.width
    const height = this.app.screen.height
    if (width < 10 || height < 10) return

    this.background.clear()
    this.background.rect(0, 0, width, height).fill({ color: PAGE })

    const pad = Math.max(16, Math.round(Math.min(width, height) * 0.025))
    const wide = width >= 860
    this.scoreText.position.set(pad, 12)
    this.progressText.anchor.set(1, 0)
    this.progressText.position.set(width - pad, 16)
    this.drawTimer()

    const top = 76
    const choiceHeight = wide ? 92 : 78
    const choiceRows = wide ? 1 : 2
    const choiceGap = 12
    const choiceBlock = choiceRows * choiceHeight + (choiceRows - 1) * choiceGap
    const choiceTop = height - pad - choiceBlock

    let pictureSize = wide
      ? Math.min(height - top - pad * 2, width * 0.34, choiceTop - top - pad)
      : Math.min(width - pad * 2, (choiceTop - top) * 0.42)
    pictureSize = Math.max(140, pictureSize)
    const pictureX = wide ? pad : (width - pictureSize) / 2
    const pictureY = wide ? top + Math.max(0, (choiceTop - top - pictureSize) / 2) : top

    this.pictureFrame.position.set(pictureX, pictureY)
    this.pictureFill.clear()
    this.pictureFill.roundRect(0, 0, pictureSize, pictureSize, 24).fill({ color: WHITE })
    this.pictureMask.clear()
    this.pictureMask.roundRect(0, 0, pictureSize, pictureSize, 24).fill({ color: WHITE })
    this.fitPicture(pictureSize)
    this.pictureBorder.clear()
    this.pictureBorder
      .roundRect(0, 0, pictureSize, pictureSize, 24)
      .stroke({ width: 4, color: INK, alignment: 1 })
    this.pictureFallback.position.set(pictureSize / 2, pictureSize / 2)
    this.pictureFallback.style.wordWrapWidth = pictureSize - 32

    const textX = wide ? pictureX + pictureSize + pad : pad
    const textW = wide ? width - textX - pad : width - pad * 2
    this.instructionText.style.wordWrapWidth = textW
    this.teacherText.style.wordWrapWidth = textW
    const teacherGap = this.teacherText.text ? this.teacherText.height + 12 : 8
    const blockHeight = 26 + this.instructionText.height + 6 + teacherGap + 70
    const textY = wide
      ? pictureY + Math.max(0, (pictureSize - blockHeight) / 2)
      : pictureY + pictureSize + 12

    this.labelText.position.set(textX, textY)
    this.instructionText.position.set(textX, textY + 26)
    this.teacherText.position.set(textX, textY + 26 + this.instructionText.height + 6)
    const sentenceY = this.teacherText.position.y + teacherGap
    this.sentenceRow.scale.set(1)
    const rowWidth = this.sentenceRow.getLocalBounds().width
    const sentenceScale = rowWidth > textW && rowWidth > 0 ? textW / rowWidth : 1
    this.sentenceRow.scale.set(sentenceScale)
    this.sentenceRow.position.set(textX, sentenceY)
    this.feedbackText.position.set(textX, sentenceY + 58 * sentenceScale)

    const cols = wide ? 4 : 2
    const buttonWidth = (width - pad * 2 - choiceGap * (cols - 1)) / cols
    this.buttons.forEach((button, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const prompt = this.queue[this.queueIndex]
      const slot = prompt?.slots[this.slotIndex]
      const optionIndex = this.optionOrder[index] ?? 0
      const word = slot?.options[optionIndex] ?? ''
      button.draw(word, index, this.buttonStates[index] ?? 'idle', buttonWidth, choiceHeight)
      button.view.position.set(pad + col * (buttonWidth + choiceGap), choiceTop + row * (choiceHeight + choiceGap))
      button.view.visible = this.phase !== 'loading'
    })

    this.loadingText.position.set(width / 2, height / 2)
    this.loadingText.visible = this.phase === 'loading'
  }

  private schedule(ms: number, fn: () => void): void {
    this.clearSchedule()
    const token = ++this.scheduleToken
    this.timerId = window.setTimeout(() => {
      if (this.destroyed || token !== this.scheduleToken) return
      fn()
    }, ms)
  }

  private clearSchedule(): void {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  private playSound(kind: 'correct' | 'incorrect'): void {
    if (!this.sounds || typeof Audio === 'undefined') return
    const url =
      kind === 'correct' ? '/audio/default/correct-sound.mp3' : '/audio/default/incorrect-sound.mp3'
    const audio = new Audio(url)
    audio.volume = 0.4
    void audio.play().catch(() => undefined)
  }
}
