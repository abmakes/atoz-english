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
import {
  getScene,
  GRAMMAR_LABELS,
  promptsForFocus,
  SCENES,
  type GrammarFocus,
  type Scene,
  type SentencePrompt,
} from './content'
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
const WHITE = hexColor(theme.buttonFillColor)
const GOOD = 0x15803d
const GOOD_BG = 0xdcfce7
const BAD = 0xdc2626
const BAD_BG = 0xfee2e2
const OFF_BG = 0xe5e7eb
const SLOT_FILL = WHITE
const SLOT_LINE = hexColor(theme.primaryAccentHover)
const SLOT_DASH = 0x7ec8ea
const SENTENCE_FRAME = 0xd4ebff
const TILE_H = 68

type ButtonState = 'idle' | 'good' | 'bad' | 'off'
type Phase = 'loading' | 'choose' | 'locked' | 'ended'

export interface SentenceBuilderHooks {
  onComplete: (result: SentenceBuilderResult) => void
  onStatus?: (text: string) => void
  onNotice?: (message: string, tone: 'good' | 'bad') => void
}

interface LaunchOptions {
  mode: PlayMode
  focus: GrammarFocus
  sounds: boolean
  random?: () => number
}

class ChoiceButton {
  readonly view = new Container()
  private readonly bg = new Graphics()
  private readonly shadow = new Graphics()
  private readonly mark = new Graphics()
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
  homeX = 0

  constructor() {
    this.label.anchor.set(0.5)
    this.view.addChild(this.shadow, this.bg, this.label, this.mark)
    this.view.eventMode = 'static'
    this.view.cursor = 'pointer'
  }

  draw(word: string, _index: number, state: ButtonState, width: number, height: number) {
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

    this.mark.clear()
    if (state === 'good') {
      this.mark
        .moveTo(width - 40, height / 2)
        .lineTo(width - 30, height / 2 + 10)
        .lineTo(width - 16, height / 2 - 10)
        .stroke({ width: 5, color: GOOD, cap: 'round', join: 'round' })
    } else if (state === 'bad' || state === 'off') {
      const cross = state === 'bad' ? BAD : INK_SOFT
      this.mark
        .moveTo(width - 36, height / 2 - 9)
        .lineTo(width - 18, height / 2 + 9)
        .moveTo(width - 18, height / 2 - 9)
        .lineTo(width - 36, height / 2 + 9)
        .stroke({ width: 5, color: cross, cap: 'round' })
    }

    this.label.style.fill = text
    this.label.text = word
    let fontSize = word.length > 12 ? 22 : 30
    this.label.style.fontSize = fontSize
    while (this.label.width > width - 48 && fontSize > 16) {
      fontSize -= 2
      this.label.style.fontSize = fontSize
    }
    this.label.position.set(width / 2, height / 2)
  }
}

function hexColor(value: string): number {
  return Number.parseInt(value.replace('#', ''), 16)
}

