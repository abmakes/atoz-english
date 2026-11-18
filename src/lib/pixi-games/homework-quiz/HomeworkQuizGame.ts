import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js'
import { ensureFontIsLoaded } from '@/lib/pixi-engine/utils/ensureFontIsLoaded'
import { getPixiThemeConfig, getThemeConfig, sceneThemeId, type SceneThemeId } from '@/lib/themes'
import type { FlameColor } from '@/lib/homework/rules'

export interface HomeworkCard {
  id: string
  question: string
  imageUrl: string | null
  answers: string[]
  correctAnswer: string
}

export interface HomeworkFrame {
  mode: 'HOMEWORK' | 'CHALLENGE'
  progress: string
  /** 1-based question on screen. Used to fill the progress pips. */
  step: number
  total: number
  lives: number | null
  timeLimitMs: number | null
  /** Epoch ms when the server started this question. Null hides the clock. */
  startedAtMs: number | null
  flame: FlameColor | null
  shake: boolean
}

const FLAME_HEX: Record<FlameColor, { core: number; edge: number }> = {
  amber: { core: 0xfbbf24, edge: 0xf59e0b },
  orange: { core: 0xfdba74, edge: 0xf97316 },
  red: { core: 0xfca5a5, edge: 0xef4444 },
  'deep-red': { core: 0xf87171, edge: 0xb91c1c },
  magenta: { core: 0xf9a8d4, edge: 0xdb2777 },
  violet: { core: 0xc4b5fd, edge: 0x7c3aed },
  'white-blue': { core: 0xffffff, edge: 0x22d3ee },
}

interface ChoiceButton {
  view: Container
  plate: Graphics
  label: Text
  answer: string
}

type ButtonTone = 'idle' | 'pressed' | 'right' | 'wrong' | 'dim'

export class HomeworkQuizGame {
  private readonly themeId: SceneThemeId
  private readonly theme: ReturnType<typeof getPixiThemeConfig>
  private readonly root = new Container()
  private readonly board = new Container()
  private readonly background = new Sprite(Texture.EMPTY)
  private readonly flames = new Container()
  private readonly pictureFrame = new Graphics()
  private readonly pictureMask = new Graphics()
  private readonly picture = new Sprite(Texture.EMPTY)
  private readonly timerBar = new Graphics()
  private readonly timerTrack = new Graphics()
  private readonly progressText: Text
  private readonly progressPips = new Graphics()
  private readonly livesText: Text
  private readonly questionText: Text
  private readonly bannerPlate = new Graphics()
  private readonly bannerText: Text
  private readonly buttons: ChoiceButton[] = []
  private readonly tones: ButtonTone[] = ['idle', 'idle', 'idle', 'idle']
  private bannerOn = false
  private bannerGood = false
  private boardFade = 1
  private boardFadeTarget = 1
  private boardY = 0
  private boardYTarget = 0
  private barShown = 0
  private barTargetRatio = 0
  private settle: (() => void) | null = null
  private card: HomeworkCard | null = null
  private frame: HomeworkFrame | null = null
  private locked = false
  private timeoutSent = false
  private loadedUrl: string | null = null
  private destroyed = false
  private pictureX = 0
  private pictureY = 0

  constructor(
    private readonly app: Application,
    theme: string | null | undefined,
    private readonly hooks: {
      onChoose: (answer: string) => void
      onTimeout: () => void
    }
  ) {
    this.themeId = sceneThemeId(theme)
    this.theme = getPixiThemeConfig(this.themeId)
    const stroke = this.themeId === 'dark' ? { color: '#0f172a', width: 5 } : { color: '#ffffff', width: 5 }
    this.progressText = new Text({
      text: '',
      style: { fontFamily: 'Grandstander', fontSize: 22, fontWeight: '800', fill: this.theme.headingColor, stroke },
    })
    this.bannerText = new Text({
      text: '',
      style: {
        fontFamily: 'Grandstander',
        fontSize: 36,
        fontWeight: '800',
        fill: '#14532d',
        align: 'center',
        wordWrap: true,
      },
    })
    this.livesText = new Text({
      text: '',
      style: { fontFamily: 'Grandstander', fontSize: 22, fontWeight: '800', fill: this.theme.primaryAccent, stroke },
    })
    this.questionText = new Text({
      text: '',
      style: {
        fontFamily: 'Grandstander',
        fontSize: 28,
        fontWeight: '800',
        fill: this.theme.questionTextColor,
        align: 'center',
        wordWrap: true,
        stroke,
      },
    })
    this.picture.anchor.set(0.5)
  }

