import { create } from 'zustand';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import {
  GAME_STATE_EVENTS,
  SCORING_EVENTS,
  TIMER_EVENTS,
  GameStatePhaseChangedPayload,
  GameStateActiveTeamChangedPayload,
  ScoringScoreUpdatedPayload,
  TimerEventPayload,
} from '@/lib/pixi-engine/core/EventTypes';
import { GameConfig, TeamConfig } from '@/lib/pixi-engine/config/GameConfig';

export interface PlayerScoreState {
  teamId: string | number;
  playerName: string;
  score: number;
}

interface GameDisplayState {
  currentPhase: string | null; // e.g., GamePhase.LOADING, GamePhase.PLAYING
  activeTeamId: string | number | null;
  teamScores: PlayerScoreState[];
  currentTimeRemaining: number | null; // in milliseconds
  initialDuration: number | null; // in milliseconds, for timer progress calculation
  eventBusInstance: EventBus | null; // To manage subscriptions

  // Actions
  initScores: (teams: TeamConfig[]) => void;
  setEventBus: (eventBus: EventBus) => void;
  cleanupListeners: () => void;

  // Event handlers
  handlePhaseChanged: (payload: GameStatePhaseChangedPayload) => void;
  handleActiveTeamChanged: (payload: GameStateActiveTeamChangedPayload) => void;
  handleScoreUpdated: (payload: ScoringScoreUpdatedPayload) => void;
  handleTimerTick: (payload: TimerEventPayload) => void;
  handleTimerStarted: (payload: TimerEventPayload) => void;
}

// Helper to initialize/reset scores based on GameConfig
const initializeScores = (teams: TeamConfig[]): PlayerScoreState[] => {
  return teams.map(team => ({
    teamId: team.id,
    playerName: team.name,
    score: team.startingResources?.score ?? 0,
  }));
};

export const useGameDisplayStateStore = create<GameDisplayState>((set, get) => ({
  currentPhase: null,
  activeTeamId: null,
  teamScores: [],
  currentTimeRemaining: null,
  initialDuration: null,
  eventBusInstance: null,

  initScores: (teams) => set({ teamScores: initializeScores(teams) }),

  setEventBus: (eventBus) => {
    const currentEventBus = get().eventBusInstance;
    if (currentEventBus) {
      // Clean up old listeners if EventBus is being reset
      currentEventBus.off(GAME_STATE_EVENTS.PHASE_CHANGED, get().handlePhaseChanged);
      currentEventBus.off(GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED, get().handleActiveTeamChanged);
      currentEventBus.off(SCORING_EVENTS.SCORE_UPDATED, get().handleScoreUpdated);
      currentEventBus.off(TIMER_EVENTS.TIMER_TICK, get().handleTimerTick);
      currentEventBus.off(TIMER_EVENTS.TIMER_STARTED, get().handleTimerStarted); // For initial duration
    }

    set({ eventBusInstance: eventBus });

    eventBus.on(GAME_STATE_EVENTS.PHASE_CHANGED, get().handlePhaseChanged);
    eventBus.on(GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED, get().handleActiveTeamChanged);
    eventBus.on(SCORING_EVENTS.SCORE_UPDATED, get().handleScoreUpdated);
    eventBus.on(TIMER_EVENTS.TIMER_TICK, get().handleTimerTick);
    eventBus.on(TIMER_EVENTS.TIMER_STARTED, get().handleTimerStarted); // For initial duration
  },

  // Event handlers defined inside the store to properly access `set`
  handlePhaseChanged: (payload: GameStatePhaseChangedPayload) => {
    set({ currentPhase: payload.currentPhase });
  },

  handleActiveTeamChanged: (payload: GameStateActiveTeamChangedPayload) => {
    set({ activeTeamId: payload.currentTeamId });
  },

  handleScoreUpdated: (payload: ScoringScoreUpdatedPayload) => {
    set(state => ({
      teamScores: state.teamScores.map(p =>
        p.teamId === payload.teamId
          ? { ...p, score: payload.currentScore }
          : p
      ),
    }));
  },

  handleTimerTick: (payload: TimerEventPayload) => {
    if (payload.remaining !== undefined) {
      set({ currentTimeRemaining: payload.remaining });
    }
  },
  
  handleTimerStarted: (payload: TimerEventPayload) => {
    if (payload.duration !== undefined) {
      set({ initialDuration: payload.duration, currentTimeRemaining: payload.duration });
    }
  },

  cleanupListeners: () => {
    const eventBus = get().eventBusInstance;
    if (eventBus) {
      eventBus.off(GAME_STATE_EVENTS.PHASE_CHANGED, get().handlePhaseChanged);
      eventBus.off(GAME_STATE_EVENTS.ACTIVE_TEAM_CHANGED, get().handleActiveTeamChanged);
      eventBus.off(SCORING_EVENTS.SCORE_UPDATED, get().handleScoreUpdated);
      eventBus.off(TIMER_EVENTS.TIMER_TICK, get().handleTimerTick);
      eventBus.off(TIMER_EVENTS.TIMER_STARTED, get().handleTimerStarted);
    }
    set({ eventBusInstance: null }); // Clear the instance
  },
})); 