import type { TransitionScreen, TransitionScreenConfig } from '../ui/TransitionScreen'
import type {
  TransitionStartPayload,
  TransitionEndPayload,
} from '../core/EventTypes'
import { TRANSITION_EVENTS } from '../core/EventTypes'

type PhaseGetter = () => string | undefined
type PhaseSetter = (phase: string, options?: { silent?: boolean }) => void
type HistoryGetter = (count?: number) => ReadonlyArray<{ phase?: string }>
type EmitFn = (eventName: typeof TRANSITION_EVENTS.START | typeof TRANSITION_EVENTS.END, payload: TransitionStartPayload | TransitionEndPayload) => void

/**
 * Hosts TransitionScreen show/hide + phase restore for BaseGame.
 */
export class GameTransitionHost {
  constructor(
    private getScreen: () => TransitionScreen | undefined,
    private getPhase: PhaseGetter,
    private setPhase: PhaseSetter,
    private getHistory: HistoryGetter,
    private emit: EmitFn
  ) {}

  async show(config: TransitionScreenConfig): Promise<void> {
    const transitionScreen = this.getScreen()
    if (!transitionScreen) {
      console.warn('Attempted to show transition screen, but it was not initialized.')
      return
    }

    const previousPhase = this.getPhase()
    this.setPhase('transition', { silent: true })

    const startPayload: TransitionStartPayload = {
      type: config.type,
      message: config.message,
      duration: config.duration,
      triggerPowerupRoll: config.triggerPowerupRoll,
    }
    this.emit(TRANSITION_EVENTS.START, startPayload)

    const screenPromise = transitionScreen.show(config)

    if (config.autoHide) {
      await screenPromise
      if (this.getPhase() === 'transition') {
        const endPayload: TransitionEndPayload = { type: config.type }
        this.emit(TRANSITION_EVENTS.END, endPayload)
        const phaseToRestore =
          previousPhase && previousPhase !== 'transition' ? previousPhase : 'playing'
        this.setPhase(phaseToRestore)
      }
    }
  }

  hide(): void {
    const transitionScreen = this.getScreen()
    if (!transitionScreen?.visible) return

    const currentScreenConfig = transitionScreen.getCurrentConfig()
    transitionScreen.hide()

    if (this.getPhase() === 'transition') {
      const endPayload: TransitionEndPayload = {
        type: currentScreenConfig?.type || 'custom',
      }
      this.emit(TRANSITION_EVENTS.END, endPayload)

      const history = this.getHistory(1)
      const phaseBeforeTransition =
        history.length > 0 && history[0].phase !== 'transition'
          ? history[0].phase || 'playing'
          : 'playing'

      this.setPhase(phaseBeforeTransition)
    }
  }
}
