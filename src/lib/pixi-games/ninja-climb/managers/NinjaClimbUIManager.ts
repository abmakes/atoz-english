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
export const QUESTION_TIMER_ID = 'ninja-climb-question-timer'

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

export interface TeamTrayInfo {
  teamId: string
  teamName: string
  charges: Record<NinjaPowerupId, number>
  interactive: boolean
}

/**
 * Splash Dash-style bottom bar + sky answer clouds + per-team power trays.
 */
export class NinjaClimbUIManager {
  private view: PIXI.Container
  private bottomBar: PIXI.Container
  private bottomBg: PIXI.Graphics
  private questionContainer: PIXI.Container
  private questionText: PIXI.Text
  private questionCounter: PIXI.Text
  private questionImage: PIXI.Container | null = null
  private cloudPanel: PIXI.Container
  private feedbackPanel: PIXI.Container
  private shortcutPanel: PIXI.Container
  private leftTray: PIXI.Container
  private rightTray: PIXI.Container
  private cloudButtons: Array<{
    container: PIXI.Container
    label: PIXI.Text
    option: NinjaAnswerOption
    baseY: number
  }> = []
  private trayButtons: Map<
    string,
    Map<NinjaPowerupId, { container: PIXI.Container; enabled: boolean }>
  > = new Map()
  private timer: PixiTimer
  private answersEnabled = false
  private destroyed = false
  private shortcutResolve: ((choice: 'enter' | 'skip') => void) | null = null
  private shortcutTimeoutId: ReturnType<typeof setTimeout> | null = null
  private bobPhase = 0
  private onAnswerSelected: ((optionId: string) => void) | null = null
  private onPowerupSelected: ((teamId: string, id: NinjaPowerupId) => void) | null = null
  private teamOrder: string[] = []

