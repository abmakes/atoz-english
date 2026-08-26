import { BaseGame, BaseGameState } from '@/lib/pixi-engine/game/BaseGame';
import { PixiEngineManagers } from '@/lib/pixi-engine/core/PixiEngine';
import { GameConfig } from '@/lib/pixi-engine/config/GameConfig';
import {
    GAME_STATE_EVENTS,
    TIMER_EVENTS,
    TimerEventPayload,
    GAME_EVENTS,
    AnswerSelectedPayload,
    TransitionPowerupSelectedPayload,
} from '@/lib/pixi-engine/core/EventTypes';
import { TimerType } from '@/lib/pixi-engine/game/TimerManager';
import { GifAsset } from 'pixi.js/gif';
import { ensureFontIsLoaded } from '@/lib/pixi-engine/utils/ensureFontIsLoaded';
import { GameBackgroundManager } from '@/lib/pixi-games/multiple-choice/managers/GameBackgroundManager';
import { WordPlayDataManager } from './managers/WordPlayDataManager';
import { WordPlayUIManager } from './managers/WordPlayUIManager';
import { WordPlayLayoutManager } from './managers/WordPlayLayoutManager';
import {
    WordPlayRound,
    isSortingArrangementCorrect,
    isMatchingArrangementCorrect,
} from './wordPlayQuestion';

interface WordPlayGameState extends BaseGameState {
    currentQuestionIndex: number;
    activeTeamIndex: number;
    activeTeam: string | number;
    timerCompleteCount: number;
    hasTriggeredGameOver: boolean;
    phase: 'loading' | 'playing' | 'gameOver';
}

/**
 * WordPlayGame — drag-and-drop word order (SORTING) and pair matching
 * (MATCHING) rounds played in team turns, reusing the shared engine flow
 * (transitions, timers, RuleEngine scoring, power-up wheel).
 */
export class WordPlayGame extends BaseGame<WordPlayGameState> {
    private dataManager!: WordPlayDataManager;
    private uiManager!: WordPlayUIManager;
    private backgroundManager!: GameBackgroundManager;
    private layoutManager!: WordPlayLayoutManager;
    private currentRound: WordPlayRound | null = null;
    private isProcessingAnswer = false;
    private readonly QUESTION_TIMER_ID = 'wordPlayQuestionTimer';

    constructor(config: GameConfig, managers: PixiEngineManagers) {
        super(config, managers);
        if (typeof GifAsset !== 'undefined') {
            console.log('[WordPlayGame] GIF Asset handler registered.');
        }
    }

    protected createInitialState(): WordPlayGameState {
        const firstTeamId = this.config.teams.length > 0 ? this.config.teams[0].id : 'unknown';
        return {
            currentQuestionIndex: 0,
            activeTeamIndex: 0,
            activeTeam: firstTeamId,
            timerCompleteCount: 0,
            hasTriggeredGameOver: false,
            phase: 'loading',
            scores: {},
        };
    }

    protected async initImplementation(engineAssetsPromise: Promise<unknown>): Promise<void> {
        try {
            await this.showTransition({ type: 'loading', message: 'Getting Ready...', autoHide: false });

            const { width, height } = this.pixiApp.getScreenSize();
            this.layoutManager = new WordPlayLayoutManager(width, height);

            if (!this.config.questionHandling) {
                throw new Error('Question handling configuration is missing in GameConfig.');
            }
            if (!this.config.quizId) {
                throw new Error('Quiz ID is missing in GameConfig.');
            }

            this.dataManager = new WordPlayDataManager(
                this.config.quizId,
                this.config.questionHandling,
                this.assetLoader
            );
            const gameDataPromise = this.dataManager.loadData();
            await Promise.all([engineAssetsPromise, gameDataPromise]);

            this.hideTransition();

            const firstTeamName = this.config.teams[0]?.name || 'Team 1';
            await this.showTransition({
                type: 'turn',
                message: `${firstTeamName}'s Turn!`,
                duration: 2000,
                autoHide: true,
            });

            await ensureFontIsLoaded('Grandstander');

            this.backgroundManager = new GameBackgroundManager(
                this.pixiApp,
                this.themeConfig,
                this.eventBus
            );
            this.view.addChildAt(this.backgroundManager.getView(), 0);

            this.uiManager = new WordPlayUIManager(
                this.pixiApp,
                this.eventBus,
                this.assetLoader,
                this.themeConfig.pixiConfig,
                { onCheckPressed: this._handleCheckPressed.bind(this) },
                this.layoutManager
            );
            this.view.addChild(this.uiManager.getView());
            this.view.addChild(this.uiManager.getTimerContainer());

            this.dataManager.initializeSequencer(this.config.teams.length);

            const totalQuestions = this.dataManager.getTotalQuestionsToAsk();
            await this.showTransition({
                type: 'turn',
                message: 'Get Ready!',
                duration: 2000,
                autoHide: true,
                questionCounter: { current: 1, total: totalQuestions },
            });

            this._showRound();
            this._bindGameEvents();
            this.setState({ phase: 'playing' });

            console.log(`${this.constructor.name}: Initialized successfully.`);
        } catch (error) {
            console.error(`Error initializing ${this.constructor.name}:`, error);
            this.hideTransition();
            this.setState({ hasTriggeredGameOver: true, phase: 'gameOver' });
            this._unbindGameEvents();
            this.uiManager?.destroy();
            this.backgroundManager?.destroy();
            throw error;
        }
    }