export class SentenceBuilderGame {
  sounds: boolean
  private readonly app: Application
  private readonly mode: PlayMode
  private readonly focus: GrammarFocus
  private readonly random: () => number
  private readonly hooks: SentenceBuilderHooks
  private readonly root = new Container()
  private readonly skyTexture = createSkyTexture()
  private readonly sky = new Sprite(this.skyTexture)
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
  private readonly timerLabel = new Text({
    text: '20',
    style: { fontFamily: 'Grandstander', fontSize: 16, fontWeight: '800', fill: INK },
  })
  private readonly scoreStar = new Graphics()
  private readonly structureChip = new Graphics()
  private timerBox = { x: 0, y: 0, h: 0 }
  private shakeIndex = -1
  private shakeStart = 0
  private shouldPop = false
  private popHolder: Container | null = null
  private popStart = 0
  private paused = false
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
      fontSize: 18,
      fontWeight: '800',
      fill: INK,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 480,
    },
  })
  private readonly teacherText = new Text({
    text: '',
    style: {
      fontFamily: 'Grandstander',
      fontSize: 30,
      fontWeight: '700',
      fill: INK_SOFT,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 480,
    },
  })
  private readonly sentenceFrame = new Graphics()
  private readonly sentenceRow = new Container()
  private readonly loadingText = new Text({
    text: 'Loading pictures...',
    style: { fontFamily: 'Grandstander', fontSize: 32, fontWeight: '800', fill: INK },
  })
  private readonly buttons = [0, 1, 2, 3].map(() => new ChoiceButton())

  private destroyed = false
  private phase: Phase = 'loading'
  private bank: SentencePrompt[] = []
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
    this.focus = options.focus
    this.sounds = options.sounds
    this.random = options.random ?? Math.random
    this.hooks = hooks
  }

  async init(): Promise<void> {
    await ensureFontIsLoaded('Grandstander', '32px')
    if (this.destroyed) return

    this.sky.eventMode = 'none'
    this.pictureFallback.anchor.set(0.5)
    this.labelText.visible = false
    this.instructionText.anchor.set(0.5, 0)
    this.teacherText.anchor.set(0.5, 0)
    this.sentenceFrame.eventMode = 'none'
    this.structureChip.eventMode = 'none'
    this.timerLabel.anchor.set(0.5, 0)
    drawStar(this.scoreStar)
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
      this.sky,
      this.scoreStar,
      this.scoreText,
      this.progressText,
      this.timerTrack,
      this.timerFill,
      this.timerLabel,
      this.pictureFrame,
      this.labelText,
      this.structureChip,
      this.instructionText,
      this.teacherText,
      this.sentenceFrame,
      this.sentenceRow,
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

    this.bank = promptsForFocus(this.focus)
    this.queue =
      this.mode === 'score-run' ? buildScoreRun(this.bank, this.random) : buildSurvivalQueue(this.bank, this.random)
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
    this.skyTexture.destroy(true)
    for (const url of this.loadedUrls) {
      void Assets.unload(url).catch(() => undefined)
    }
  }

  private onResize = () => {
    if (!this.destroyed) this.layout()
  }

  setPaused(paused: boolean): void {
    this.paused = paused
  }

  private onTick = (ticker: Ticker) => {
    this.animatePop()
    this.animateShake()
    if (this.paused || this.phase !== 'choose') return
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

  private animatePop(): void {
    if (!this.popHolder) return
    const t = Math.min(1, (performance.now() - this.popStart) / 180)
    const scale = 0.72 + 0.28 * (1 - (1 - t) ** 3)
    this.popHolder.scale.set(scale)
    if (t >= 1) this.popHolder = null
  }

  private animateShake(): void {
    if (this.shakeIndex < 0) return
    const button = this.buttons[this.shakeIndex]
    const elapsed = performance.now() - this.shakeStart
    if (!button || elapsed > 320) {
      if (button) button.view.x = button.homeX
      this.shakeIndex = -1
      return
    }
    const damp = 1 - elapsed / 320
    button.view.x = button.homeX + Math.sin(elapsed / 28) * 7 * damp
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
      this.queue = reshuffleSurvival(this.bank, previousId, this.random)
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
    if (this.paused || this.phase !== 'choose') return
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
      this.shouldPop = true
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
    this.shakeIndex = index
    this.shakeStart = performance.now()
    if (this.mode === 'survival') {
      this.phase = 'locked'
      this.hooks.onNotice?.(`The sentence is: ${prompt.answer}`, 'bad')
      this.schedule(1300, () => {
        this.complete('wrong', prompt.answer, word)
      })
      return
    }

    this.eliminated.add(index)
    this.remainingMs = applyTimePenalty(this.remainingMs)
    this.hooks.onNotice?.('Not this word', 'bad')
    this.drawTimer()
    if (this.remainingMs <= 0) {
      this.handleTimeout()
      return
    }
    this.phase = 'locked'
    this.schedule(420, () => {
      this.phase = 'choose'
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
    this.scoreText.text = String(this.score)
    this.hooks.onNotice?.(`+${gained}`, 'good')
    this.layout()
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
    this.hooks.onNotice?.(`Time's up. ${prompt.answer}`, 'bad')
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
      focus: this.focus,
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
    this.instructionText.text = GRAMMAR_LABELS[this.focus]
    this.teacherText.text = prompt.teacherPrompt ? `“${prompt.teacherPrompt}”` : ''
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
    this.popHolder = null
    for (const child of this.sentenceRow.removeChildren()) {
      child.destroy({ children: true })
    }
    const height = TILE_H
    let x = 0
    prompt.slots.forEach((slot, index) => {
      const filled = reveal || completed || index < this.built.length
      const current = !filled && index === this.built.length
      const word = filled ? (index < this.built.length && !reveal ? this.built[index]! : slot.correct) : slot.correct
      const measure = new Text({
        text: word,
        style: { fontFamily: 'Grandstander', fontSize: 36, fontWeight: '800', fill: INK },
      })
      const slotWidth = Math.max(80, measure.width + 32)
      const bg = new Graphics()
      if (filled) {
        bg.roundRect(0, 0, slotWidth, height, 14).fill({ color: SLOT_FILL }).stroke({ width: 2, color: SLOT_LINE })
      } else {
        bg.roundRect(0, 0, slotWidth, height, 14).fill({ color: WHITE, alpha: current ? 0.72 : 0.35 })
        dashedRect(bg, slotWidth, height, current ? SLOT_LINE : SLOT_DASH)
      }
      const holder = new Container()
      holder.addChild(bg)
      if (filled) {
        measure.anchor.set(0.5)
        measure.position.set(slotWidth / 2, height / 2)
        holder.addChild(measure)
      } else {
        measure.destroy()
      }
      const pop = this.shouldPop && filled && index === this.built.length - 1
      if (pop) {
        holder.pivot.set(slotWidth / 2, height / 2)
        holder.position.set(x + slotWidth / 2, height / 2)
        holder.scale.set(0.72)
        this.popHolder = holder
        this.popStart = performance.now()
      } else {
        holder.position.set(x, 0)
      }
      this.sentenceRow.addChild(holder)
      x += slotWidth + 8
    })
    this.shouldPop = false
    const mark = new Text({
      text: prompt.punctuation,
      style: { fontFamily: 'Grandstander', fontSize: 32, fontWeight: '800', fill: INK },
    })
    mark.position.set(x, 14)
    this.sentenceRow.addChild(mark)
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
    this.hooks.onStatus?.(`${GRAMMAR_LABELS[this.focus]} Choices: ${options.join(', ')}`)
  }

  private drawTimer(): void {
    const { x, y, h } = this.timerBox
    if (h < 8) return
    const ratio = Math.max(0, Math.min(1, this.remainingMs / QUESTION_TIME_MS))
    const barW = 20
    const radius = 10
    this.timerTrack.clear()
    this.timerTrack
      .roundRect(x, y, barW, h, radius)
      .fill({ color: WHITE, alpha: 0.92 })
      .stroke({ width: 2, color: INK, alpha: 0.2 })
    const inner = h - 8
    const fillH = Math.max(8, inner * ratio)
    this.timerFill.clear()
    this.timerFill
      .roundRect(x + 4, y + 4 + (inner - fillH), barW - 8, fillH, 7)
      .fill({ color: ratio < 0.25 ? BAD : ACCENT })
    this.timerLabel.text = String(Math.max(0, Math.ceil(this.remainingMs / 1000)))
    this.timerLabel.position.set(x + barW / 2, y + h + 4)
  }

  private layout(): void {
    const width = this.app.screen.width
    const height = this.app.screen.height
    if (width < 10 || height < 10) return

    this.sky.position.set(0, 0)
    this.sky.width = width
    this.sky.height = height

    const pad = Math.max(12, Math.round(Math.min(width, height) * 0.02))
    const column = Math.min(width - pad * 2, 760)
    const columnLeft = (width - column) / 2
    const textCenter = width / 2
    const choiceGap = 12
    let choiceHeight = Math.round((height < 760 ? 86 : 102) * 0.9)
    const choiceMin = Math.round(72 * 0.9)
    const barW = 20
    const labelSpace = 24

    this.teacherText.style.fontSize = width >= 720 ? 24 : 20
    this.teacherText.style.wordWrapWidth = column

    const scoreRight = 26 + this.scoreText.width
    const countWidth = this.progressText.width
    const headerGap = 10
    const chipRoom = Math.max(88, column - scoreRight - countWidth - headerGap * 2)
    this.instructionText.style.fontSize = 16
    this.instructionText.style.wordWrapWidth = Math.max(72, chipRoom - 28)
    const statusH = Math.max(36, this.instructionText.height + 14)
    const teacherBlock = this.teacherText.text ? this.teacherText.height + 8 : 0
    const sentenceBlock = TILE_H + 28
    const buttonBlock = () => choiceHeight * 2 + choiceGap
    const chrome = pad * 2 + statusH + 10 + 14 + teacherBlock + sentenceBlock + 10
    const pictureCap = column - barW - 28
    const roomForPicture = () => height - chrome - buttonBlock()
    let pictureSize = Math.min(pictureCap, roomForPicture())
    const pictureFloor = Math.min(pictureCap, Math.round(height * 0.46))
    while (pictureSize < pictureFloor && choiceHeight > choiceMin) {
      choiceHeight -= 2
      pictureSize = Math.min(pictureCap, roomForPicture())
    }
    pictureSize = Math.max(120, pictureSize)
    const spare = height - chrome - pictureSize - buttonBlock()
    const startY = pad + Math.max(0, spare / 2)

    const chipW = Math.min(chipRoom, this.instructionText.width + 28)
    const chipH = this.instructionText.height + 10
    const chipY = startY + Math.max(0, (statusH - chipH) / 2)
    const betweenLeft = columnLeft + scoreRight + headerGap
    const betweenRight = columnLeft + column - countWidth - headerGap
    const chipX = betweenLeft + Math.max(0, betweenRight - betweenLeft - chipW) / 2
    this.structureChip.clear()
    if (this.instructionText.text) {
      this.structureChip
        .roundRect(chipX, chipY, chipW, chipH, chipH / 2)
        .fill({ color: WHITE, alpha: 0.94 })
        .stroke({ width: 2, color: ACCENT })
    }
    this.instructionText.position.set(chipX + chipW / 2, chipY + 5)
    const rowMid = startY + statusH / 2
    this.scoreStar.position.set(columnLeft, rowMid - 11)
    this.scoreText.position.set(columnLeft + 26, rowMid - this.scoreText.height / 2)
    this.progressText.anchor.set(1, 0.5)
    this.progressText.position.set(columnLeft + column, rowMid)

    const pairW = barW + 14 + pictureSize
    const pairX = columnLeft + (column - pairW) / 2
    const pictureX = pairX + barW + 14
    const pictureY = startY + statusH + 10
    this.timerBox = { x: pairX, y: pictureY, h: Math.max(48, pictureSize - labelSpace) }
    this.drawTimer()

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

    let cursor = pictureY + pictureSize + 14
    this.teacherText.position.set(textCenter, cursor)
    if (this.teacherText.text) cursor += this.teacherText.height + 8

    const maxRow = column - 8
    this.sentenceRow.scale.set(1)
    const rowBounds = this.sentenceRow.getLocalBounds()
    const rowWidth = rowBounds.width
    const rowHeight = Math.max(1, rowBounds.height)
    const sentenceScale = rowWidth > maxRow && rowWidth > 0 ? maxRow / rowWidth : 1
    this.sentenceRow.scale.set(sentenceScale)
    const drawnW = rowWidth * sentenceScale
    const drawnH = rowHeight * sentenceScale
    const framePadX = 18
    const framePadY = 12
    const sentenceX = textCenter - drawnW / 2
    this.sentenceRow.position.set(
      sentenceX - rowBounds.x * sentenceScale,
      cursor + framePadY - rowBounds.y * sentenceScale,
    )
    this.sentenceFrame.clear()
    if (rowWidth > 2) {
      this.sentenceFrame
        .roundRect(sentenceX - framePadX, cursor, drawnW + framePadX * 2, drawnH + framePadY * 2, 22)
        .fill({ color: SENTENCE_FRAME })
        .stroke({ width: 4, color: ACCENT, alignment: 1 })
    }
    const frameBottom = cursor + (rowWidth > 2 ? drawnH + framePadY * 2 : 0)

    const choiceTop = frameBottom + 10
    const gridWidth = Math.min(column, Math.round(640 * 0.9))
    const buttonWidth = (gridWidth - choiceGap) / 2
    const gridLeft = textCenter - gridWidth / 2
    this.buttons.forEach((button, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const prompt = this.queue[this.queueIndex]
      const slot = prompt?.slots[this.slotIndex]
      const optionIndex = this.optionOrder[index] ?? 0
      const word = slot?.options[optionIndex] ?? ''
      button.draw(word, index, this.buttonStates[index] ?? 'idle', buttonWidth, choiceHeight)
      button.homeX = gridLeft + col * (buttonWidth + choiceGap)
      button.view.position.set(button.homeX, choiceTop + row * (choiceHeight + choiceGap))
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

function drawStar(g: Graphics) {
  const points: number[] = []
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const radius = i % 2 === 0 ? 10 : 4.4
    points.push(10 + Math.cos(angle) * radius, 11 + Math.sin(angle) * radius)
  }
  g.poly(points).fill({ color: 0xf5b942 })
}

function dashedRect(g: Graphics, width: number, height: number, color: number) {
  const dash = 7
  const gap = 5
  const inset = 3
  const edges: Array<[number, number, number, number]> = [
    [inset, inset, width - inset, inset],
    [width - inset, inset, width - inset, height - inset],
    [width - inset, height - inset, inset, height - inset],
    [inset, height - inset, inset, inset],
  ]
  for (const [ax, ay, bx, by] of edges) {
    const length = Math.hypot(bx - ax, by - ay)
    if (length < 1) continue
    const dx = (bx - ax) / length
    const dy = (by - ay) / length
    let traveled = 0
    while (traveled < length) {
      const end = Math.min(traveled + dash, length)
      g.moveTo(ax + dx * traveled, ay + dy * traveled)
      g.lineTo(ax + dx * end, ay + dy * end)
      traveled += dash + gap
    }
  }
  g.stroke({ width: 3, color, cap: 'round' })
}

function createSkyTexture(): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 768
  const ctx = canvas.getContext('2d')
  if (!ctx) return Texture.from(canvas)

  ctx.fillStyle = '#f7fbff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const washes: Array<[string, number, number, number]> = [
    ['rgba(186, 230, 253, 0.95)', -0.04, -0.08, 0.72],
    ['rgba(221, 204, 255, 0.9)', 1.08, -0.06, 0.62],
    ['rgba(191, 219, 254, 0.72)', 0.92, 1.08, 0.5],
    ['rgba(237, 224, 255, 0.78)', 0.04, 0.96, 0.42],
  ]
  for (const [color, x, y, radius] of washes) {
    const cx = x * canvas.width
    const cy = y * canvas.height
    const r = radius * canvas.width
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'rgba(247, 251, 255, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  return Texture.from(canvas)
}
