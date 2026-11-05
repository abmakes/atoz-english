import {
  Application,
  Circle,
  Container,
  Graphics,
  Rectangle,
  Text,
  type FederatedPointerEvent,
  type Ticker,
} from 'pixi.js'
import { ensureFontIsLoaded } from '@/lib/pixi-engine/utils/ensureFontIsLoaded'
import type { GrammarFocus } from '@/lib/pixi-games/sentence-builder/content'
import {
  biteQuestions,
  swimFrames,
  swimVocabulary,
  type BiteKind,
  type BiteQuestion,
  type ChomperMode,
  type PlayerCount,
  type SwimFrame,
} from './content'
import {
  BITE_ROUND_MS,
  BITE_ROUNDS,
  STUN_MS,
  SWIM_ROUND_MS,
  SWIM_ROUNDS,
  swimMatch,
  takeRoundQueue,
} from './round'

const INK = 0x114257
const PAPER = 0xf7fbff
const WATER = 0xd7f0fb
const GOOD = 0xdcfce7
const GOOD_INK = 0x15803d
const BAD = 0xdc2626
const ANGLES = (Math.PI * 2) / 10
const PULSE = (Math.PI * 2) / 4
const PLAYER_COLORS = [0xff6b6b, 0x14919b, 0xe09b12, 0x7c5cbf]

type TableEdge = 'bottom' | 'top' | 'left' | 'right'

const SEATS: Record<PlayerCount, { x: number; y: number; edge: TableEdge }[]> = {
  2: [
    { x: 0.18, y: 0.74, edge: 'bottom' },
    { x: 0.82, y: 0.26, edge: 'top' },
  ],
  3: [
    { x: 0.22, y: 0.82, edge: 'bottom' },
    { x: 0.84, y: 0.58, edge: 'right' },
    { x: 0.24, y: 0.28, edge: 'top' },
  ],
  4: [
    { x: 0.18, y: 0.82, edge: 'bottom' },
    { x: 0.84, y: 0.78, edge: 'right' },
    { x: 0.16, y: 0.22, edge: 'left' },
    { x: 0.82, y: 0.18, edge: 'top' },
  ],
}

const JOYSTICKS: Record<PlayerCount, { x: number; y: number }[]> = {
  2: [
    { x: 0.1, y: 0.88 },
    { x: 0.9, y: 0.12 },
  ],
  3: [
    { x: 0.14, y: 0.86 },
    { x: 0.88, y: 0.78 },
    { x: 0.16, y: 0.14 },
  ],
  4: [
    { x: 0.12, y: 0.88 },
    { x: 0.88, y: 0.88 },
    { x: 0.12, y: 0.12 },
    { x: 0.88, y: 0.12 },
  ],
}

interface Token {
  view: Container
  shadow: Graphics
  body: Graphics
  label: Text
  text: string
  correct: boolean
  power: 'reverse' | 'skip' | null
  x: number
  y: number
  hw: number
  hh: number
  angle: number
  phase: number
  near: boolean
  good: boolean
  heading: number
  speed: number
  goneUntil: number
  hidden: boolean
}

interface Chomper {
  index: number
  name: string
  color: number
  score: number
  anchorX: number
  anchorY: number
  dir: number
  view: Container
  facing: Container
  face: Graphics
  badge: Container
  badgeBg: Graphics
  badgeText: Text
  mouth: number
  stunUntil: number
  missUntil: number
  lunge: { t0: number; dir: number; hit: boolean } | null
  x: number
  y: number
  jx: number
  jy: number
  pointerId: number
  seq: string[]
  built: number
  done: Set<string>
  lockUntil: number
  joy: Container
  knob: Graphics
  slots: Container
  edge: TableEdge
}

export interface WordChompersOptions {
  mode: ChomperMode
  focus: GrammarFocus
  biteKind: BiteKind
  players: PlayerCount
  sounds: boolean
}

export interface WordChompersHooks {
  onStatus?: (text: string) => void
}

type Phase = 'countdown' | 'bite' | 'swim' | 'toast' | 'final'

function mixWhite(color: number, amount: number): number {
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount)
  return (mix((color >> 16) & 255) << 16) | (mix((color >> 8) & 255) << 8) | mix(color & 255)
}

function shade(color: number, amount: number): number {
  const mix = (channel: number) => Math.round(channel * (1 - amount))
  return (mix((color >> 16) & 255) << 16) | (mix((color >> 8) & 255) << 8) | mix(color & 255)
}

function tableRotation(y: number, height: number): number {
  const mid = height * 0.5
  const band = Math.max(24, height * 0.06)
  if (y <= mid - band) return Math.PI
  if (y >= mid + band) return 0
  return ((mid + band - y) / (band * 2)) * Math.PI
}

function drawChomper(graphics: Graphics, color: number, open: number, flash: boolean) {
  const belly = mixWhite(color, 0.45)
  const dark = shade(color, 0.22)
  graphics.clear()
  graphics.ellipse(0, 34, 18, 7).fill({ color: INK, alpha: 0.13 })
  graphics.poly([-16, -6, -40, -18, -28, 0, -40, 18, -16, 6]).fill(dark)
  graphics.circle(-4, -30, 11).fill(color)
  graphics.circle(14, -31, 11).fill(color)
  graphics.circle(-4, -30, 6).fill(belly)
  graphics.circle(14, -31, 6).fill(belly)
  graphics.circle(0, 0, 32).fill(color).stroke({ width: 3, color: INK })
  graphics.ellipse(8, 10, 14, 12).fill(belly)
  graphics.circle(12, -6, 7).fill(0xffffff).stroke({ width: 2, color: INK })
  graphics.circle(25, -4, 7).fill(0xffffff).stroke({ width: 2, color: INK })
  graphics.circle(14, -5, 3).fill(INK)
  graphics.circle(27, -3, 3).fill(INK)
  graphics.circle(6, 8, 4).fill({ color: 0xff8fa3, alpha: 0.75 })
  const mouthW = 7 + open * 14
  const mouthH = 4 + open * 10
  graphics.ellipse(30, 12, mouthW, mouthH).fill(0x3a2418)
  if (open > 0.35) graphics.ellipse(30, 10, mouthW * 0.45, mouthH * 0.35).fill(0xffb7c5)
  if (flash) graphics.circle(0, 0, 38).stroke({ width: 5, color: BAD })
}

export class WordChompersGame {
  sounds: boolean
  over = false