    private _bindGameEvents(): void {
        this.registerEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._handleTimerComplete.bind(this));
        this.registerEventListener(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused.bind(this));
        this.registerEventListener(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed.bind(this));
    }

    private _unbindGameEvents(): void {
        this.unregisterEventListener(TIMER_EVENTS.TIMER_COMPLETED, this._handleTimerComplete.bind(this));
        this.unregisterEventListener(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused.bind(this));
        this.unregisterEventListener(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed.bind(this));
    }

    public start(): void {
        console.log(`${this.constructor.name}: Game started (first round shown during init).`);
    }

    public update(delta: number): void {
        const deltaTimeMs = delta > 5 ? delta : delta * 1000;
        this.powerUpManager.update(deltaTimeMs);
        if (this.transitionScreen) {
            this.transitionScreen.update(deltaTimeMs);
        }
    }

    public render(): void {
        // Rendering handled by PIXI.
    }

    protected endImplementation(): void {
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
        }
        this.uiManager?.setInteractionEnabled(false);
        this.uiManager?.clearRoundState();
    }

    protected destroyImplementation(): void {
        this._unbindGameEvents();
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
        }
        this.uiManager?.destroy();
        this.backgroundManager?.destroy();
        // @ts-expect-error - uiManager is intentionally set to null after destruction for cleanup.
        this.uiManager = null;
        this.view.removeChildren();
    }

    // --- Round flow ---

    private _showRound(): void {
        if (!this.dataManager || !this.uiManager) {
            console.error('[WordPlayGame] Cannot show round: managers not initialized.');
            this._triggerGameOver();
            return;
        }

        const round = this.dataManager.getNextRound();
        if (!round) {
            if (!this.getState().hasTriggeredGameOver) {
                this._triggerGameOver();
            }
            return;
        }

        this.currentRound = round;
        this.isProcessingAnswer = false;
        this.uiManager.displayRound(round);
        this._startQuestionTimer();
        this.setState({
            currentQuestionIndex: this.dataManager.getCurrentProgressIndex() - 1,
        });
    }

    private _startQuestionTimer(): void {
        let questionDuration = this.config.intensityTimeLimit * 1000;
        const currentTeamId = this.getState().activeTeam;

        if (currentTeamId) {
            if (this.isPowerUpActive('time_extension', currentTeamId)) {
                const definition = this.powerUpManager.getPowerupDefinition('time_extension');
                const extraTimeMs = ((definition?.effectParams?.amount as number) || 0) * 1000;
                questionDuration += extraTimeMs;
                this.powerUpManager.deactivatePowerUpByTypeAndTarget('time_extension', currentTeamId);
            }

            if (this.isPowerUpActive('faster_clock', currentTeamId)) {
                const definition = this.powerUpManager.getPowerupDefinition('faster_clock');
                const factor = (definition?.effectParams?.durationFactor as number) ?? 0.8;
                questionDuration = Math.max(1000, Math.floor(questionDuration * factor));
                this.powerUpManager.deactivatePowerUpByTypeAndTarget('faster_clock', currentTeamId);
            }
        }

        this.timerManager.createTimer(this.QUESTION_TIMER_ID, questionDuration, TimerType.COUNTDOWN);
        this.timerManager.startTimer(this.QUESTION_TIMER_ID);
        this.uiManager?.updateTimerDisplay(questionDuration);
    }

    /** Called by the UI manager when the Check button is pressed. */
    private async _handleCheckPressed(): Promise<void> {
        if (!this.currentRound || this.isProcessingAnswer) return;
        if (this.getState().hasTriggeredGameOver) return;
        if (!this.uiManager.isArrangementComplete()) return;

        this.isProcessingAnswer = true;
        const round = this.currentRound;

        const isCorrect =
            round.kind === 'sorting'
                ? isSortingArrangementCorrect(this.uiManager.getSortingArrangement(), round.correctOrder)
                : isMatchingArrangementCorrect(this.uiManager.getMatchingArrangement(), round.correctPairs);

        this.uiManager.showRoundFeedback(round, isCorrect);
        this._emitAnswerResult(round, isCorrect);

        await this._advanceAfterFeedback();
    }

    /** Emits ANSWER_SELECTED so the shared RuleEngine rules score and play sounds. */
    private _emitAnswerResult(round: WordPlayRound, isCorrect: boolean): void {
        const currentTeamId = this.getState().activeTeam;

        let remainingTimeMs = 0;
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            remainingTimeMs = this.timerManager.getTimeRemaining(this.QUESTION_TIMER_ID);
        }

        let scoreMultiplier = 1;
        if (currentTeamId && isCorrect && this.isPowerUpActive('double_points', currentTeamId)) {
            scoreMultiplier = 2;
            const activeInstances = this.powerUpManager
                .getActivePowerupsForTarget(currentTeamId)
                .filter((p) => p.id === 'double_points');
            if (activeInstances.length > 0) {
                this.powerUpManager.deactivatePowerUp(activeInstances[0].instanceId);
            }
        }
        if (currentTeamId && isCorrect && this.isPowerUpActive('comeback', currentTeamId)) {
            const definition = this.powerUpManager.getPowerupDefinition('comeback');
            const boost = (definition?.effectParams?.multiplier as number) ?? 1.5;
            scoreMultiplier *= boost;
        }

        const payload: AnswerSelectedPayload = {
            questionId: round.questionId,
            selectedOptionId: isCorrect ? 'arrangement-correct' : 'arrangement-incorrect',
            isCorrect,
            teamId: currentTeamId,
            remainingTimeMs,
            scoreMultiplier,
        };
        this.emitEvent(GAME_EVENTS.ANSWER_SELECTED, payload);

        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
        }
    }

    /** Feedback pause, then either game over or the next team's turn. */
    private async _advanceAfterFeedback(): Promise<void> {
        const isSequenceFinished = this.dataManager.isSequenceFinished();

        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (this.getState().hasTriggeredGameOver) return;

        if (isSequenceFinished) {
            this._triggerGameOver();
            return;
        }

        const currentTeamIndex = this.getState().activeTeamIndex;
        const nextTeamIndex = (currentTeamIndex + 1) % this.config.teams.length;
        const nextTeam = this.config.teams[nextTeamIndex];
        const nextTeamId = nextTeam?.id ?? 'unknown';
        const nextTeamName = nextTeam?.name || `Team ${nextTeamIndex + 1}`;

        this.setState({ activeTeamIndex: nextTeamIndex, activeTeam: nextTeamId });

        const progressIndex = this.dataManager.getCurrentProgressIndex();
        const numTeams = this.config.teams.length;
        const shouldTriggerRoll = progressIndex >= numTeams;
        const totalQuestions = this.dataManager.getTotalQuestionsToAsk();

        await this.showTransition({
            type: 'turn',
            message: `${nextTeamName}'s Turn!`,
            duration: 3000,
            autoHide: true,
            triggerPowerupRoll: this.config.powerups.powerupsEnabled && shouldTriggerRoll,
            powerupWheelSegments:
                this.config.powerups.powerupsEnabled && shouldTriggerRoll
                    ? this._getPowerupWheelSegmentsForTeam(nextTeamId)
                    : undefined,
            questionCounter: { current: progressIndex + 1, total: totalQuestions },
        });

        if (this.getState().hasTriggeredGameOver) return;
        this._showRound();
    }

    // --- Timer completion (time ran out) ---

    private async _handleTimerComplete(payload: TimerEventPayload): Promise<void> {
        if (payload.timerId !== this.QUESTION_TIMER_ID) return;
        if (this.getState().hasTriggeredGameOver) return;
        if (this.isProcessingAnswer || !this.currentRound) return;

        this.isProcessingAnswer = true;
        this.setState({ timerCompleteCount: this.getState().timerCompleteCount + 1 });

        const round = this.currentRound;
        this.uiManager?.showRoundFeedback(round, false);

        const timeoutPayload: AnswerSelectedPayload = {
            questionId: round.questionId,
            selectedOptionId: null,
            isCorrect: false,
            teamId: this.getState().activeTeam,
            remainingTimeMs: 0,
        };
        this.emitEvent(GAME_EVENTS.ANSWER_SELECTED, timeoutPayload);

        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.removeTimer(this.QUESTION_TIMER_ID);
        }

        await this._advanceAfterFeedback();
    }

    // --- Game over ---

    private _triggerGameOver(): void {
        if (this.getState().hasTriggeredGameOver) return;

        this.hideTransition();
        this.setState({ hasTriggeredGameOver: true, phase: 'gameOver' });
        this.uiManager?.setInteractionEnabled(false);

        this.emitEvent(GAME_STATE_EVENTS.GAME_ENDED);
        this.end();
        this.uiManager?.clearRoundState();
    }

    // --- Power-ups ---

    private _getPowerupWheelSegmentsForTeam(teamId: string | number) {
        const scores = this.scoringManager.getAllScores();
        return this.powerUpManager.getWheelSegmentsForSpin(teamId, scores);
    }

    protected override _handlePowerupSelected(payload: TransitionPowerupSelectedPayload): void {
        super._handlePowerupSelected(payload);

        const targetTeamId = this.getState().activeTeam;
        if (payload.selectedPowerupId === 'none' || targetTeamId === undefined) {
            return;
        }
        this.activatePowerUp(payload.selectedPowerupId, targetTeamId);
    }

    // --- Pause / resume ---

    private _handleGamePaused(): void {
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.pauseTimer(this.QUESTION_TIMER_ID);
        }
    }

    private _handleGameResumed(): void {
        if (this.timerManager && this.timerManager.getTimer(this.QUESTION_TIMER_ID)) {
            this.timerManager.resumeTimer(this.QUESTION_TIMER_ID);
        }
    }
}