  async init(): Promise<void> {
    await ensureFontIsLoaded('Grandstander', '32px')
    if (this.destroyed) return
    this.background.eventMode = 'none'
    this.background.anchor.set(0.5)
    this.flames.eventMode = 'none'
    this.pictureFrame.eventMode = 'none'
    this.pictureMask.eventMode = 'none'
    this.picture.eventMode = 'none'
    this.timerBar.eventMode = 'none'
    this.timerTrack.eventMode = 'none'
    this.progressText.eventMode = 'none'
    this.progressPips.eventMode = 'none'
    this.livesText.eventMode = 'none'
    this.questionText.eventMode = 'none'
    this.bannerPlate.eventMode = 'none'
    this.bannerText.eventMode = 'none'
    this.app.stage.eventMode = 'static'
    this.app.stage.addChild(this.root)
    this.root.addChild(this.background)
    this.root.addChild(this.progressText)
    this.root.addChild(this.progressPips)
    this.root.addChild(this.livesText)
    this.root.addChild(this.board)
    this.picture.mask = this.pictureMask
    this.board.addChild(this.flames)
    this.board.addChild(this.timerTrack)
    this.board.addChild(this.timerBar)
    this.board.addChild(this.pictureFrame)
    this.board.addChild(this.picture)
    this.board.addChild(this.pictureMask)
    this.board.addChild(this.questionText)
    this.board.addChild(this.bannerPlate)
    this.board.addChild(this.bannerText)
    for (let index = 0; index < 4; index += 1) this.buttons.push(this.makeButton())
    this.app.ticker.add(this.tick)
    this.app.renderer.on('resize', this.layout)
    this.layout()
    void this.loadBackground()
  }

  /** Let the student tap again after a save was rejected. */
  unlock(): void {
    if (!this.destroyed) this.locked = false
  }

  show(card: HomeworkCard, frame: HomeworkFrame): void {
    this.card = card
    this.frame = frame
    this.locked = false
    this.timeoutSent = false
    this.bannerOn = false
    this.tones.fill('idle')
    this.progressText.text = frame.progress
    const total = Math.max(1, frame.total)
    const done = frame.mode === 'HOMEWORK' ? Math.max(0, frame.step - 1) : frame.step
    this.barTargetRatio = Math.min(1, done / total)
    if (this.barShown === 0 && done === 0) this.barShown = 0
    this.boardFade = 0
    this.boardFadeTarget = 1
    this.boardY = 28
    this.boardYTarget = 0
    this.board.alpha = 0
    this.board.y = 28
    this.livesText.text = frame.mode === 'CHALLENGE' ? `${frame.lives ?? 0} ${frame.lives === 1 ? 'life' : 'lives'}` : ''
    this.questionText.text = card.question
    this.buttons.forEach((button, index) => {
      const answer = card.answers[index] ?? ''
      button.answer = answer
      button.label.text = answer
      button.view.visible = answer.length > 0
    })
    void this.loadPicture(card.imageUrl)
    this.layout()
    this.remainingMs()
  }