  private readonly handleTick: (ticker: Ticker) => void
  private readonly handleResize: () => void
  private destroyed = false
  private built = false
  private ticking = false
  private paused = false
  private now = 0
  private phase: Phase = 'countdown'
  private phaseUntil = 0
  private countdownStep = 0
  private roundIndex = 0
  private globalDir = 1
  private pendingSkip = false
  private immuneUntil = 0
  private stretch = 150
  private lastW = 0
  private lastH = 0
  private resolution = 1
  private bannerUntil: number | null = null
  private aim: Chomper | null = null
  private biteQueue: BiteQuestion[] = []
  private swimQueue: SwimFrame[] = []
  private question: BiteQuestion | null = null
  private swimFrame: SwimFrame | null = null
  private vocab: string[] = []
  private missed: string[] = []
  private words: Token[] = []
  private players: Chomper[] = []
  private audioContext: AudioContext | null = null

  private bg!: Graphics
  private bubbles!: Graphics
  private world!: Container
  private hud!: Container
  private clueTop!: Container
  private clueBottom!: Container
  private clueTopText!: Text
  private clueBottomText!: Text
  private clueTopHint!: Text
  private clueBottomHint!: Text
  private clueTopBg!: Graphics
  private clueBottomBg!: Graphics
  private clueTopShadow!: Graphics
  private clueBottomShadow!: Graphics
  private dots!: Graphics
  private timerView!: Container
  private timerTrack!: Graphics
  private timerArc!: Graphics
  private timerText!: Text
  private banner!: Container
  private bannerBg!: Graphics
  private bannerShadow!: Graphics
  private bannerTop!: Text
  private bannerBottom!: Text
  private finalView!: Container

  constructor(
    private readonly app: Application,
    private readonly options: WordChompersOptions,
    private readonly hooks: WordChompersHooks = {}
  ) {
    this.sounds = options.sounds
    this.handleTick = (ticker) => this.update(ticker)
    this.handleResize = () => {
      if (!this.destroyed && this.built) this.layout()
    }
  }

  async init() {
    await ensureFontIsLoaded('Grandstander', '700 32px')
    if (this.destroyed) return
    this.resolution = Math.min(window.devicePixelRatio || 1, 2)
    this.prepareQueue()
    this.buildStage()
    this.buildPlayers()
    this.layout()
    this.app.renderer.on('resize', this.handleResize)
    this.app.ticker.add(this.handleTick)
    this.ticking = true
    this.built = true
    this.beginRound()
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    if (this.ticking) this.app.ticker.remove(this.handleTick)
    if (this.built) this.app.renderer.off('resize', this.handleResize)
    this.app.stage.removeAllListeners()
    window.speechSynthesis?.cancel()
    void this.audioContext?.close()
    if (!this.built) return
    this.bg.destroy()
    this.world.destroy({ children: true })
    this.hud.destroy({ children: true })
  }

  setPaused(paused: boolean) {
    this.paused = paused
  }

  private prepareQueue() {
    if (this.options.mode === 'bite') {
      this.biteQueue = takeRoundQueue(biteQuestions(this.options.focus, this.options.biteKind), BITE_ROUNDS)
    } else {
      this.swimQueue = takeRoundQueue(swimFrames(this.options.focus), SWIM_ROUNDS)
    }
  }

  private buildStage() {
    this.bg = new Graphics()
    this.bubbles = new Graphics()
    this.world = new Container()
    this.world.sortableChildren = true
    this.hud = new Container()
    this.app.stage.addChild(this.bg, this.bubbles, this.world, this.hud)
    this.app.stage.eventMode = 'static'
    this.app.stage.on('pointerdown', (event) => this.onTap(event))

    this.clueTopShadow = new Graphics()
    this.clueTopBg = new Graphics()
    this.clueTopText = this.makeLabel('', 30)
    this.clueTopHint = this.makeLabel('', 16)
    this.clueTopHint.visible = false
    this.clueTop = new Container()
    this.clueTop.addChild(this.clueTopShadow, this.clueTopBg, this.clueTopText, this.clueTopHint)
    this.clueBottomShadow = new Graphics()
    this.clueBottomBg = new Graphics()
    this.clueBottomText = this.makeLabel('', 30)
    this.clueBottomHint = this.makeLabel('', 16)
    this.clueBottomHint.visible = false
    this.clueBottom = new Container()
    this.clueBottom.addChild(this.clueBottomShadow, this.clueBottomBg, this.clueBottomText, this.clueBottomHint)

    this.dots = new Graphics()
    this.timerTrack = new Graphics()
    this.timerArc = new Graphics()
    this.timerText = this.makeLabel('', 26)
    this.timerView = new Container()
    this.timerView.addChild(this.timerTrack, this.timerArc, this.timerText)
    this.timerView.visible = false
    this.bannerShadow = new Graphics()
    this.bannerBg = new Graphics()
    this.bannerTop = this.makeLabel('', 26)
    this.bannerBottom = this.makeLabel('', 26)
    this.banner = new Container()
    this.banner.addChild(this.bannerShadow, this.bannerBg, this.bannerTop, this.bannerBottom)
    this.banner.visible = false
    this.finalView = new Container()
    this.finalView.visible = false
    this.hud.addChild(this.clueTop, this.clueBottom, this.dots, this.timerView, this.banner, this.finalView)
  }

  private buildPlayers() {
    const swim = this.options.mode === 'swim'
    SEATS[this.options.players].forEach((seat, index) => {
      const color = PLAYER_COLORS[index]
      const view = new Container()
      view.eventMode = 'none'
      view.zIndex = 3
      const facing = new Container()
      const face = new Graphics()
      facing.addChild(face)
      view.addChild(facing)

      const badge = new Container()
      badge.eventMode = 'none'
      badge.zIndex = 6
      const badgeBg = new Graphics()
      const badgeText = this.makeLabel('1', 20)
      badge.addChild(badgeBg, badgeText)

      const joy = new Container()
      joy.eventMode = swim ? 'static' : 'none'
      joy.visible = swim
      joy.zIndex = 5
      joy.hitArea = new Circle(0, 0, 54)
      const joyBg = new Graphics()
      joyBg.circle(0, 0, 50).fill({ color: 0xffffff, alpha: 0.82 }).stroke({ width: 4, color })
      const knob = new Graphics()
      knob.circle(0, 0, 18).fill(color)
      joy.addChild(joyBg, knob)

      const slots = new Container()
      slots.eventMode = 'none'
      slots.visible = swim
      slots.zIndex = 4

      const player: Chomper = {
        index,
        name: `Player ${index + 1}`,
        color,
        score: 0,
        anchorX: 0,
        anchorY: 0,
        dir: 0,
        view,
        facing,
        face,
        badge,
        badgeBg,
        badgeText,
        mouth: 0,
        stunUntil: 0,
        missUntil: 0,
        lunge: null,
        x: 0,
        y: 0,
        jx: 0,
        jy: 0,
        pointerId: -1,
        seq: [],
        built: 0,
        done: new Set(),
        lockUntil: 0,
        joy,
        knob,
        slots,
        edge: seat.edge,
      }
      drawChomper(face, color, 0, false)
      this.paintBadge(player)
      joy.on('pointerdown', (event) => this.onJoyDown(player, event))
      this.world.addChild(view, badge, joy, slots)
      this.players.push(player)
    })
  }