  constructor(
    private pixiApp: PixiApplication,
    private eventBus: EventBus,
    private assetLoader: typeof AssetLoader,
    private pixiConfig: PixiSpecificConfig,
    private layoutManager: NinjaClimbLayoutManager
  ) {
    this.view = new PIXI.Container()
    this.bottomBar = new PIXI.Container()
    this.bottomBg = new PIXI.Graphics()
    this.questionContainer = new PIXI.Container()
    this.cloudPanel = new PIXI.Container()
    this.feedbackPanel = new PIXI.Container()
    this.shortcutPanel = new PIXI.Container()
    this.shortcutPanel.visible = false
    this.leftTray = new PIXI.Container()
    this.rightTray = new PIXI.Container()

    this.questionText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: pixiConfig.fontFamilyTheme || 'Grandstander',
        fontSize: 22,
        fill: this._hex(pixiConfig.questionTextColor || pixiConfig.textColor),
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: 400,
        align: 'left',
      },
    })
    this.questionText.anchor.set(0, 0.5)

    this.questionCounter = new PIXI.Text({
      text: '',
      style: {
        fontFamily: pixiConfig.fontFamilyTheme || 'Grandstander',
        fontSize: 14,
        fill: this._hex(pixiConfig.textLight || pixiConfig.textColor),
        fontWeight: 'bold',
      },
    })
    this.questionCounter.anchor.set(0, 0)

    this.timer = new PixiTimer({
      radius: 34,
      textColor: this._hex(pixiConfig.timerColor || pixiConfig.textColor),
      textSize: 26,
      fontFamily: pixiConfig.fontFamilyTheme || 'Grandstander',
      progressBarColor: this._hex(pixiConfig.primaryAccent || '#49C8FF'),
      progressBarWidth: 8,
      backgroundAlpha: 0.2,
      backgroundColor: 0xffffff,
    })

    this.bottomBar.addChild(this.bottomBg)
    this.questionContainer.addChild(this.questionText)
    this.questionContainer.addChild(this.questionCounter)
    this.bottomBar.addChild(this.questionContainer)
    this.bottomBar.addChild(this.leftTray)
    this.bottomBar.addChild(this.rightTray)

    this.view.addChild(this.cloudPanel)
    this.view.addChild(this.bottomBar)
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

  public setPowerupHandler(handler: (teamId: string, id: NinjaPowerupId) => void): void {
    this.onPowerupSelected = handler
  }

  public async initialize(teams: Array<{ id: string; name: string }>): Promise<void> {
    this.teamOrder = teams.map((t) => t.id)
    await this._buildTrays(teams)
    this._layoutAll()
  }

  public async showQuestion(
    questionText: string,
    imageUrl: string | undefined,
    options: NinjaAnswerOption[],
    questionDurationMs: number,
    counter: { current: number; total: number }
  ): Promise<void> {
    this.clearAnswers()
    this.questionText.text = questionText
    this.questionCounter.text = `Question ${counter.current} of ${counter.total}`

    if (this.questionImage) {
      this.questionContainer.removeChild(this.questionImage)
      this.questionImage.destroy({ children: true })
      this.questionImage = null
    }

    if (imageUrl) {
      try {
        const display = this.assetLoader.getDisplayObject(imageUrl)
        if (display) {
          const layout = this.layoutManager.getLayoutParams()
          const maxH = layout.questionImageMaxHeight
          const maxW = 120
          const scale = Math.min(maxW / Math.max(1, display.width), maxH / Math.max(1, display.height), 1)
          display.scale.set(scale)
          display.x = 0
          display.y = -display.height / 2
          this.questionImage = display
          this.questionContainer.addChild(display)
        }
      } catch {
        /* ignore */
      }
    }

    await this._buildAnswerClouds(options)
    this.updateTimerDisplay(questionDurationMs, questionDurationMs)
    this.setAnswerButtonsEnabled(true)
    this._layoutBottomBar()
  }

  public updateTimerDisplay(remainingMs: number, durationMs?: number): void {
    this.timer.updateDisplay(remainingMs, Math.max(1, durationMs ?? remainingMs))
  }

  public setAnswerButtonsEnabled(enabled: boolean): void {
    this.answersEnabled = enabled
    for (const btn of this.cloudButtons) {
      btn.container.eventMode = enabled ? 'static' : 'none'
      btn.container.alpha = enabled ? 1 : 0.7
    }
  }

  public setTeamTrays(trays: TeamTrayInfo[]): void {
    for (const tray of trays) {
      const map = this.trayButtons.get(tray.teamId)
      if (!map) continue
      for (const def of NINJA_POWERUP_DEFINITIONS) {
        const btn = map.get(def.id)
        if (!btn) continue
        const hasCharge = (tray.charges[def.id] ?? 0) > 0
        btn.enabled = tray.interactive && hasCharge
        btn.container.alpha = hasCharge ? (tray.interactive ? 1 : 0.55) : 0.3
        btn.container.eventMode = btn.enabled ? 'static' : 'none'
      }
    }
  }

  public showAnswerFeedback(correct: boolean, points: number): void {
    this.feedbackPanel.removeChildren()
    const { width, height } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()
    const text = new PIXI.Text({
      text: correct ? (points > 0 ? `+${points} CLIMB!` : 'CORRECT!') : 'MISSED!',
      style: {
        fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
        fontSize: 34,
        fontWeight: 'bold',
        fill: correct ? 0x16a34a : 0xdc2626,
        align: 'center',
        stroke: { color: 0xffffff, width: 4 },
      },
    })
    text.anchor.set(0.5)
    text.x = width / 2
    text.y = layout.skyBandHeight * 0.55
    this.feedbackPanel.addChild(text)
    setTimeout(() => {
      if (!this.destroyed) this.feedbackPanel.removeChildren()
    }, 1400)
    void height
  }

  public showPowerupFeedback(message: string): void {
    this.feedbackPanel.removeChildren()
    const { width } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()
    const text = new PIXI.Text({
      text: message,
      style: {
        fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
        fontSize: 26,
        fontWeight: 'bold',
        fill: this._hex(this.pixiConfig.primaryAccent || '#49C8FF'),
        align: 'center',
        stroke: { color: 0xffffff, width: 4 },
      },
    })
    text.anchor.set(0.5)
    text.x = width / 2
    text.y = layout.skyBandHeight * 0.5
    this.feedbackPanel.addChild(text)
    setTimeout(() => {
      if (!this.destroyed) this.feedbackPanel.removeChildren()
    }, 1200)
  }

  public promptShortcut(info: ShortcutPromptInfo): Promise<'enter' | 'skip'> {
    return new Promise((resolve) => {
      this._clearShortcutTimeout()
      this.shortcutResolve = resolve
      this.shortcutPanel.removeChildren()
      this.shortcutPanel.visible = true

      const { width, height } = this.pixiApp.getScreenSize()
      const overlay = new PIXI.Graphics()
      overlay.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.45 })
      this.shortcutPanel.addChild(overlay)

      const cardW = Math.min(420, width * 0.8)
      const cardH = 220
      const card = new PIXI.Graphics()
      card
        .roundRect(0, 0, cardW, cardH, 18)
        .fill({ color: 0xfffbeb, alpha: 0.97 })
        .stroke({ width: 4, color: 0x92400e })
      card.x = (width - cardW) / 2
      card.y = (height - cardH) / 2
      this.shortcutPanel.addChild(card)

      const title = info.kind === 'forest' ? 'Dark Forest Shortcut!' : 'Cave Shortcut!'
      const ladderPct = Math.round(info.ladderChance * 100)
      const body = new PIXI.Text({
        text:
          `${title}\n` +
          `${ladderPct}% ladder +${info.ladderDelta}  ·  ${100 - ladderPct}% snake ${info.snakeDelta}\n` +
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

      this.shortcutTimeoutId = setTimeout(() => {
        if (this.shortcutResolve) this._resolveShortcut('skip')
      }, 8000)
    })
  }

  public clearQuestionState(): void {
    this.clearAnswers()
    this.questionText.text = ''
    this.questionCounter.text = ''
    if (this.questionImage) {
      this.questionContainer.removeChild(this.questionImage)
      this.questionImage.destroy({ children: true })
      this.questionImage = null
    }
  }

  public clearAnswers(): void {
    this.cloudPanel.removeChildren()
    this.cloudButtons = []
  }

  public hideShortcutPrompt(): void {
    this._clearShortcutTimeout()
    this.shortcutPanel.visible = false
    this.shortcutPanel.removeChildren()
    this.shortcutResolve = null
  }

  public update(deltaMs: number): void {
    this.bobPhase += deltaMs * 0.003
    for (let i = 0; i < this.cloudButtons.length; i++) {
      const btn = this.cloudButtons[i]
      btn.container.y = btn.baseY + Math.sin(this.bobPhase + i) * 4
    }
  }

  private _resolveShortcut(choice: 'enter' | 'skip'): void {
    const resolve = this.shortcutResolve
    this.hideShortcutPrompt()
    resolve?.(choice)
  }

  private _clearShortcutTimeout(): void {
    if (this.shortcutTimeoutId != null) {
      clearTimeout(this.shortcutTimeoutId)
      this.shortcutTimeoutId = null
    }
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

  private async _buildAnswerClouds(options: NinjaAnswerOption[]): Promise<void> {
    this.cloudPanel.removeChildren()
    this.cloudButtons = []
    const { width } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()
    const n = options.length
    const gap = 16
    const totalW = n * layout.cloudWidth + (n - 1) * gap
    let startX = Math.max(layout.sidePadding, (width - totalW) / 2)

    let cloudTex: PIXI.Texture | null = null
    try {
      cloudTex = await PIXI.Assets.load(`${ASSET_BASE}/answer_cloud.png`)
    } catch {
      cloudTex = null
    }

    options.forEach((option, index) => {
      const container = new PIXI.Container()
      if (cloudTex) {
        const sprite = new PIXI.Sprite(cloudTex)
        sprite.anchor.set(0.5)
        sprite.width = layout.cloudWidth
        sprite.height = layout.cloudHeight
        container.addChild(sprite)
      } else {
        const g = new PIXI.Graphics()
        g.roundRect(-layout.cloudWidth / 2, -layout.cloudHeight / 2, layout.cloudWidth, layout.cloudHeight, 24)
          .fill({ color: 0xffffff, alpha: 0.92 })
          .stroke({ width: 3, color: 0x334155 })
        container.addChild(g)
      }

      const label = new PIXI.Text({
        text: option.text,
        style: {
          fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
          fontSize: layout.answerFontSize,
          fill: 0x1f2937,
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: layout.cloudWidth * 0.72,
          align: 'center',
        },
      })
      label.anchor.set(0.5)
      // Shrink if still too tall
      if (label.height > layout.cloudHeight * 0.55) {
        label.style.fontSize = Math.max(12, layout.answerFontSize - 4)
      }
      container.addChild(label)

      const x = startX + layout.cloudWidth / 2
      const y = layout.topPadding + layout.cloudHeight / 2 + 8 + (index % 2) * 12
      container.x = x
      container.y = y
      container.eventMode = 'static'
      container.cursor = 'pointer'
      container.on('pointertap', () => {
        if (!this.answersEnabled) return
        this.onAnswerSelected?.(option.id)
      })

      this.cloudPanel.addChild(container)
      this.cloudButtons.push({ container, label, option, baseY: y })
      startX += layout.cloudWidth + gap
    })
  }

  private async _buildTrays(teams: Array<{ id: string; name: string }>): Promise<void> {
    this.leftTray.removeChildren()
    this.rightTray.removeChildren()
    this.trayButtons.clear()
    const layout = this.layoutManager.getLayoutParams()
    const size = layout.powerupButtonSize

    for (let t = 0; t < Math.min(2, teams.length); t++) {
      const team = teams[t]
      const tray = t === 0 ? this.leftTray : this.rightTray
      const map = new Map<NinjaPowerupId, { container: PIXI.Container; enabled: boolean }>()

      const nameLabel = new PIXI.Text({
        text: team.name,
        style: {
          fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
          fontSize: 12,
          fill: this._hex(this.pixiConfig.textColor),
          fontWeight: 'bold',
        },
      })
      nameLabel.y = -18
      if (t === 1) nameLabel.anchor.set(1, 0)
      tray.addChild(nameLabel)

      for (let i = 0; i < NINJA_POWERUP_DEFINITIONS.length; i++) {
        const def = NINJA_POWERUP_DEFINITIONS[i]
        const container = new PIXI.Container()
        const bg = new PIXI.Graphics()
        bg.roundRect(0, 0, size, size, 10)
          .fill({ color: 0x1f2937, alpha: 0.9 })
          .stroke({ width: 2, color: 0xfbbf24 })
        container.addChild(bg)

        try {
          const tex = await PIXI.Assets.load(`${ASSET_BASE}/icon_${def.id}.png`)
          const icon = new PIXI.Sprite(tex)
          icon.anchor.set(0.5)
          icon.width = size * 0.62
          icon.height = size * 0.62
          icon.x = size / 2
          icon.y = size / 2 - 4
          container.addChild(icon)
        } catch {
          /* ignore */
        }

        const keyLabel = new PIXI.Text({
          text: def.hotkey,
          style: {
            fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
            fontSize: 11,
            fill: 0xffffff,
            fontWeight: 'bold',
          },
        })
        keyLabel.anchor.set(0.5)
        keyLabel.x = size / 2
        keyLabel.y = size - 9
        container.addChild(keyLabel)

        container.x = t === 0 ? i * (size + 6) : -(i + 1) * (size + 6)
        container.y = 0
        container.eventMode = 'static'
        container.cursor = 'pointer'
        container.on('pointertap', () => {
          const btn = map.get(def.id)
          if (!btn?.enabled) return
          this.onPowerupSelected?.(team.id, def.id)
        })

        tray.addChild(container)
        map.set(def.id, { container, enabled: false })
      }
      this.trayButtons.set(team.id, map)
    }
  }

  private _layoutAll(): void {
    this._layoutBottomBar()
    const { width } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()
    this.timer.x = width - layout.sidePadding - layout.timerRadius - 8
    this.timer.y = layout.topPadding + layout.timerRadius + 4
  }

  private _layoutBottomBar(): void {
    const { width, height } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()

    this.bottomBar.y = height - layout.bottomBarHeight
    this.bottomBg.clear()
    this.bottomBg.rect(0, 0, width, layout.bottomBarHeight).fill({ color: 0xffffff, alpha: 0.96 })

    const trayWidth =
      NINJA_POWERUP_DEFINITIONS.length * (layout.powerupButtonSize + 6) + layout.trayPadding
    this.leftTray.x = layout.sidePadding + layout.trayPadding
    this.leftTray.y = layout.bottomBarHeight / 2 - layout.powerupButtonSize / 2 + 6
    this.rightTray.x = width - layout.sidePadding - layout.trayPadding
    this.rightTray.y = layout.bottomBarHeight / 2 - layout.powerupButtonSize / 2 + 6

    const leftEdge = trayWidth + layout.sidePadding + 8
    const rightEdge = width - trayWidth - layout.sidePadding - 8
    const available = Math.max(200, rightEdge - leftEdge)

    this.questionContainer.x = leftEdge
    this.questionContainer.y = layout.bottomBarHeight / 2

    const imageW = this.questionImage ? this.questionImage.width + 12 : 0
    this.questionText.x = imageW
    this.questionText.y = -8
    this.questionText.style.fontSize = layout.questionFontSize
    this.questionText.style.wordWrapWidth = Math.max(160, available - imageW - 16)
    this.questionCounter.x = imageW
    this.questionCounter.y = 22
    this.questionCounter.style.fontSize = layout.questionCounterFontSize
  }

  private _onResize = (): void => {
    if (this.destroyed) return
    const { width, height } = this.pixiApp.getScreenSize()
    this.layoutManager.updateLayout(width, height)
    this._layoutAll()
    // Reposition clouds if present
    if (this.cloudButtons.length > 0) {
      const options = this.cloudButtons.map((b) => b.option)
      void this._buildAnswerClouds(options)
    }
  }

  private _onTimerTick = (payload: TimerEventPayload): void => {
    if (payload.timerId !== QUESTION_TIMER_ID) return
    this.updateTimerDisplay(payload.remaining ?? 0, payload.duration)
  }

  private _hex(color: string | number): number {
    if (typeof color === 'number') return color
    const cleaned = color.replace('#', '')
    return parseInt(
      cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned,
      16
    )
  }

  public destroy(): void {
    this.destroyed = true
    this._clearShortcutTimeout()
    this.eventBus.off(ENGINE_EVENTS.RESIZED, this._onResize)
    this.eventBus.off(TIMER_EVENTS.TIMER_TICK, this._onTimerTick)
    this.view.destroy({ children: true })
  }
}