  /**
   * Color the chosen answer and stamp Correct or Not quite on the card.
   * This does not wait on the server. The caller then fades the card out.
   */
  showVerdict(selected: string, correct: boolean, correctAnswer: string): void {
    this.locked = true
    this.bannerOn = true
    this.bannerGood = correct
    this.bannerText.text = correct ? 'Correct!' : `Not quite. ${correctAnswer}`
    if (this.frame) {
      const total = Math.max(1, this.frame.total)
      const next = this.frame.mode === 'HOMEWORK' ? this.frame.step : this.frame.step + (correct ? 1 : 0)
      this.barTargetRatio = Math.min(1, next / total)
    }
    this.blip(correct)
    this.buttons.forEach((button, index) => {
      if (!button.view.visible || !button.answer) {
        this.tones[index] = 'idle'
        return
      }
      if (button.answer === correctAnswer) this.tones[index] = 'right'
      else if (button.answer === selected) this.tones[index] = 'wrong'
      else this.tones[index] = 'dim'
    })
    this.layout()
  }

  /** Fade the question out so the next one can come in. */
  depart(): Promise<void> {
    this.boardFadeTarget = 0
    this.boardYTarget = 22
    return new Promise((resolve) => {
      this.settle = resolve
    })
  }

  /** Warm the next picture so the incoming card does not pop in late. */
  preload(url: string | null): void {
    if (url) void Assets.load(url).catch(() => undefined)
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.app.ticker.remove(this.tick)
    this.app.renderer.off('resize', this.layout)
    const url = this.loadedUrl
    this.loadedUrl = null
    this.root.destroy({ children: true })
    if (url) void Assets.unload(url).catch(() => undefined)
  }

  private async loadBackground(): Promise<void> {
    const url = `${getThemeConfig(this.themeId).imagesBasePath}bg_image.webp`
    try {
      const texture = await Assets.load<Texture>(url)
      if (this.destroyed) return
      this.background.texture = texture
      this.layout()
    } catch (error) {
      console.error('[HomeworkQuiz] background failed', error)
    }
  }

  private makeButton(): ChoiceButton {
    const view = new Container()
    const plate = new Graphics()
    const label = new Text({
      text: '',
      style: {
        fontFamily: 'Grandstander',
        fontSize: 22,
        fontWeight: '800',
        fill: this.theme.buttonTextColor,
        align: 'center',
        wordWrap: true,
      },
    })
    plate.eventMode = 'none'
    label.eventMode = 'none'
    view.addChild(plate)
    view.addChild(label)
    view.eventMode = 'static'
    view.cursor = 'pointer'
    const button: ChoiceButton = { view, plate, label, answer: '' }
    let armed = false
    view.on('pointerdown', (event) => {
      if (this.locked || this.destroyed || !button.answer) return
      armed = true
      event.stopPropagation()
      view.scale.set(0.96)
    })
    view.on('pointerup', (event) => {
      if (!armed) return
      armed = false
      event.stopPropagation()
      if (!button.answer || this.locked || this.destroyed) return
      this.locked = true
      this.hooks.onChoose(button.answer)
    })
    view.on('pointerupoutside', () => {
      armed = false
    })
    this.board.addChild(view)
    return button
  }

  private paintButton(button: ChoiceButton, state: ButtonTone, width: number, height: number): void {
    const fill =
      state === 'right' ? 0xbbf7d0 : state === 'wrong' ? 0xfecdd3 : state === 'pressed' ? 0xe0f2fe : this.theme.buttonFillColor
    const stroke =
      state === 'right'
        ? 0x15803d
        : state === 'wrong'
          ? 0xbe123c
          : state === 'pressed'
            ? 0x0284c7
            : this.theme.buttonBorderColor ?? this.theme.inputBorder
    const ink = state === 'right' ? 0x14532d : state === 'wrong' ? 0x881337 : this.theme.buttonTextColor
    button.view.alpha = state === 'dim' ? 0.4 : 1
    button.label.style.fill = ink
    button.plate.clear()
    button.plate.roundRect(0, 0, width, height, 18).fill(fill).stroke({ width: state === 'idle' ? 4 : 6, color: stroke })
  }