  private makeLabel(text: string, size: number) {
    const label = new Text({
      text,
      resolution: this.resolution,
      style: {
        fontFamily: 'Grandstander',
        fontSize: size,
        fontWeight: '700',
        fill: INK,
        align: 'center',
      },
    })
    label.anchor.set(0.5)
    return label
  }

  private layout() {
    const width = this.app.screen.width
    const height = this.app.screen.height
    if (width < 10 || height < 10) return
    this.stretch = Math.max(120, Math.min(190, Math.min(width, height) * 0.34))
    this.app.stage.hitArea = new Rectangle(0, 0, width, height)
    const seats = SEATS[this.options.players]
    const joys = JOYSTICKS[this.options.players]
    this.players.forEach((player, index) => {
      const homeX = seats[index].x * width
      const homeY = seats[index].y * height
      if (this.options.mode === 'swim' && this.phase === 'swim' && this.lastW > 0) {
        player.x = (player.x / this.lastW) * width
        player.y = (player.y / this.lastH) * height
      } else if (this.phase !== 'swim') {
        player.x = homeX
        player.y = homeY
      }
      player.anchorX = homeX
      player.anchorY = homeY
      player.joy.position.set(joys[index].x * width, joys[index].y * height)
      this.placeSlots(player)
      const centerX = width / 2
      const centerY = height / 2
      player.dir = Math.atan2(centerY - player.anchorY, centerX - player.anchorX)
      if (this.phase !== 'swim') player.view.position.set(player.x, player.y)
    })
    this.drawBackground()
    this.layoutClues()
    this.layoutTimer()
    if (this.phase === 'bite') this.updateBiteWords(0)
    if (this.phase === 'final') this.drawFinal()
    this.lastW = width
    this.lastH = height
  }

  private drawBackground() {
    const width = this.app.screen.width
    const height = this.app.screen.height
    this.bg.clear()
    if (this.options.mode === 'bite') {
      this.bg.rect(0, 0, width, height).fill(PAPER)
      this.bg.circle(width * 0.08, height * 0.1, width * 0.2).fill({ color: 0xbae6fd, alpha: 0.45 })
      this.bg.circle(width * 0.92, height * 0.12, width * 0.18).fill({ color: 0xddd0ff, alpha: 0.35 })
      this.bg.ellipse(width / 2, height / 2, width * 0.34, height * 0.28).fill(0xe7f5ff)
      this.bg.ellipse(width / 2, height / 2, width * 0.34, height * 0.28).stroke({ width: 8, color: 0xc5e4f7 })
      for (const player of this.players) {
        this.bg.circle(player.anchorX, player.anchorY, 58).fill({ color: player.color, alpha: 0.16 })
      }
      this.bubbles.visible = false
      return
    }
    this.bg.rect(0, 0, width, height).fill(WATER)
    this.bg.circle(width * 0.2, height * 0.25, 90).fill({ color: 0xffffff, alpha: 0.28 })
    this.bg.circle(width * 0.78, height * 0.7, 120).fill({ color: 0xffffff, alpha: 0.2 })
    this.bubbles.visible = true
    this.drawBubbles()
  }

  private drawBubbles() {
    const width = this.app.screen.width
    const height = this.app.screen.height
    this.bubbles.clear()
    const seeds = [
      [0.18, 0.3, 7],
      [0.72, 0.42, 11],
      [0.4, 0.62, 6],
      [0.84, 0.55, 8],
      [0.28, 0.78, 10],
    ] as const
    for (const [x, y, radius] of seeds) {
      const drift = ((this.now / 40 + y * 200) % (height * 0.7)) / height
      this.bubbles.circle(x * width, ((y + 1 - drift) % 1) * height, radius).fill({ color: 0xffffff, alpha: 0.55 })
      this.bubbles.circle(x * width - 2, ((y + 1 - drift) % 1) * height - 2, 2).fill({ color: 0xffffff, alpha: 0.9 })
    }
  }

  private placeSlots(player: Chomper) {
    const width = this.app.screen.width
    const height = this.app.screen.height
    if (player.edge === 'bottom') {
      const x = this.options.players === 2 ? width / 2 : width * 0.24
      player.slots.position.set(x, height - 46)
      player.slots.rotation = 0
      return
    }
    if (player.edge === 'top') {
      const x = this.options.players === 2 ? width / 2 : this.options.players === 4 ? width * 0.76 : width / 2
      const y = this.options.players === 4 ? 48 : 46
      player.slots.position.set(x, y)
      player.slots.rotation = Math.PI
      return
    }
    if (player.edge === 'left') {
      player.slots.position.set(48, height * 0.5)
      player.slots.rotation = Math.PI / 2
      return
    }
    player.slots.position.set(width - 48, height * 0.5)
    player.slots.rotation = -Math.PI / 2
  }

  private layoutClues() {
    this.placeClue(this.clueTop, this.clueTopShadow, this.clueTopBg, this.clueTopText, this.clueTopHint, true)
    this.placeClue(this.clueBottom, this.clueBottomShadow, this.clueBottomBg, this.clueBottomText, this.clueBottomHint, false)
  }

