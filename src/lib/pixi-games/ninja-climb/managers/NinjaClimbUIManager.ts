import * as PIXI from 'pixi.js'
import { EventBus } from '@/lib/pixi-engine/core/EventBus'
import { ENGINE_EVENTS, TIMER_EVENTS, TimerEventPayload } from '@/lib/pixi-engine/core/EventTypes'
import type { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication'
import type { PixiSpecificConfig } from '@/lib/themes'
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader'
import { AnswerCloudShape } from '@/lib/pixi-engine/fx/AnswerCloudShape'
import { PixiTimer } from '@/lib/pixi-games/multiple-choice/ui/PixiTimer'
import type { NinjaClimbLayoutManager } from './NinjaClimbLayoutManager'
import type { NinjaPowerupId } from '../ninjaPowerups'
import { NINJA_POWERUP_DEFINITIONS } from '../ninjaPowerups'
import type { ShortcutKind } from './NinjaClimbRaceManager'

const ASSET_BASE = '/images/ninja-climb'
export const QUESTION_TIMER_ID = 'ninja-climb-question-timer'
const TIMER_BASE_RADIUS = 52

export interface NinjaAnswerOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface ShortcutPromptInfo {
  kind: ShortcutKind
  ladderChance: number
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
  private questionImage: PIXI.Sprite | null = null
  private cloudPanel: PIXI.Container
  private feedbackPanel: PIXI.Container
  private shortcutPanel: PIXI.Container
  private leftTray: PIXI.Container
  private rightTray: PIXI.Container
  private cloudButtons: Array<{
    container: PIXI.Container
    label: PIXI.Text
    option: NinjaAnswerOption
    baseX: number
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
      radius: TIMER_BASE_RADIUS,
      textColor: this._hex(pixiConfig.timerColor || pixiConfig.textColor),
      textSize: 40,
      fontFamily: pixiConfig.fontFamilyTheme || 'Grandstander',
      progressBarColor: this._hex(pixiConfig.primaryAccent || '#49C8FF'),
      progressBarWidth: 11,
      backgroundAlpha: 1,
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

    this._clearQuestionImage()

    if (imageUrl) {
      try {
        const display = this.assetLoader.getDisplayObject(imageUrl)
        if (display) {
          const layout = this.layoutManager.getLayoutParams()
          const maxH = layout.questionImageMaxHeight
          const maxW = layout.questionImageMaxWidth
          const scale = Math.min(
            maxW / Math.max(1, display.width),
            maxH / Math.max(1, display.height),
            1
          )
          display.scale.set(scale)
          display.anchor.set(0.5)
          display.x = display.width / 2
          display.y = -display.height * 0.22
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
    this._layoutAll()
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

      const cardW = Math.min(320, width * 0.78)
      const cardH = 280
      const card = new PIXI.Graphics()
      card
        .roundRect(0, 0, cardW, cardH, 18)
        .fill({ color: 0xfffbeb, alpha: 0.97 })
        .stroke({ width: 4, color: 0x92400e })
      card.x = (width - cardW) / 2
      card.y = (height - cardH) / 2
      this.shortcutPanel.addChild(card)

      const cx = width / 2
      const pieY = card.y + 88
      const pieR = 48
      const ladderPct = Math.max(0, Math.min(1, info.ladderChance))
      const pie = this._makeChancePie(pieR, ladderPct)
      pie.x = cx
      pie.y = pieY
      this.shortcutPanel.addChild(pie)

      const fwdLabel = new PIXI.Text({
        text: `${Math.round(ladderPct * 100)}% ↑`,
        style: {
          fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
          fontSize: 13,
          fill: 0x15803d,
          fontWeight: 'bold',
        },
      })
      fwdLabel.anchor.set(0.5)
      fwdLabel.x = cx - 70
      fwdLabel.y = pieY + pieR + 18
      this.shortcutPanel.addChild(fwdLabel)

      const backLabel = new PIXI.Text({
        text: `${Math.round((1 - ladderPct) * 100)}% ↓`,
        style: {
          fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
          fontSize: 13,
          fill: 0xb91c1c,
          fontWeight: 'bold',
        },
      })
      backLabel.anchor.set(0.5)
      backLabel.x = cx + 70
      backLabel.y = pieY + pieR + 18
      this.shortcutPanel.addChild(backLabel)

      const prompt = new PIXI.Text({
        text: 'Take a chance?',
        style: {
          fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
          fontSize: 22,
          fill: 0x1f2937,
          fontWeight: 'bold',
          align: 'center',
        },
      })
      prompt.anchor.set(0.5)
      prompt.x = cx
      prompt.y = card.y + cardH - 88
      this.shortcutPanel.addChild(prompt)

      const yesBtn = this._makeCircleChoiceButton(0x16a34a, '✓', () =>
        this._resolveShortcut('enter')
      )
      const noBtn = this._makeCircleChoiceButton(0xdc2626, '✕', () =>
        this._resolveShortcut('skip')
      )
      yesBtn.x = cx - 52
      noBtn.x = cx + 52
      yesBtn.y = card.y + cardH - 42
      noBtn.y = card.y + cardH - 42
      this.shortcutPanel.addChild(yesBtn)
      this.shortcutPanel.addChild(noBtn)

      this.shortcutTimeoutId = setTimeout(() => {
        if (this.shortcutResolve) this._resolveShortcut('skip')
      }, 8000)
    })
  }

  /** Green slice = move forward, red slice = go back. Starts at 12 o'clock. */
  private _makeChancePie(radius: number, ladderChance: number): PIXI.Container {
    const c = new PIXI.Container()
    const g = new PIXI.Graphics()
    const start = -Math.PI / 2
    const ladderAngle = Math.max(0.001, ladderChance * Math.PI * 2)
    const snakeAngle = Math.max(0.001, (1 - ladderChance) * Math.PI * 2)

    g.moveTo(0, 0)
    g.arc(0, 0, radius, start, start + ladderAngle)
    g.lineTo(0, 0)
    g.fill({ color: 0x22c55e })

    g.moveTo(0, 0)
    g.arc(0, 0, radius, start + ladderAngle, start + ladderAngle + snakeAngle)
    g.lineTo(0, 0)
    g.fill({ color: 0xef4444 })

    g.circle(0, 0, radius).stroke({ width: 3, color: 0x1f2937 })
    c.addChild(g)
    return c
  }

  private _makeCircleChoiceButton(
    color: number,
    glyph: string,
    onClick: () => void
  ): PIXI.Container {
    const c = new PIXI.Container()
    const bg = new PIXI.Graphics()
    bg.circle(0, 0, 26).fill({ color }).stroke({ width: 3, color: 0x111827 })
    const text = new PIXI.Text({
      text: glyph,
      style: {
        fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
        fontSize: 26,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    })
    text.anchor.set(0.5)
    c.addChild(bg)
    c.addChild(text)
    c.eventMode = 'static'
    c.cursor = 'pointer'
    c.on('pointertap', onClick)
    return c
  }

  public clearQuestionState(): void {
    this.clearAnswers()
    this.questionText.text = ''
    this.questionCounter.text = ''
    this._clearQuestionImage()
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
      // Clouds drift side to side instead of bobbing vertically.
      btn.container.x = btn.baseX + Math.sin(this.bobPhase + i * 1.4) * 7
      btn.container.y = btn.baseY
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

  private async _buildAnswerClouds(options: NinjaAnswerOption[]): Promise<void> {
    this.cloudPanel.removeChildren()
    this.cloudButtons = []
    const { width } = this.pixiApp.getScreenSize()
    const layout = this.layoutManager.getLayoutParams()
    const n = options.length

    // Keep clear of the React score panel (left) and nav + timer (right).
    const leftReserve = 200
    const rightReserve = Math.max(
      layout.timerRadius * 2 + layout.sidePadding + 24,
      180
    )
    const available = Math.max(240, width - leftReserve - rightReserve)

    let cloudW = layout.cloudWidth
    let cloudH = layout.cloudHeight
    let gap = 12
    // Staggered rows let neighbouring clouds overlap up to 22% horizontally.
    const overlapFraction = 0.22
    let totalW = n * cloudW + (n - 1) * gap
    if (totalW > available && n > 1) {
      gap = (available - n * cloudW) / (n - 1)
      const minGap = -overlapFraction * cloudW
      if (gap < minGap) {
        const fit = available / (n * cloudW + (n - 1) * minGap)
        cloudW = Math.round(cloudW * fit)
        cloudH = Math.round(cloudH * fit)
        gap = (available - n * cloudW) / (n - 1)
      }
      totalW = n * cloudW + (n - 1) * gap
    }
    let startX = leftReserve + Math.max(0, (available - totalW) / 2)

    options.forEach((option, index) => {
      const container = new PIXI.Container()
      const cloud = new AnswerCloudShape({
        width: cloudW,
        height: cloudH,
        seed: index * 17 + 3,
      })
      container.addChild(cloud)

      const label = new PIXI.Text({
        text: option.text,
        style: {
          fontFamily: this.pixiConfig.fontFamilyTheme || 'Grandstander',
          fontSize: layout.answerFontSize,
          fill: 0x1f2937,
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: cloud.textSafeWidth,
          align: 'center',
        },
      })
      label.anchor.set(0.5)
      if (label.height > cloud.textSafeHeight) {
        label.style.fontSize = Math.max(12, layout.answerFontSize - 4)
      }
      container.addChild(label)

      // Alternate rows: odd clouds sit half a cloud lower so overlapped
      // neighbours stay readable.
      const x = startX + cloudW / 2
      const y = layout.topPadding + cloudH / 2 + 8 + (index % 2) * cloudH * 0.5
      container.x = x
      container.y = y
      container.zIndex = index % 2 === 0 ? 2 : 1
      container.eventMode = 'static'
      container.cursor = 'pointer'
      container.on('pointertap', () => {
        if (!this.answersEnabled) return
        this.onAnswerSelected?.(option.id)
      })

      this.cloudPanel.addChild(container)
      this.cloudButtons.push({ container, label, option, baseX: x, baseY: y })
      startX += cloudW + gap
    })
    this.cloudPanel.sortableChildren = true
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
    this.timer.resize(layout.timerRadius / TIMER_BASE_RADIUS)
    this.timer.x = width - layout.sidePadding - layout.timerRadius - 8
    this.timer.y = layout.timerNavClearance + layout.timerRadius
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

    const leftEdge = trayWidth + layout.sidePadding + layout.questionImageGap
    const rightEdge = width - trayWidth - layout.sidePadding - layout.questionImageGap
    const available = Math.max(200, rightEdge - leftEdge)

    this.questionContainer.x = leftEdge
    this.questionContainer.y = layout.bottomBarHeight / 2

    const imageW = this.questionImage ? this.questionImage.width + 20 : 0
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

  private _clearQuestionImage(): void {
    if (this.questionImage) {
      this.questionContainer.removeChild(this.questionImage)
      this.questionImage.destroy({ children: true })
      this.questionImage = null
    }
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
