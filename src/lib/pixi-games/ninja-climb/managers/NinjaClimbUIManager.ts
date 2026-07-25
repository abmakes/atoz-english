import * as PIXI from 'pixi.js'
import { EventBus } from '@/lib/pixi-engine/core/EventBus'
import { ENGINE_EVENTS, TIMER_EVENTS, TimerEventPayload } from '@/lib/pixi-engine/core/EventTypes'
import type { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication'
import type { PixiSpecificConfig } from '@/lib/themes'
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader'
import { PixiTimer } from '@/lib/pixi-games/multiple-choice/ui/PixiTimer'
import type { NinjaClimbLayoutManager } from './NinjaClimbLayoutManager'
import type { NinjaPowerupId } from '../ninjaPowerups'
import { NINJA_POWERUP_DEFINITIONS } from '../ninjaPowerups'
import type { ShortcutKind } from './NinjaClimbRaceManager'

const ASSET_BASE = '/images/ninja-climb'
const QUESTION_TIMER_ID = 'ninja-climb-question-timer'

export interface NinjaAnswerOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface ShortcutPromptInfo {
  kind: ShortcutKind
  ladderChance: number
  ladderDelta: number
  snakeDelta: number
}

/**
 * Question card, answer banners, timer, power-up buttons, shortcut prompt, feedback.
 */
export class NinjaClimbUIManager {
  private view: PIXI.Container
  private questionPanel: PIXI.Container
  private answerPanel: PIXI.Container
  private powerupPanel: PIXI.Container
  private feedbackPanel: PIXI.Container
  private shortcutPanel: PIXI.Container
  private questionText: PIXI.Text
  private questionImage: PIXI.Sprite | null = null
  private answerButtons: Array<{
    container: PIXI.Container
    bg: PIXI.Graphics
    label: PIXI.Text
    option: NinjaAnswerOption
  }> = []
  private powerupButtons: Map<
    NinjaPowerupId,
    { container: PIXI.Container; icon: PIXI.Sprite | null; label: PIXI.Text; enabled: boolean }
  > = new Map()
  private timer: PixiTimer
  private answersEnabled = false
  private powerupsEnabled = false
  private destroyed = false
  private shortcutResolve: ((choice: 'enter' | 'skip') => void) | null = null
  private onAnswerSelected: ((optionId: string) => void) | null = null
  private onPowerupSelected: ((id: NinjaPowerupId) => void) | null = null

  constructor(
    private pixiApp: PixiApplication,
    private eventBus: EventBus,
    private assetLoader: typeof AssetLoader,
    private pixiConfig: PixiSpecificConfig,
    private layoutManager: NinjaClimbLayoutManager
  ) {
    this.view = new PIXI.Container()
    this.questionPanel = new PIXI.Container()
    this.answerPanel = new PIXI.Container()
    this.powerupPanel = new PIXI.Container()
    this.feedbackPanel = new PIXI.Container()
    this.shortcutPanel = new PIXI.Container()
    this.shortcutPanel.visible = false

    this.questionText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: pixiConfig.fontFamilyTheme || 'Grandstander',
        fontSize: 22,
        fill: this._hex(pixiConfig.questionTextColor || pixiConfig.textColor),
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: 600,
        align: 'center',
      },
    })
    this.questionText.anchor.set(0.5, 0)

    this.timer = new PixiTimer({
      radius: 36,
      textColor: this._hex(pixiConfig.timerColor || pixiConfig.textColor),
      textSize: 28,
      fontFamily: pixiConfig.fontFamilyTheme || 'Grandstander',
      progressBarColor: this._hex(pixiConfig.primaryAccent || '#49C8FF'),
      progressBarWidth: 8,
      backgroundAlpha: 0.15,
      backgroundColor: 0xffffff,
    })

    this.view.addChild(this.questionPanel)
    this.view.addChild(this.answerPanel)
    this.view.addChild(this.powerupPanel)
    this.view.addChild(this.feedbackPanel)
    this.view.addChild(this.shortcutPanel)
    this.view.addChild(this.timer)

    this.eventBus.on(ENGINE_EVENTS.RESIZED, this._onResize)
    this.eventBus.on(TIMER_EVENTS.TIMER_TICK, this._onTimerTick)
  }

  public getView(): PIXI.Container {
    return this.view
  }

  public setAnswerHandler(handler: (optionId: string) => void): void {
    this.onAnswerSelected = handler
  }

  public setPowerupHandler(handler: (id: NinjaPowerupId) => void): void {
    this.onPowerupSelected = handler
  }

  public async initialize(): Promise<void> {
    await this._buildPowerupButtons()
    this._layoutAll()
  }

  public async showQuestion(
    questionText: string,
    imageUrl: string | undefined,
    options: NinjaAnswerOption[],
    questionDurationMs: number
  ): Promise<void> {
    this.clearQuestionState()
    this.questionPanel.removeChildren()

    const { width } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()

    const panelBg = new PIXI.Graphics()
    const panelW = width - layout.sidePadding * 2
    const panelH = layout.questionCardHeight
    panelBg
      .roundRect(0, 0, panelW, panelH, 16)
      .fill({ color: this._hex(this.pixiConfig.panelBg || '#e0f2fe'), alpha: 0.92 })
      .stroke({ width: 3, color: this._hex(this.pixiConfig.primaryAccent || '#49C8FF') })
    this.questionPanel.addChild(panelBg)
    this.questionPanel.x = layout.sidePadding
    this.questionPanel.y = layout.topPadding

    this.questionText.text = questionText
    this.questionText.style.fontSize = layout.questionFontSize
    this.questionText.style.wordWrapWidth = panelW - 140
    this.questionText.x = panelW / 2
    this.questionText.y = 16
    this.questionPanel.addChild(this.questionText)

    if (imageUrl) {
      try {
        const display = this.assetLoader.getDisplayObject(imageUrl)
        if (display) {
          const maxH = panelH - 20
          const maxW = 90
          const scale = Math.min(maxW / display.width, maxH / display.height, 1)
          display.scale.set(scale)
          display.x = 12
          display.y = 10
          this.questionImage = display as PIXI.Sprite
          this.questionPanel.addChild(display)
          this.questionText.x = panelW / 2 + 40
        }
      } catch {
        /* ignore image failures */
      }
    }

    this._buildAnswerBanners(options)
    this.updateTimerDisplay(questionDurationMs)
    this.setAnswerButtonsEnabled(true)
  }

  public updateTimerDisplay(remainingMs: number, durationMs?: number): void {
    const duration = durationMs ?? remainingMs
    this.timer.updateDisplay(remainingMs, Math.max(1, duration))
  }

  public setAnswerButtonsEnabled(enabled: boolean): void {
    this.answersEnabled = enabled
    for (const btn of this.answerButtons) {
      btn.container.eventMode = enabled ? 'static' : 'none'
      btn.container.alpha = enabled ? 1 : 0.7
    }
  }

  public setPowerupCharges(
    charges: Record<NinjaPowerupId, number>,
    interactive: boolean
  ): void {
    this.powerupsEnabled = interactive
    for (const def of NINJA_POWERUP_DEFINITIONS) {
      const btn = this.powerupButtons.get(def.id)
      if (!btn) continue
      const hasCharge = (charges[def.id] ?? 0) > 0
      btn.enabled = interactive && hasCharge
      btn.container.alpha = hasCharge ? (interactive ? 1 : 0.85) : 0.35
      btn.container.eventMode = btn.enabled ? 'static' : 'none'
      btn.label.text = hasCharge ? def.hotkey : '—'
    }
  }

  public showAnswerFeedback(correct: boolean, points: number): void {
    this.feedbackPanel.removeChildren()
    const { width, height } = this.pixiApp.getScreenSize()
    const text = new PIXI.Text({
      text: correct ? (points > 0 ? `+${points} CLIMB!` : 'CORRECT!') : 'MISSED!',
      style: {
        fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
        fontSize: 36,
        fontWeight: 'bold',
        fill: correct ? 0x16a34a : 0xdc2626,
        align: 'center',
        stroke: { color: 0xffffff, width: 4 },
      },
    })
    text.anchor.set(0.5)
    text.x = width / 2
    text.y = height * 0.42
    this.feedbackPanel.addChild(text)

    setTimeout(() => {
      if (!this.destroyed) this.feedbackPanel.removeChildren()
    }, 1400)
  }

  public showPowerupFeedback(message: string): void {
    this.feedbackPanel.removeChildren()
    const { width, height } = this.pixiApp.getScreenSize()
    const text = new PIXI.Text({
      text: message,
      style: {
        fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
        fontSize: 28,
        fontWeight: 'bold',
        fill: this._hex(this.pixiConfig.primaryAccent || '#49C8FF'),
        align: 'center',
        stroke: { color: 0xffffff, width: 4 },
      },
    })
    text.anchor.set(0.5)
    text.x = width / 2
    text.y = height * 0.38
    this.feedbackPanel.addChild(text)
    setTimeout(() => {
      if (!this.destroyed) this.feedbackPanel.removeChildren()
    }, 1200)
  }

  public promptShortcut(info: ShortcutPromptInfo): Promise<'enter' | 'skip'> {
    return new Promise((resolve) => {
      this.shortcutResolve = resolve
      this.shortcutPanel.removeChildren()
      this.shortcutPanel.visible = true

      const { width, height } = this.pixiApp.getScreenSize()
      const overlay = new PIXI.Graphics()
      overlay.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.45 })
      this.shortcutPanel.addChild(overlay)

      const card = new PIXI.Graphics()
      const cardW = Math.min(420, width * 0.8)
      const cardH = 220
      card
        .roundRect(0, 0, cardW, cardH, 18)
        .fill({ color: 0xfffbeb, alpha: 0.97 })
        .stroke({ width: 4, color: 0x92400e })
      card.x = (width - cardW) / 2
      card.y = (height - cardH) / 2
      this.shortcutPanel.addChild(card)

      const title =
        info.kind === 'forest' ? 'Dark Forest Shortcut!' : 'Cave Shortcut!'
      const ladderPct = Math.round(info.ladderChance * 100)
      const snakePct = 100 - ladderPct
      const body = new PIXI.Text({
        text:
          `${title}\n` +
          `${ladderPct}% ladder +${info.ladderDelta}  ·  ${snakePct}% snake ${info.snakeDelta}\n` +
          `Enter the risk, or skip safely?`,
        style: {
          fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
          fontSize: 18,
          fill: 0x1f2937,
          align: 'center',
          fontWeight: 'bold',
        },
      })
      body.anchor.set(0.5, 0)
      body.x = width / 2
      body.y = card.y + 24
      this.shortcutPanel.addChild(body)

      const enterBtn = this._makePromptButton('Enter', 0x16a34a, () => this._resolveShortcut('enter'))
      const skipBtn = this._makePromptButton('Skip', 0x6b7280, () => this._resolveShortcut('skip'))
      enterBtn.x = width / 2 - 100
      skipBtn.x = width / 2 + 20
      enterBtn.y = card.y + cardH - 60
      skipBtn.y = card.y + cardH - 60
      this.shortcutPanel.addChild(enterBtn)
      this.shortcutPanel.addChild(skipBtn)

      // Auto-skip after 8s
      setTimeout(() => {
        if (this.shortcutResolve) this._resolveShortcut('skip')
      }, 8000)
    })
  }

  public clearQuestionState(): void {
    this.answerPanel.removeChildren()
    this.answerButtons = []
    if (this.questionImage) {
      this.questionImage.destroy()
      this.questionImage = null
    }
  }

  public hideShortcutPrompt(): void {
    this.shortcutPanel.visible = false
    this.shortcutPanel.removeChildren()
    this.shortcutResolve = null
  }

  private _resolveShortcut(choice: 'enter' | 'skip'): void {
    const resolve = this.shortcutResolve
    this.hideShortcutPrompt()
    resolve?.(choice)
  }

  private _makePromptButton(
    label: string,
    color: number,
    onClick: () => void
  ): PIXI.Container {
    const c = new PIXI.Container()
    const bg = new PIXI.Graphics()
    bg.roundRect(0, 0, 90, 40, 10).fill({ color }).stroke({ width: 2, color: 0x111827 })
    const text = new PIXI.Text({
      text: label,
      style: {
        fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    })
    text.anchor.set(0.5)
    text.x = 45
    text.y = 20
    c.addChild(bg)
    c.addChild(text)
    c.eventMode = 'static'
    c.cursor = 'pointer'
    c.on('pointertap', onClick)
    return c
  }

  private _buildAnswerBanners(options: NinjaAnswerOption[]): void {
    this.answerPanel.removeChildren()
    this.answerButtons = []
    const { width, height } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()
    const bannerH = layout.answerBannerHeight
    const gap = layout.answerBannerGap
    const totalH = options.length * bannerH + (options.length - 1) * gap
    const startY = height - layout.bottomUIHeight + 8
    // If too tall for bottom area, stack upward from bottom padding
    let y = Math.max(height - layout.sidePadding - totalH, startY)
    const bannerW = width - layout.sidePadding * 2 - layout.powerupButtonSize - 12

    options.forEach((option, index) => {
      const container = new PIXI.Container()
      const bg = new PIXI.Graphics()
      bg.roundRect(0, 0, bannerW, bannerH, 12)
        .fill({ color: this._hex(this.pixiConfig.buttonFillColor || '#ffffff'), alpha: 0.95 })
        .stroke({ width: 3, color: this._hex(this.pixiConfig.buttonBorderColor || '#d1d5db') })

      const label = new PIXI.Text({
        text: `${index + 1}. ${option.text}`,
        style: {
          fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
          fontSize: layout.answerFontSize,
          fill: this._hex(this.pixiConfig.buttonTextColor || this.pixiConfig.textColor),
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: bannerW - 24,
        },
      })
      label.x = 12
      label.y = (bannerH - label.height) / 2

      container.addChild(bg)
      container.addChild(label)
      container.x = layout.sidePadding
      container.y = y
      container.eventMode = 'static'
      container.cursor = 'pointer'
      container.on('pointertap', () => {
        if (!this.answersEnabled) return
        this.onAnswerSelected?.(option.id)
      })
      container.on('pointerover', () => {
        bg.clear()
          .roundRect(0, 0, bannerW, bannerH, 12)
          .fill({ color: this._hex(this.pixiConfig.primaryAccent || '#49C8FF'), alpha: 0.25 })
          .stroke({ width: 3, color: this._hex(this.pixiConfig.primaryAccent || '#49C8FF') })
      })
      container.on('pointerout', () => {
        bg.clear()
          .roundRect(0, 0, bannerW, bannerH, 12)
          .fill({ color: this._hex(this.pixiConfig.buttonFillColor || '#ffffff'), alpha: 0.95 })
          .stroke({ width: 3, color: this._hex(this.pixiConfig.buttonBorderColor || '#d1d5db') })
      })

      this.answerPanel.addChild(container)
      this.answerButtons.push({ container, bg, label, option })
      y += bannerH + gap
    })
  }

  private async _buildPowerupButtons(): Promise<void> {
    this.powerupPanel.removeChildren()
    this.powerupButtons.clear()
    const layout = this.layoutManager.getLayoutParams()
    const size = layout.powerupButtonSize

    for (let i = 0; i < NINJA_POWERUP_DEFINITIONS.length; i++) {
      const def = NINJA_POWERUP_DEFINITIONS[i]
      const container = new PIXI.Container()
      const bg = new PIXI.Graphics()
      bg.roundRect(0, 0, size, size, 12)
        .fill({ color: 0x1f2937, alpha: 0.85 })
        .stroke({ width: 2, color: 0xfbbf24 })

      let icon: PIXI.Sprite | null = null
      try {
        const tex = await PIXI.Assets.load(`${ASSET_BASE}/icon_${def.id}.png`)
        icon = new PIXI.Sprite(tex)
        icon.anchor.set(0.5)
        icon.width = size * 0.62
        icon.height = size * 0.62
        icon.x = size / 2
        icon.y = size / 2 - 4
        container.addChild(bg)
        container.addChild(icon)
      } catch {
        container.addChild(bg)
      }

      const label = new PIXI.Text({
        text: def.hotkey,
        style: {
          fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
          fontSize: 12,
          fill: 0xffffff,
          fontWeight: 'bold',
        },
      })
      label.anchor.set(0.5)
      label.x = size / 2
      label.y = size - 10
      container.addChild(label)

      container.eventMode = 'static'
      container.cursor = 'pointer'
      container.on('pointertap', () => {
        const btn = this.powerupButtons.get(def.id)
        if (!btn?.enabled) return
        this.onPowerupSelected?.(def.id)
      })

      this.powerupPanel.addChild(container)
      this.powerupButtons.set(def.id, { container, icon, label, enabled: false })
    }
    this._layoutPowerups()
  }

  private _layoutAll(): void {
    const { width } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()
    this.timer.x = width - layout.sidePadding - layout.timerRadius - 8
    this.timer.y = layout.topPadding + layout.timerRadius + 8
    this._layoutPowerups()
  }

  private _layoutPowerups(): void {
    const { width, height } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()
    const size = layout.powerupButtonSize
    const ids = NINJA_POWERUP_DEFINITIONS.map((d) => d.id)
    const startY = height - layout.bottomUIHeight + 8
    ids.forEach((id, i) => {
      const btn = this.powerupButtons.get(id)
      if (!btn) return
      btn.container.x = width - layout.sidePadding - size
      btn.container.y = startY + i * (size + 8)
    })
  }

  private _onResize = (): void => {
    if (this.destroyed) return
    const { width, height } = this.pixiApp.getScreenSize()
    this.layoutManager.updateLayout(width, height)
    this._layoutAll()
  }

  private _onTimerTick = (payload: TimerEventPayload): void => {
    if (payload.timerId !== QUESTION_TIMER_ID) return
    this.updateTimerDisplay(payload.remaining ?? 0, payload.duration)
  }

  private _hex(color: string | number): number {
    if (typeof color === 'number') return color
    const cleaned = color.replace('#', '')
    return parseInt(cleaned.length === 3
      ? cleaned.split('').map((c) => c + c).join('')
      : cleaned, 16)
  }

  public destroy(): void {
    this.destroyed = true
    this.eventBus.off(ENGINE_EVENTS.RESIZED, this._onResize)
    this.eventBus.off(TIMER_EVENTS.TIMER_TICK, this._onTimerTick)
    this.view.destroy({ children: true })
  }
}

export { QUESTION_TIMER_ID }