  private tick = (): void => {
    if (this.destroyed || !this.frame) return
    const dt = this.app.ticker.deltaMS || 16
    const glide = (current: number, target: number, ms: number) => current + (target - current) * (1 - Math.exp(-dt / ms))
    this.boardFade = glide(this.boardFade, this.boardFadeTarget, 80)
    this.boardY = glide(this.boardY, this.boardYTarget, 80)
    this.barShown = glide(this.barShown, this.barTargetRatio, 90)
    this.board.alpha = this.boardFade
    this.board.y = this.boardY
    this.drawBar()
    if (this.settle && Math.abs(this.boardFade - this.boardFadeTarget) < 0.04) {
      const done = this.settle
      this.settle = null
      this.boardFade = this.boardFadeTarget
      this.board.alpha = this.boardFade
      done()
    }
    const now = performance.now()
    if (this.frame.shake) {
      this.picture.position.x = this.pictureX + Math.sin(now / 28) * 5
      this.picture.position.y = this.pictureY + Math.cos(now / 23) * 3
    }
    this.drawFlames(now)
    this.drawTimer()
    const left = this.remainingMs()
    if (left !== null && left <= 0 && !this.locked && !this.timeoutSent) {
      this.timeoutSent = true
      this.locked = true
      this.hooks.onTimeout()
    }
  }

  private remainingMs(): number | null {
    if (!this.frame?.timeLimitMs || this.frame.startedAtMs === null) return null
    return this.frame.timeLimitMs - (Date.now() - this.frame.startedAtMs)
  }

  private drawTimer(): void {
    const left = this.remainingMs()
    this.timerTrack.visible = left !== null
    this.timerBar.visible = left !== null
    if (left === null || !this.frame?.timeLimitMs) return
    const ratio = Math.max(0, Math.min(1, left / this.frame.timeLimitMs))
    const bounds = this.pictureFrame.getLocalBounds()
    const x = bounds.x - 18
    const y = bounds.y
    const height = Math.max(40, bounds.height)
    this.timerTrack.clear()
    this.timerTrack.roundRect(x, y, 10, height, 5).fill({ color: this.theme.secondaryBg })
    this.timerBar.clear()
    const filled = height * ratio
    this.timerBar.roundRect(x, y, 10, filled, 5).fill({ color: this.theme.timerColor })
  }

  private drawFlames(now: number): void {
    this.flames.removeChildren().forEach((child) => child.destroy())
    const color = this.frame?.flame
    if (!color) return
    const paint = FLAME_HEX[color]
    const bounds = this.pictureFrame.getLocalBounds()
    const count = 8
    for (let index = 0; index < count; index += 1) {
      const flame = new Graphics()
      const along = index / count
      const edge = index % 2 === 0
      const x = bounds.x + bounds.width * along
      const y = edge ? bounds.y + bounds.height : bounds.y
      const lift = 10 + Math.sin(now / 180 + index) * 8
      flame.moveTo(x - 10, y)
      flame.lineTo(x, y + (edge ? lift : -lift))
      flame.lineTo(x + 10, y)
      flame.fill({ color: paint.core })
      flame.circle(x, y + (edge ? lift * 0.45 : -lift * 0.45), 5).fill({ color: paint.edge })
      this.flames.addChild(flame)
    }
  }

  private async loadPicture(url: string | null): Promise<void> {
    const next = url && url.length > 0 ? url : null
    if (next === this.loadedUrl) return
    const previous = this.loadedUrl
    this.loadedUrl = next
    this.picture.visible = false
    if (!next) {
      this.picture.texture = Texture.EMPTY
      this.picture.visible = false
    } else {
      try {
        const texture = await Assets.load<Texture>(next)
        if (this.destroyed || this.loadedUrl !== next) {
          void Assets.unload(next).catch(() => undefined)
          return
        }
        this.picture.texture = texture
        this.picture.visible = true
        this.layout()
      } catch (error) {
        console.error('[HomeworkQuiz] picture failed', error)
        this.picture.visible = false
      }
    }
    if (previous) void Assets.unload(previous).catch(() => undefined)
  }