  private placeClue(card: Container, shadow: Graphics, bg: Graphics, title: Text, hint: Text, top: boolean) {
    const width = this.app.screen.width
    const height = this.app.screen.height
    const swim = hint.visible
    const maxWidth = swim ? Math.min(width * 0.26, 210) : Math.min(width * 0.8, 860)
    title.style.wordWrap = true
    title.style.wordWrapWidth = maxWidth - 28
    hint.style.wordWrap = true
    hint.style.wordWrapWidth = maxWidth - 28
    const gap = swim ? 6 : 0
    const stackH = swim ? title.height + gap + hint.height : title.height
    const cardW = Math.min(maxWidth, Math.max(120, Math.max(title.width, swim ? hint.width : 0) + 28))
    const cardH = stackH + (swim ? 16 : 22)
    shadow.clear()
    shadow.roundRect(-cardW / 2 + 4, -cardH / 2 + 4, cardW, cardH, 18).fill(INK)
    bg.clear()
    bg.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 18).fill(0xffffff).stroke({ width: 3, color: INK })
    if (swim) {
      title.position.set(0, -stackH / 2 + title.height / 2)
      hint.position.set(0, stackH / 2 - hint.height / 2)
    } else {
      title.position.set(0, 0)
    }
    const marginX = 36
    const marginY = 28
    const besideStick = swim && this.options.players === 2
    const cardX = besideStick ? (top ? marginX + cardW / 2 : width - marginX - cardW / 2) : width / 2
    const cardY = top ? marginY + cardH / 2 : height - marginY - cardH / 2
    card.position.set(cardX, cardY)
    card.rotation = top ? Math.PI : 0
  }

  private setClue(text: string) {
    this.clueTopText.style.fontSize = 30
    this.clueBottomText.style.fontSize = 30
    this.clueTopHint.visible = false
    this.clueBottomHint.visible = false
    this.clueTopText.text = text
    this.clueBottomText.text = text
    this.layoutClues()
  }

  private setSwimClue() {
    const frame = this.swimFrame
    if (!frame) return
    this.clueTopText.style.fontSize = 20
    this.clueBottomText.style.fontSize = 20
    this.clueTopHint.style.fontSize = 13
    this.clueBottomHint.style.fontSize = 13
    this.clueTopText.text = frame.title
    this.clueBottomText.text = frame.title
    this.clueTopHint.text = frame.hint
    this.clueBottomHint.text = frame.hint
    this.clueTopHint.visible = true
    this.clueBottomHint.visible = true
    this.layoutClues()
  }

  private beginRound() {
    if (this.destroyed) return
    const total = this.options.mode === 'bite' ? this.biteQueue.length : this.swimQueue.length
    if (this.roundIndex >= total) {
      this.showFinal()
      return
    }
    this.clearTokens()
    this.banner.visible = false
    this.bannerUntil = null
    this.globalDir = 1
    this.immuneUntil = 0
    this.finalView.visible = false
    this.clueTop.visible = true
    this.clueBottom.visible = true
    this.dots.visible = true
    this.timerView.visible = false
    for (const player of this.players) {
      player.lunge = null
      player.mouth = 0
      player.stunUntil = 0
      player.view.alpha = 1
      player.view.visible = true
      player.badge.visible = true
      this.paintChomper(player)
      if (this.options.mode === 'swim') {
        player.seq = []
        player.built = 0
        player.done = new Set()
        player.lockUntil = 0
        player.jx = 0
        player.jy = 0
        player.knob.position.set(0, 0)
        player.x = player.anchorX
        player.y = player.anchorY
        player.slots.visible = true
      }
    }
    if (this.options.mode === 'bite') {
      this.question = this.biteQueue[this.roundIndex]
      this.setClue(this.question.clue)
      this.aim = this.pickAim()
      this.hooks.onStatus?.(`Round ${this.roundIndex + 1}. ${this.question.clue.split('___').join('blank')}`)
      this.speak(this.question.clue)
    } else {
      this.swimFrame = this.swimQueue[this.roundIndex]
      this.vocab = swimVocabulary(this.swimFrame)
      this.setSwimClue()
      for (const player of this.players) this.syncSlots(player)
      this.hooks.onStatus?.(`${this.swimFrame.title}. ${this.swimFrame.hint}`)
      this.speak(`${this.swimFrame.title}. ${this.swimFrame.hint}`)
    }
    this.phase = 'countdown'
    this.countdownStep = 0
    this.phaseUntil = this.now + 650
    this.drawDots(0)
  }

  private pickAim() {
    if (!this.pendingSkip) return this.players[Math.floor(Math.random() * this.players.length)]
    this.pendingSkip = false
    const lowest = Math.min(...this.players.map((player) => player.score))
    const last = this.players.filter((player) => player.score === lowest)
    this.immuneUntil = -1
    return last[Math.floor(Math.random() * last.length)]
  }

  private startPlaying() {
    this.dots.visible = false
    if (this.options.mode === 'bite' && this.question && this.aim) {
      this.spawnBiteWords(this.question, this.aim)
      this.updateBiteWords(0)
      this.phase = 'bite'
      this.phaseUntil = this.now + BITE_ROUND_MS
      if (this.immuneUntil === -1) {
        this.immuneUntil = this.now + 1500
        this.showMessage('Answer is safe for a moment', this.now + 1300)
      }
      return
    }
    if (this.swimFrame) {
      this.spawnFish()
      this.phase = 'swim'
      this.phaseUntil = this.now + SWIM_ROUND_MS
    }
  }

  private spawnBiteWords(question: BiteQuestion, aim: Chomper) {
    const centerX = this.app.screen.width / 2
    const centerY = this.app.screen.height / 2
    const target = Math.atan2(aim.anchorY - centerY, aim.anchorX - centerX)
    const choices = [
      { text: question.answer, correct: true, angle: target, phase: Math.PI / 2, power: null as Token['power'] },
      ...question.decoys.map((text, index) => ({
        text,
        correct: false,
        angle: target + ((index + 1) * Math.PI * 2) / (question.decoys.length + 1),
        phase: Math.random() * Math.PI * 2,
        power: null as Token['power'],
      })),
    ]
    if (Math.random() < 0.35) {
      choices.push({
        text: '',
        correct: false,
        angle: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        power: Math.random() < 0.5 ? 'reverse' : 'skip',
      })
    }
    for (const choice of takeRoundQueue(choices, choices.length)) {
      const token = this.makeToken(choice.text, choice.correct, choice.power)
      token.angle = choice.angle
      token.phase = choice.phase
      this.words.push(token)
    }
  }

  private spawnFish() {
    const count = Math.min(12, this.vocab.length)
    for (let index = 0; index < count; index += 1) {
      const token = this.makeToken('', false, null)
      token.heading = Math.random() * Math.PI * 2
      token.speed = 26 + Math.random() * 18
      this.words.push(token)
      this.placeFish(token)
    }
  }

  private placeFish(token: Token) {
    const width = this.app.screen.width
    const height = this.app.screen.height
    const used = new Set(this.words.filter((other) => other !== token && !other.hidden).map((other) => other.text))
    const free = this.vocab.filter((word) => !used.has(word))
    const pool = free.length > 0 ? free : this.vocab
    token.text = pool[Math.floor(Math.random() * pool.length)] ?? this.vocab[0]
    token.label.text = token.text
    token.hidden = false
    token.view.visible = true
    token.goneUntil = 0
    this.paintWord(token)
    for (let attempt = 0; attempt < 12; attempt += 1) {
      token.x = width * 0.12 + Math.random() * width * 0.76
      token.y = height * 0.2 + Math.random() * height * 0.6
      const clear = this.players.every((player) => Math.hypot(player.x - token.x, player.y - token.y) > 110)
      if (clear) break
    }
    token.view.position.set(token.x, token.y)
  }

  private makeToken(text: string, correct: boolean, power: Token['power']): Token {
    const view = new Container()
    view.eventMode = 'none'
    view.zIndex = 2
    const shadow = new Graphics()
    const body = new Graphics()
    const label = this.makeLabel(text, this.options.mode === 'swim' ? 24 : 28)
    view.addChild(shadow, body, label)
    const token: Token = {
      view,
      shadow,
      body,
      label,
      text,
      correct,
      power,
      x: 0,
      y: 0,
      hw: 40,
      hh: 24,
      angle: 0,
      phase: 0,
      near: false,
      good: false,
      heading: 0,
      speed: 30,
      goneUntil: 0,
      hidden: false,
    }
    this.paintWord(token)
    this.world.addChild(view)
    return token
  }

  private paintWord(token: Token) {
    if (token.power) {
      this.paintPower(token)
      return
    }
    const swim = this.options.mode === 'swim'
    if (swim) {
      const radius = Math.max(30, token.label.width / 2 + 18, token.label.height / 2 + 16)
      token.hw = radius
      token.hh = radius
      const border = token.good ? GOOD_INK : 0x8ec4e4
      token.shadow.clear()
      token.shadow.circle(0, 4, radius).fill({ color: 0x7eb6d4, alpha: 0.22 })
      token.body.clear()
      token.body.circle(0, 0, radius).fill({ color: 0xffffff, alpha: 0.94 }).stroke({ width: 3, color: border })
      token.body.circle(-radius * 0.32, -radius * 0.34, Math.max(4, radius * 0.16)).fill({ color: 0xffffff, alpha: 0.98 })
      token.label.position.set(0, 0)
      return
    }
    const width = Math.max(84, token.label.width + 32)
    const height = Math.max(46, token.label.height + 16)
    token.hw = width / 2
    token.hh = height / 2
    const fill = token.good ? GOOD : 0xffffff
    const border = token.good || token.near ? GOOD_INK : INK
    token.shadow.clear()
    token.shadow.roundRect(-width / 2 + 4, -height / 2 + 4, width, height, height / 2).fill({ color: INK, alpha: 0.9 })
    token.body.clear()
    token.body.roundRect(-width / 2, -height / 2, width, height, height / 2).fill(fill).stroke({ width: 3, color: border })
    token.label.position.set(0, 0)
  }

  private paintPower(token: Token) {
    token.label.text = ''
    token.hw = 28
    token.hh = 28
    token.shadow.clear()
    token.shadow.roundRect(-24, -24, 56, 56, 16).fill({ color: INK, alpha: 0.9 })
    token.body.clear()
    const fill = token.power === 'reverse' ? 0x2f7df6 : BAD
    token.body.roundRect(-28, -28, 56, 56, 16).fill(fill).stroke({ width: 4, color: 0xf5c542 })
    if (token.power === 'reverse') {
      token.body.poly([0, -16, 12, -2, 4, -2, 4, 8, -4, 8, -4, -2, -12, -2]).fill(0xffffff)
      token.body.poly([0, 16, -12, 2, -4, 2, -4, -8, 4, -8, 4, 2, 12, 2]).fill(0xffffff)
    } else {
      token.body.circle(0, 0, 14).stroke({ width: 4, color: 0xffffff })
      token.body.poly([-13, 7, -7, 13, 13, -7, 7, -13]).fill(0xffffff)
    }
  }

  private update(ticker: Ticker) {
    if (this.paused || this.destroyed || !this.built) return
    const width = this.app.screen.width
    const height = this.app.screen.height
    if (width < 10 || height < 10) return
    this.now += Math.min(ticker.deltaMS, 100)
    const dt = Math.min(ticker.deltaMS, 50) / 1000
    if (this.bannerUntil !== null && this.now >= this.bannerUntil && this.phase !== 'toast') {
      this.banner.visible = false
      this.bannerUntil = null
    }
    if (this.options.mode === 'swim') {
      this.drawBubbles()
      this.drawTimer()
    }
    this.placePlayers(dt)

    if (this.phase === 'countdown') {
      if (this.now >= this.phaseUntil) {
        if (this.countdownStep >= 3) this.startPlaying()
        else {
          this.countdownStep += 1
          this.drawDots(this.countdownStep)
          this.phaseUntil = this.now + 650
        }
      }
      return
    }
    if (this.phase === 'toast') {
      if (this.now >= this.phaseUntil) {
        this.roundIndex += 1
        this.beginRound()
      }
      return
    }
    if (this.phase === 'bite') {
      this.updateBiteWords(dt)
      for (const player of this.players) this.updateLunge(player)
      if (this.phase === 'bite' && this.now >= this.phaseUntil) this.endBite(null)
      return
    }
    if (this.phase === 'swim') this.updateSwim(dt)
  }

  private placePlayers(dt: number) {
    const width = this.app.screen.width
    const height = this.app.screen.height
    for (const player of this.players) {
      if (this.phase === 'swim') {
        const stunned = this.now < player.stunUntil
        const moving = !stunned && Math.hypot(player.jx, player.jy) > 0.12
        if (moving) {
          player.dir = Math.atan2(player.jy, player.jx)
          const speed = Math.min(width, height) * 0.5
          player.x += player.jx * speed * dt
          player.y += player.jy * speed * dt
        }
        player.x = Math.max(36, Math.min(width - 36, player.x))
        player.y = Math.max(36, Math.min(height - 36, player.y))
      }
      const bob = Math.sin(this.now / 280 + player.index) * 3
      player.view.position.set(player.x, player.y + bob)
      if (!player.lunge) {
        player.facing.rotation = player.dir
        player.facing.position.set(0, 0)
        player.facing.scale.set(1)
      }
      if (this.now >= player.stunUntil) player.view.alpha = 1
      if (player.missUntil > 0 && this.now >= player.missUntil) {
        player.missUntil = 0
        this.paintChomper(player)
      }
      const back = player.dir + Math.PI
      player.badge.position.set(player.view.x + Math.cos(back) * 50, player.view.y + Math.sin(back) * 50)
      player.badge.rotation = player.y < height * 0.5 ? Math.PI : 0
      if (player.lockUntil > 0 && this.now >= player.lockUntil) {
        player.seq = []
        player.lockUntil = 0
        this.syncSlots(player)
      }
    }
  }

  private updateBiteWords(dt: number) {
    const width = this.app.screen.width
    const height = this.app.screen.height
    const centerX = width / 2
    const centerY = height / 2
    const halfW = width / 2 - width * 0.08
    const halfH = height / 2 - height * 0.16
    for (const word of this.words) {
      if (word.hidden) continue
      word.angle += dt * ANGLES * this.globalDir
      word.phase += (dt * PULSE) / 2
      const cosine = Math.cos(word.angle)
      const sine = Math.sin(word.angle)
      const reach = Math.min(
        Math.abs(cosine) > 1e-4 ? halfW / Math.abs(cosine) : 1e9,
        Math.abs(sine) > 1e-4 ? halfH / Math.abs(sine) : 1e9
      )
      const scale = 0.22 + 0.7 * Math.abs(Math.sin(word.phase))
      let x = centerX + cosine * reach * scale
      let y = centerY + sine * reach * scale
      let near = false
      for (const player of this.players) {
        const dx = x - player.anchorX
        const dy = y - player.anchorY
        const distance = Math.hypot(dx, dy)
        const gate = this.stretch * 0.78
        if (distance < gate) {
          const ux = distance > 6 ? dx / distance : Math.cos(player.dir)
          const uy = distance > 6 ? dy / distance : Math.sin(player.dir)
          x = player.anchorX + ux * gate
          y = player.anchorY + uy * gate
        }
        if (distance < this.stretch + 48) near = true
      }
      word.x = x
      word.y = y
      word.view.position.set(x, y)
      word.view.rotation = tableRotation(y, height)
      if (word.near !== near) {
        word.near = near
        this.paintWord(word)
      }
    }
  }

  private updateLunge(player: Chomper) {
    const lunge = player.lunge
    if (!lunge) return
    const elapsed = this.now - lunge.t0
    let amount = 0
    if (elapsed < 150) amount = elapsed / 150
    else if (elapsed < 220) amount = 1
    else if (elapsed < 420) amount = 1 - (elapsed - 220) / 200
    const distance = amount * this.stretch
    player.facing.rotation = lunge.dir
    player.facing.position.set(Math.cos(lunge.dir) * distance, Math.sin(lunge.dir) * distance)
    player.facing.scale.set(1 + 0.14 * amount)
    if (Math.abs(amount - player.mouth) > 0.08) {
      player.mouth = amount
      this.paintChomper(player)
    }
    if (!lunge.hit && elapsed <= 220 && this.phase === 'bite') {
      const mouthX = player.anchorX + Math.cos(lunge.dir) * (distance + 34)
      const mouthY = player.anchorY + Math.sin(lunge.dir) * (distance + 34)
      let best: Token | null = null
      let bestDist = 40
      for (const word of this.words) {
        if (word.hidden) continue
        const dx = Math.max(Math.abs(mouthX - word.x) - word.hw, 0)
        const dy = Math.max(Math.abs(mouthY - word.y) - word.hh, 0)
        const dist = Math.hypot(dx, dy)
        if (dist <= bestDist) {
          bestDist = dist
          best = word
        }
      }
      if (best) {
        lunge.hit = true
        lunge.t0 = this.now - 220
        this.resolveBite(player, best)
      }
    } else if (!lunge.hit && elapsed > 220) {
      lunge.hit = true
      this.stun(player, false)
    }
    if (elapsed >= 420) {
      player.lunge = null
      player.mouth = 0
      player.facing.position.set(0, 0)
      player.facing.scale.set(1)
      this.paintChomper(player)
    }
  }

  private resolveBite(player: Chomper, word: Token) {
    if (word.power) {
      this.activatePower(word)
      return
    }
    if (word.correct) {
      if (this.now < this.immuneUntil) {
        this.stun(player, false)
        return
      }
      word.good = true
      this.paintWord(word)
      this.endBite(player)
      return
    }
    this.stun(player, true)
  }

  private activatePower(word: Token) {
    word.hidden = true
    word.view.visible = false
    if (word.power === 'reverse') {
      this.globalDir *= -1
      this.showMessage('Words turned around', this.now + 1100)
    } else {
      this.pendingSkip = true
      this.showMessage('Next round protects the answer', this.now + 1100)
    }
    this.beep(880, 0.1)
  }

  private endBite(player: Chomper | null) {
    if (this.phase !== 'bite' || !this.question) return
    this.phase = 'toast'
    this.phaseUntil = this.now + 2800
    for (const chomper of this.players) chomper.lunge = null
    if (player) {
      player.score += 1
      this.paintBadge(player)
      this.showMessage(`${player.name} got it!\n${this.question.example}`, null)
      this.speak(this.question.example)
      this.beep(660, 0.16)
    } else {
      this.missed.push(this.question.answer)
      const correct = this.words.find((word) => word.correct)
      if (correct) {
        correct.good = true
        this.paintWord(correct)
      }
      this.showMessage(`Time is up!\n${this.question.example}`, null)
      this.speak(this.question.example)
    }
  }

  private updateSwim(dt: number) {
    const frame = this.swimFrame
    if (!frame) return
    const width = this.app.screen.width
    const height = this.app.screen.height
    const minY = height * 0.14
    const maxY = height * 0.86
    for (const word of this.words) {
      if (word.hidden) {
        if (this.now >= word.goneUntil) this.placeFish(word)
        continue
      }
      word.heading += (Math.random() - 0.5) * dt * 3
      word.x += Math.cos(word.heading) * word.speed * dt
      word.y += Math.sin(word.heading) * word.speed * dt
      if (word.x < 50 || word.x > width - 50) {
        word.heading = Math.PI - word.heading
        word.x = Math.max(50, Math.min(width - 50, word.x))
      }
      if (word.y < minY || word.y > maxY) {
        word.heading = -word.heading
        word.y = Math.max(minY, Math.min(maxY, word.y))
      }
      word.view.position.set(word.x, word.y)
      const flip = Math.max(0, Math.min(1, (height / 2 - word.y) / (height * 0.12) + 0.5))
      word.view.rotation = Math.PI * flip
    }
    for (const player of this.players) {
      if (this.now < player.stunUntil || this.now < player.lockUntil) continue
      for (const fish of this.words) {
        if (fish.hidden || this.now < player.lockUntil) continue
        const dx = Math.max(Math.abs(player.x - fish.x) - fish.hw, 0)
        const dy = Math.max(Math.abs(player.y - fish.y) - fish.hh, 0)
        if (Math.hypot(dx, dy) <= 26) this.eatFish(player, fish)
      }
    }
    if (this.now >= this.phaseUntil) this.endSwim()
  }

  private eatFish(player: Chomper, fish: Token) {
    const frame = this.swimFrame
    if (!frame) return
    const next = player.seq.concat(fish.text)
    const match = swimMatch(frame.sentences, next)
    if (match === 'reject') {
      const angle = Math.atan2(player.y - fish.y, player.x - fish.x)
      player.x += Math.cos(angle) * 80
      player.y += Math.sin(angle) * 80
      this.stun(player, false)
      return
    }
    player.seq = next
    fish.hidden = true
    fish.view.visible = false
    fish.goneUntil = this.now + 3000
    this.beep(660, 0.08)
    if (match === 'complete') {
      const key = next.join('\u0001')
      player.lockUntil = this.now + 900
      if (!player.done.has(key)) {
        player.done.add(key)
        player.built += 1
        this.beep(880, 0.14)
      } else {
        this.beep(180, 0.12)
      }
    }
    this.syncSlots(player)
  }

  private endSwim() {
    if (this.phase !== 'swim') return
    this.phase = 'toast'
    this.phaseUntil = this.now + 3200
    this.timerView.visible = false
    const best = Math.max(...this.players.map((player) => player.built))
    const winners = this.players.filter((player) => best > 0 && player.built === best)
    for (const winner of winners) {
      winner.score += 1
      this.paintBadge(winner)
    }
    const title = winners.length > 0 ? `${winners.map((player) => player.name).join(' & ')} wins the round` : 'No sentences this round'
    const detail = this.players.map((player) => `${player.index + 1}: ${player.built}`).join('   ')
    this.showMessage(`${title}\n${detail}`, null)
    this.beep(660, 0.16)
  }

  private syncSlots(player: Chomper) {
    const frame = this.swimFrame
    player.slots.removeChildren().forEach((child) => child.destroy({ children: true }))
    if (!frame) return
    const length = Math.max(0, ...frame.sentences.map((sentence) => sentence.length))
    let cursor = 0
    const height = 34
    for (let index = 0; index < length; index += 1) {
      const word = player.seq[index] ?? ''
      const filled = index < player.seq.length
      const label = this.makeLabel(word, 16)
      if (filled) label.style.fill = 0xffffff
      const width = Math.max(42, label.width + 14)
      const cell = new Container()
      const plate = new Graphics()
      plate
        .roundRect(0, 0, width, height, 10)
        .fill(filled ? player.color : 0xffffff)
        .stroke({ width: 3, color: INK })
      label.position.set(width / 2, height / 2)
      cell.addChild(plate, label)
      cell.position.set(cursor, 0)
      player.slots.addChild(cell)
      cursor += width + 6
    }
    const tally = this.makeLabel(String(player.built), 20)
    tally.style.fill = player.color
    tally.position.set(cursor + tally.width / 2 + 8, height / 2)
    player.slots.addChild(tally)
    player.slots.pivot.set(Math.max(0, cursor - 6) / 2, height / 2)
  }

  private stun(player: Chomper, losePoint: boolean) {
    if (losePoint && player.score > 0) {
      player.score -= 1
      this.paintBadge(player)
    }
    player.stunUntil = this.now + STUN_MS
    player.missUntil = this.now + 360
    player.view.alpha = 0.45
    this.paintChomper(player)
    this.beep(150, 0.18)
  }

  private paintChomper(player: Chomper) {
    drawChomper(player.face, player.color, player.mouth, this.now < player.missUntil)
  }

  private paintBadge(player: Chomper) {
    player.badgeText.text = player.score > 0 ? `${player.index + 1} · ${player.score}` : String(player.index + 1)
    const width = Math.max(36, player.badgeText.width + 16)
    const height = 32
    player.badgeBg.clear()
    player.badgeBg.roundRect(-width / 2, -height / 2, width, height, 12).fill(player.color).stroke({ width: 3, color: INK })
  }

  private onTap(event: FederatedPointerEvent) {
    if (this.phase !== 'bite' || this.paused) return
    this.resumeAudio()
    let nearest = this.players[0]
    let best = Number.POSITIVE_INFINITY
    for (const player of this.players) {
      const distance = Math.hypot(event.globalX - player.anchorX, event.globalY - player.anchorY)
      if (distance < best) {
        best = distance
        nearest = player
      }
    }
    if (!nearest || this.now < nearest.stunUntil || nearest.lunge) return
    let dir = nearest.dir
    if (best > 48) {
      const aim = Math.atan2(event.globalY - nearest.anchorY, event.globalX - nearest.anchorX)
      const delta = Math.atan2(Math.sin(aim - nearest.dir), Math.cos(aim - nearest.dir))
      dir = nearest.dir + Math.max(-1, Math.min(1, delta))
    }
    nearest.lunge = { t0: this.now, dir, hit: false }
    nearest.mouth = 0.2
    this.paintChomper(nearest)
  }

  private onJoyDown(player: Chomper, event: FederatedPointerEvent) {
    if (this.options.mode !== 'swim' || this.paused) return
    event.stopPropagation()
    this.resumeAudio()
    player.pointerId = event.pointerId
    this.joyVector(player, event)
    const move = (next: FederatedPointerEvent) => {
      if (next.pointerId !== player.pointerId) return
      this.joyVector(player, next)
    }
    const up = (next: FederatedPointerEvent) => {
      if (next.pointerId !== player.pointerId) return
      player.pointerId = -1
      player.jx = 0
      player.jy = 0
      player.knob.position.set(0, 0)
      this.app.stage.off('pointermove', move)
      this.app.stage.off('pointerup', up)
      this.app.stage.off('pointerupoutside', up)
    }
    this.app.stage.on('pointermove', move)
    this.app.stage.on('pointerup', up)
    this.app.stage.on('pointerupoutside', up)
  }

  private joyVector(player: Chomper, event: FederatedPointerEvent) {
    const center = player.joy.getGlobalPosition()
    let dx = event.globalX - center.x
    let dy = event.globalY - center.y
    const distance = Math.hypot(dx, dy)
    const radius = 40
    if (distance > radius) {
      dx = (dx / distance) * radius
      dy = (dy / distance) * radius
    }
    player.jx = (dx / radius) * 0.9
    player.jy = (dy / radius) * 0.9
    player.knob.position.set(dx, dy)
  }

  private showMessage(text: string, until: number | null) {
    this.bannerTop.text = text
    this.bannerBottom.text = text
    this.bannerUntil = until
    this.banner.visible = true
    const width = this.app.screen.width
    const maxWidth = Math.min(width * 0.7, 640)
    this.bannerTop.style.wordWrap = true
    this.bannerBottom.style.wordWrap = true
    this.bannerTop.style.wordWrapWidth = maxWidth - 36
    this.bannerBottom.style.wordWrapWidth = maxWidth - 36
    const cardW = Math.min(maxWidth, Math.max(220, this.bannerBottom.width + 36))
    const cardH = this.bannerBottom.height * 2 + 36
    this.bannerShadow.clear()
    this.bannerShadow.roundRect(-cardW / 2 + 4, -cardH / 2 + 4, cardW, cardH, 20).fill(INK)
    this.bannerBg.clear()
    this.bannerBg.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20).fill(0xffffff).stroke({ width: 3, color: INK })
    this.bannerTop.position.set(0, -cardH / 4)
    this.bannerBottom.position.set(0, cardH / 4)
    this.bannerTop.rotation = Math.PI
    this.banner.position.set(width / 2, this.app.screen.height / 2)
  }

  private layoutTimer() {
    this.timerView.position.set(this.app.screen.width / 2, this.app.screen.height / 2)
  }

  private drawTimer() {
    const running = this.phase === 'swim'
    this.timerView.visible = running
    if (!running) return
    const remaining = Math.max(0, this.phaseUntil - this.now)
    const progress = Math.min(0.99999, remaining / SWIM_ROUND_MS)
    const seconds = Math.max(0, Math.ceil(remaining / 1000))
    if (this.timerText.text !== String(seconds)) this.timerText.text = String(seconds)
    const radius = 40
    const bar = 7
    this.timerTrack.clear()
    this.timerTrack.circle(0, 0, radius - bar).fill({ color: 0xffffff, alpha: 0.94 })
    this.timerTrack.arc(0, 0, radius - bar / 2, 0, Math.PI * 2).stroke({ width: bar, color: 0xd7e8f2 })
    this.timerArc.clear()
    if (progress > 0.01) {
      const start = -Math.PI / 2
      this.timerArc
        .arc(0, 0, radius - bar / 2, start, start + progress * Math.PI * 2, false)
        .stroke({ width: bar, color: 0x49c8ff, cap: 'round' })
    }
  }

  private drawDots(lit: number) {
    this.dots.clear()
    const width = this.app.screen.width
    const height = this.app.screen.height
    this.dots.roundRect(width / 2 - 58, height / 2 - 24, 116, 48, 24).fill(INK)
    for (let index = 0; index < 3; index += 1) {
      this.dots.circle(width / 2 + (index - 1) * 28, height / 2, 8).fill(index < lit ? 0x2ee66b : 0x46515e)
    }
  }

  private showFinal() {
    this.phase = 'final'
    this.over = true
    this.clearTokens()
    this.banner.visible = false
    this.dots.visible = false
    this.timerView.visible = false
    this.clueTop.visible = false
    this.clueBottom.visible = false
    for (const player of this.players) {
      player.view.visible = false
      player.badge.visible = false
      player.joy.visible = false
      player.slots.visible = false
    }
    this.drawFinal()
    this.hooks.onStatus?.('Game over')
  }

  private drawFinal() {
    this.finalView.visible = true
    this.finalView.removeChildren().forEach((child) => child.destroy({ children: true }))
    const width = this.app.screen.width
    const height = this.app.screen.height
    this.finalView.addChild(this.scoreColumn(width / 2, height * 0.27, Math.PI))
    this.finalView.addChild(this.scoreColumn(width / 2, height * 0.73, 0))
  }

  private scoreColumn(x: number, y: number, rotation: number) {
    const column = new Container()
    const sorted = [...this.players].sort((a, b) => b.score - a.score)
    const best = sorted[0]?.score ?? 0
    const title = this.makeLabel('Game over', 36)
    column.addChild(title)
    let cursor = 48
    for (const player of sorted) {
      const row = new Container()
      const dot = new Graphics()
      dot.circle(0, 0, 9).fill(player.color)
      const label = this.makeLabel(
        `${player.name}${player.score === best && best > 0 ? '  ★' : ''}   ${player.score}`,
        26
      )
      label.anchor.set(0, 0.5)
      label.position.set(22, 0)
      dot.position.set(0, 0)
      row.addChild(dot, label)
      row.position.set(-120, cursor)
      column.addChild(row)
      cursor += 42
    }
    if (this.options.mode === 'bite') {
      const review = this.makeLabel(
        this.missed.length > 0 ? `Practice: ${this.missed.join(', ')}` : 'No missed words',
        18
      )
      review.style.wordWrap = true
      review.style.wordWrapWidth = Math.min(420, this.app.screen.width * 0.7)
      review.position.set(0, cursor + 8)
      column.addChild(review)
      cursor += review.height + 20
    }
    const button = this.makeButton('Play again')
    button.position.set(0, cursor + 20)
    button.on('pointertap', (event) => {
      event.stopPropagation()
      this.playAgain()
    })
    column.addChild(button)
    column.pivot.set(0, cursor / 2)
    column.position.set(x, y)
    column.rotation = rotation
    return column
  }

  private makeButton(label: string) {
    const button = new Container()
    const text = this.makeLabel(label, 24)
    const width = text.width + 48
    const height = 52
    const shadow = new Graphics()
    const bg = new Graphics()
    shadow.roundRect(-width / 2 + 4, -height / 2 + 4, width, height, 26).fill(INK)
    bg.roundRect(-width / 2, -height / 2, width, height, 26).fill(0xffffff).stroke({ width: 3, color: INK })
    button.addChild(shadow, bg, text)
    button.eventMode = 'static'
    button.cursor = 'pointer'
    return button
  }

  private playAgain() {
    if (this.destroyed || this.phase !== 'final') return
    this.over = false
    this.missed = []
    this.roundIndex = 0
    this.pendingSkip = false
    this.prepareQueue()
    for (const player of this.players) {
      player.score = 0
      this.paintBadge(player)
      player.joy.visible = this.options.mode === 'swim'
      player.slots.visible = this.options.mode === 'swim'
    }
    this.beginRound()
  }

  private clearTokens() {
    for (const word of this.words) word.view.destroy({ children: true })
    this.words = []
  }

  private speak(text: string) {
    if (!this.sounds || typeof window === 'undefined' || !window.speechSynthesis) return
    const spoken = text.split('___').join('blank').replace(/[^\x20-\x7E\n]/g, ' ')
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(spoken)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  private beep(frequency: number, duration: number) {
    if (!this.sounds) return
    const context = this.resumeAudio()
    if (!context) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = frequency
    gain.gain.value = 0.05
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + duration)
  }

  private resumeAudio() {
    if (!this.sounds || typeof window === 'undefined') return null
    if (typeof window.AudioContext === 'undefined') return null
    const Context = window.AudioContext
    this.audioContext = this.audioContext ?? new Context()
    if (this.audioContext.state === 'suspended') void this.audioContext.resume()
    return this.audioContext
  }
}
