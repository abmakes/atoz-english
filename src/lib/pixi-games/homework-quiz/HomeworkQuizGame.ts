import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js'
import { ensureFontIsLoaded } from '@/lib/pixi-engine/utils/ensureFontIsLoaded'
import { getPixiThemeConfig, getThemeConfig, sceneThemeId, type SceneThemeId } from '@/lib/themes'
import type { FlameColor } from '@/lib/homework/rules'

export interface HomeworkCard {
  id: string
  question: string
  imageUrl: string | null
  answers: string[]
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
  private pipTone: 'current' | 'right' | 'wrong' = 'current'
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
      style: { fontFamily: 'Grandstander', fontSize: 40, fontWeight: '800', fill: this.theme.headingColor, stroke },
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
    this.root.addChild(this.flames)
    this.root.addChild(this.timerTrack)
    this.root.addChild(this.timerBar)
    this.root.addChild(this.pictureFrame)
    this.root.addChild(this.picture)
    this.picture.mask = this.pictureMask
    this.root.addChild(this.pictureMask)
    this.root.addChild(this.progressText)
    this.root.addChild(this.progressPips)
    this.root.addChild(this.livesText)
    this.root.addChild(this.questionText)
    this.root.addChild(this.bannerPlate)
    this.root.addChild(this.bannerText)
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
    this.pipTone = 'current'
    this.tones.fill('idle')
    this.progressText.text = frame.progress
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

  /** Immediate press so the tap is visible before the server answers. */
  hold(answer: string): void {
    this.locked = true
    this.buttons.forEach((button, index) => {
      this.tones[index] = button.view.visible && button.answer === answer ? 'pressed' : 'dim'
    })
    this.layout()
  }

  /**
   * Color the chosen answer and stamp Correct or Not quite on the card.
   * The caller waits, then moves to the next question.
   */
  showVerdict(selected: string, correct: boolean, correctAnswer: string): void {
    this.locked = true
    this.bannerOn = true
    this.bannerGood = correct
    this.bannerText.text = correct ? 'Correct!' : `Not quite. ${correctAnswer}`
    this.pipTone = correct ? 'right' : 'wrong'
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
      armed = true
      event.stopPropagation()
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
    this.root.addChild(view)
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
    const column = Math.min(width - 48, 720)
    const left = (width - column) / 2
    const chromeTop = 148
    this.progressText.position.set(left, chromeTop)
    this.livesText.anchor.set(1, 0)
    this.livesText.position.set(left + column, chromeTop + 8)
    this.drawPips(left, chromeTop + this.progressText.height + 8, column)
    const pictureTop = chromeTop + this.progressText.height + 28
    const belowPicture = 16 + 48 + 16 + 72 * 2 + 12 + 20
    const pictureHeight = Math.max(140, Math.min(column * 0.55, height - pictureTop - belowPicture))
    this.pictureFrame.clear()
    this.pictureFrame
      .roundRect(left, pictureTop, column, pictureHeight, 28)
      .fill({ color: this.theme.panelBg })
      .stroke({ width: 6, color: this.theme.primaryAccent })
    this.pictureMask.clear()
    this.pictureMask.roundRect(left + 8, pictureTop + 8, column - 16, pictureHeight - 16, 22).fill(0xffffff)
    this.pictureX = left + column / 2
    this.pictureY = pictureTop + pictureHeight / 2
    this.picture.position.set(this.pictureX, this.pictureY)
    if (this.picture.texture?.width) {
      const scale = Math.min((column - 24) / this.picture.texture.width, (pictureHeight - 24) / this.picture.texture.height)
      this.picture.scale.set(Number.isFinite(scale) && scale > 0 ? scale : 1)
    }
    this.questionText.style.wordWrapWidth = column
    this.questionText.anchor.set(0.5, 0)
    const questionY = pictureTop + pictureHeight + 16
    this.questionText.position.set(width / 2, questionY)
    const choiceTop = questionY + this.questionText.height + 16
    const gap = 12
    const buttonWidth = (column - gap) / 2
    const buttonHeight = 72
    this.buttons.forEach((button, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      button.plate.clear()
      button.plate
        .roundRect(0, 0, buttonWidth, buttonHeight, 18)
        .fill(this.theme.buttonFillColor)
        .stroke({ width: 4, color: this.theme.buttonBorderColor ?? this.theme.inputBorder })
      button.label.style.wordWrapWidth = buttonWidth - 20
      button.label.anchor.set(0.5)
      button.label.position.set(buttonWidth / 2, buttonHeight / 2)
      button.view.hitArea = new Rectangle(0, 0, buttonWidth, buttonHeight)
      button.view.position.set(left + col * (buttonWidth + gap), choiceTop + row * (buttonHeight + gap))
      this.paintButton(button, this.tones[index] ?? 'idle', buttonWidth, buttonHeight)
    })
    this.drawBanner(width, this.pictureY)
  }

  private drawPips(left: number, top: number, column: number): void {
    this.progressPips.clear()
    const total = this.frame?.mode === 'HOMEWORK' ? this.frame.total : 0
    if (!this.frame || total < 2 || total > 24) return
    const gap = 6
    const width = Math.min(36, (column - gap * (total - 1)) / total)
    const step = Math.min(total, Math.max(1, this.frame.step))
    for (let index = 0; index < total; index += 1) {
      const done = index < step - 1
      const current = index === step - 1
      const fill = current && this.pipTone === 'right'
        ? 0x22c55e
        : current && this.pipTone === 'wrong'
          ? 0xef4444
          : done
            ? 0x7dd3fc
            : current
              ? 0x38bdf8
              : 0xffffff
      this.progressPips
        .roundRect(left + index * (width + gap), top, width, 10, 5)
        .fill({ color: fill, alpha: done || current ? 1 : 0.55 })
    }
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