  private layout = (): void => {
    if (this.destroyed) return
    const width = this.app.screen.width
    const height = this.app.screen.height
    this.app.stage.hitArea = new Rectangle(0, 0, width, height)
    this.background.position.set(width / 2, height / 2)
    if (this.background.texture?.width) {
      const screenAspect = width / Math.max(height, 1)
      const textureAspect = this.background.texture.width / this.background.texture.height
      const scale = screenAspect > textureAspect
        ? width / this.background.texture.width
        : height / this.background.texture.height
      this.background.scale.set(Number.isFinite(scale) && scale > 0 ? scale : 1)
    }
    const desktopLandscape = width > height && width >= 960
    const gutter = width < 700 ? 16 : 28
    const column = Math.min(width - gutter * 2, desktopLandscape ? 960 : 720)
    const left = (width - column) / 2
    const chromeTop = 20
    this.progressText.position.set(left, chromeTop)
    this.livesText.anchor.set(1, 0)
    this.livesText.position.set(left + column, chromeTop)
    this.drawBar()
    const pictureTop = chromeTop + 40
    const bottomMargin = width < 700 ? 28 : 32
    const gap = 10
    const choices = this.buttons.filter((button) => button.view.visible)
    const questionSize = width < 700 ? 22 : 30
    this.questionText.style.fontSize = questionSize
    this.questionText.style.wordWrapWidth = column
    this.questionText.anchor.set(0.5, 0)
    const columns = desktopLandscape || height < 560 ? 2 : 1
    const rows = Math.max(1, Math.ceil(choices.length / columns))
    const buttonWidth = columns === 1 ? column : (column - gap) / columns
    choices.forEach((button) => {
      button.label.style.fontSize = width < 700 ? 20 : 22
      button.label.style.wordWrapWidth = buttonWidth - 28
    })
    const textHeight = choices.reduce((tallest, button) => Math.max(tallest, button.label.height), 0)
    let buttonHeight = Math.max(desktopLandscape ? 72 : 56, textHeight + 28)
    const questionGap = 14
    const reserved = this.questionText.height + questionGap + rows * buttonHeight + (rows - 1) * gap + bottomMargin
    const minPicture = 120
    if (pictureTop + minPicture + reserved > height) {
      const room = height - pictureTop - minPicture - bottomMargin - this.questionText.height - questionGap - (rows - 1) * gap
      buttonHeight = Math.max(48, room / rows)
    }
    const answersHeight = rows * buttonHeight + (rows - 1) * gap
    const blockHeight = this.questionText.height + questionGap + answersHeight
    let questionY = desktopLandscape
      ? pictureTop + Math.max(minPicture, Math.min(column * 0.46, height - pictureTop - blockHeight - bottomMargin)) + 16
      : height - bottomMargin - blockHeight
    const minQuestionY = pictureTop + minPicture
    if (questionY < minQuestionY) questionY = minQuestionY
    const pictureRoom = Math.max(minPicture, questionY - 16 - pictureTop)
    let frameWidth = column
    let frameHeight = pictureRoom
    if (this.picture.texture?.width && this.picture.texture.height) {
      const aspect = this.picture.texture.width / this.picture.texture.height
      frameHeight = Math.min(pictureRoom, frameWidth / aspect)
      frameWidth = Math.min(column, frameHeight * aspect)
      frameHeight = frameWidth / aspect
    }
    const frameLeft = left + (column - frameWidth) / 2
    const frameTop = pictureTop
    this.pictureFrame.clear()
    this.pictureFrame
      .roundRect(frameLeft, frameTop, frameWidth, frameHeight, 28)
      .fill({ color: this.theme.panelBg })
      .stroke({ width: 6, color: this.theme.primaryAccent })
    this.pictureMask.clear()
    this.pictureMask.roundRect(frameLeft + 8, frameTop + 8, frameWidth - 16, frameHeight - 16, 22).fill(0xffffff)
    this.pictureX = frameLeft + frameWidth / 2
    this.pictureY = frameTop + frameHeight / 2
    this.picture.position.set(this.pictureX, this.pictureY)
    if (this.picture.texture?.width) {
      const scale = Math.min((frameWidth - 24) / this.picture.texture.width, (frameHeight - 24) / this.picture.texture.height)
      this.picture.scale.set(Number.isFinite(scale) && scale > 0 ? scale : 1)
    }
    this.questionText.position.set(width / 2, questionY)
    const choiceTop = questionY + this.questionText.height + questionGap
    choices.forEach((button, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)
      button.plate.clear()
      button.plate
        .roundRect(0, 0, buttonWidth, buttonHeight, 18)
        .fill(this.theme.buttonFillColor)
        .stroke({ width: 4, color: this.theme.buttonBorderColor ?? this.theme.inputBorder })
      button.label.anchor.set(0.5)
      button.label.position.set(buttonWidth / 2, buttonHeight / 2)
      button.view.hitArea = new Rectangle(0, 0, buttonWidth, buttonHeight)
      const tone = this.tones[this.buttons.indexOf(button)] ?? 'idle'
      button.view.pivot.set(buttonWidth / 2, buttonHeight / 2)
      button.view.position.set(
        left + col * (buttonWidth + gap) + buttonWidth / 2,
        choiceTop + row * (buttonHeight + gap) + buttonHeight / 2
      )
      button.view.scale.set(tone === 'right' ? 1.03 : 1)
      this.paintButton(button, tone, buttonWidth, buttonHeight)
    })
    this.drawBanner(width, this.pictureY)
  }

  private drawBar(): void {
    this.progressPips.clear()
    if (!this.frame) return
    const width = this.app.screen.width
    const gutter = width < 700 ? 16 : 28
    const desktopLandscape = width > this.app.screen.height && width >= 960
    const column = Math.min(width - gutter * 2, desktopLandscape ? 960 : 720)
    const left = (width - column) / 2
    const livesWidth = this.livesText.text ? this.livesText.width + 16 : 0
    const barX = left + this.progressText.width + 14
    const barWidth = Math.max(40, column - this.progressText.width - 14 - livesWidth)
    const y = 28
    this.progressPips.roundRect(barX, y, barWidth, 8, 4).fill({ color: 0xffffff, alpha: 0.35 })
    const filled = Math.max(0, Math.min(barWidth, barWidth * this.barShown))
    if (filled > 1) this.progressPips.roundRect(barX, y, filled, 8, 4).fill({ color: 0x38bdf8 })
  }

  private blip(correct: boolean): void {
    const audio = new Audio(correct ? '/audio/default/correct-sound.mp3' : '/audio/default/incorrect-sound.mp3')
    audio.volume = 0.5
    void audio.play().catch(() => undefined)
  }

  private drawBanner(screenWidth: number, centerY: number): void {
    this.bannerPlate.clear()
    this.bannerText.visible = this.bannerOn
    if (!this.bannerOn) return
    this.bannerText.style.wordWrapWidth = Math.min(screenWidth - 80, 640)
    this.bannerText.style.fill = this.bannerGood ? 0x14532d : 0x881337
    this.bannerText.anchor.set(0.5)
    const padX = 22
    const padY = 14
    const boxWidth = this.bannerText.width + padX * 2
    const boxHeight = this.bannerText.height + padY * 2
    const x = (screenWidth - boxWidth) / 2
    const y = centerY - boxHeight / 2
    this.bannerPlate
      .roundRect(x, y, boxWidth, boxHeight, 18)
      .fill({ color: this.bannerGood ? 0xdcfce7 : 0xffe4e6, alpha: 0.96 })
      .stroke({ width: 4, color: this.bannerGood ? 0x15803d : 0xbe123c })
    this.bannerText.position.set(screenWidth / 2, centerY)
  }
}
