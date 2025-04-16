import { EventBus } from '../core/EventBus';
import { SCORING_EVENTS, ScoringScoreUpdatedPayload, ScoringLifeLostPayload, ScoringTeamEliminatedPayload } from '../core/EventTypes';
import { StorageManager } from '../core/StorageManager';
import { GameModeConfig, TeamConfig, isLivesModeConfig } from '../config/GameConfig';

/**
 * Interface for team score data with optional metadata.
 */
export interface TeamScoreData {
  teamId: string | number;
  score: number;
  lives?: number;
  maxLives?: number;
  displayName?: string;
  color?: string;
  active?: boolean;
  eliminated?: boolean;
}

/**
 * ScoringManager handles scoring and lives tracking for all teams in the game.
 * It provides methods to modify scores, track lives, and persists data via StorageManager.
 */
export class ScoringManager {
  private scores: Map<string | number, number> = new Map();
  private lives: Map<string | number, number> = new Map();
  private maxLives: Map<string | number, number> = new Map();
  private teams: Map<string | number, TeamConfig> = new Map();
  private eliminatedTeams: Set<string | number> = new Set();

  private readonly STORAGE_KEY_SCORES = 'scoring/scores';
  private readonly STORAGE_KEY_LIVES = 'scoring/lives';
  private readonly STORAGE_KEY_ELIMINATED = 'scoring/eliminated';

  constructor(
    private eventBus: EventBus,
    private storageManager: StorageManager
  ) {
    this._loadFromStorage();
  }

  /**
   * Initializes the ScoringManager with team configurations and game mode.
   * @param teams - Array of team configurations.
   * @param gameMode - The game mode configuration.
   */
  public init(teams: TeamConfig[], gameMode: GameModeConfig): void {
    console.log('Initializing ScoringManager...');
    
    // Store teams for reference
    this.teams.clear();
    teams.forEach(team => {
      this.teams.set(team.id, team);
    });

    // Initialize scores and lives based on game mode
    teams.forEach(team => {
      // Set initial score (from team config or default to 0)
      const initialScore = team.startingResources?.score ?? 0;
      this.scores.set(team.id, initialScore);

      // Handle lives mode initialization
      if (isLivesModeConfig(gameMode)) {
        const initialLives = team.initialLives ?? gameMode.initialLives;
        const maxLives = gameMode.maxLives ?? initialLives;
        
        this.lives.set(team.id, initialLives);
        this.maxLives.set(team.id, maxLives);
      }
    });

    // Clear eliminated teams on init
    this.eliminatedTeams.clear();

    this._saveToStorage();
    console.log(`ScoringManager initialized with ${teams.length} teams.`);
  }

  // --- Score Management ---

  /**
   * Adds points to a team's score.
   * @param teamId - The ID of the team.
   * @param points - The number of points to add (must be positive).
   * @returns The new score value.
   */
  public addScore(teamId: string | number, points: number): number {
    if (points <= 0) {
      console.warn(`ScoringManager: Cannot add ${points} to score. Points must be positive.`);
      return this.getScore(teamId);
    }

    const currentScore = this.getScore(teamId);
    const newScore = currentScore + points;
    
    this.scores.set(teamId, newScore);
    this._saveToStorage();
    
    // Emit score updated event
    const payload: ScoringScoreUpdatedPayload = {
      teamId,
      previousScore: currentScore,
      currentScore: newScore,
      delta: points
    };
    this.eventBus.emit(SCORING_EVENTS.SCORE_UPDATED, payload);
    
    return newScore;
  }

  /**
   * Subtracts points from a team's score.
   * @param teamId - The ID of the team.
   * @param points - The number of points to subtract (must be positive).
   * @returns The new score value.
   */
  public subtractScore(teamId: string | number, points: number): number {
    if (points <= 0) {
      console.warn(`ScoringManager: Cannot subtract ${points} from score. Points must be positive.`);
      return this.getScore(teamId);
    }

    const currentScore = this.getScore(teamId);
    const newScore = Math.max(0, currentScore - points); // Prevent negative scores
    
    this.scores.set(teamId, newScore);
    this._saveToStorage();
    
    // Emit score updated event
    const payload: ScoringScoreUpdatedPayload = {
      teamId,
      previousScore: currentScore,
      currentScore: newScore,
      delta: currentScore - newScore // Actual points deducted
    };
    this.eventBus.emit(SCORING_EVENTS.SCORE_UPDATED, payload);
    
    return newScore;
  }

  /**
   * Sets a team's score to a specific value.
   * @param teamId - The ID of the team.
   * @param score - The new score value (must be non-negative).
   * @returns The new score value.
   */
  public setScore(teamId: string | number, score: number): number {
    if (score < 0) {
      console.warn(`ScoringManager: Cannot set score to ${score}. Score must be non-negative.`);
      return this.getScore(teamId);
    }

    const currentScore = this.getScore(teamId);
    this.scores.set(teamId, score);
    this._saveToStorage();
    
    // Emit score updated event
    const payload: ScoringScoreUpdatedPayload = {
      teamId,
      previousScore: currentScore,
      currentScore: score,
      delta: score - currentScore
    };
    this.eventBus.emit(SCORING_EVENTS.SCORE_UPDATED, payload);
    
    return score;
  }

  /**
   * Gets a team's current score.
   * @param teamId - The ID of the team.
   * @returns The team's current score, or 0 if the team doesn't exist.
   */
  public getScore(teamId: string | number): number {
    return this.scores.get(teamId) ?? 0;
  }

  /**
   * Gets all teams' scores as a map of teamId to score.
   * @returns A record mapping teamId to score.
   */
  public getAllScores(): Record<string | number, number> {
    const result: Record<string | number, number> = {};
    this.scores.forEach((score, teamId) => {
      result[teamId] = score;
    });
    return result;
  }

  /**
   * Resets a team's score to 0.
   * @param teamId - The ID of the team.
   */
  public resetScore(teamId: string | number): void {
    this.setScore(teamId, 0);
  }

  /**
   * Resets all teams' scores to 0.
   */
  public resetAllScores(): void {
    this.scores.forEach((_, teamId) => {
      this.resetScore(teamId);
    });
  }

  // --- Lives Management ---

  /**
   * Sets the number of lives for a team.
   * @param teamId - The ID of the team.
   * @param lives - The number of lives to set (must be non-negative).
   * @returns The number of lives set.
   */
  public setLives(teamId: string | number, lives: number): number {
    if (lives < 0) {
      console.warn(`ScoringManager: Cannot set lives to ${lives}. Lives must be non-negative.`);
      return this.getLives(teamId);
    }

    const currentLives = this.getLives(teamId);
    const maxLives = this.getMaxLives(teamId);
    
    // Cap at max lives if defined
    const newLives = maxLives > 0 ? Math.min(lives, maxLives) : lives;
    
    this.lives.set(teamId, newLives);
    this._saveToStorage();
    
    // Check if team should be eliminated
    if (newLives === 0 && currentLives > 0) {
      this._eliminateTeam(teamId);
    }
    // Check if team should be un-eliminated
    else if (newLives > 0 && currentLives === 0) {
      this._unEliminateTeam(teamId);
    }
    
    return newLives;
  }

  /**
   * Adds lives to a team.
   * @param teamId - The ID of the team.
   * @param count - The number of lives to add (must be positive).
   * @returns The new lives value.
   */
  public addLives(teamId: string | number, count: number): number {
    if (count <= 0) {
      console.warn(`ScoringManager: Cannot add ${count} lives. Count must be positive.`);
      return this.getLives(teamId);
    }

    const currentLives = this.getLives(teamId);
    return this.setLives(teamId, currentLives + count);
  }

  /**
   * Removes lives from a team.
   * @param teamId - The ID of the team.
   * @param count - The number of lives to remove (must be positive).
   * @returns The new lives value.
   */
  public removeLives(teamId: string | number, count: number): number {
    if (count <= 0) {
      console.warn(`ScoringManager: Cannot remove ${count} lives. Count must be positive.`);
      return this.getLives(teamId);
    }

    const currentLives = this.getLives(teamId);
    const newLives = Math.max(0, currentLives - count);
    
    // Set lives and check elimination
    this.setLives(teamId, newLives);
    
    // Emit lives lost event
    const payload: ScoringLifeLostPayload = {
      teamId,
      remainingLives: newLives
    };
    this.eventBus.emit(SCORING_EVENTS.LIFE_LOST, payload);
    
    return newLives;
  }

  /**
   * Gets a team's current lives.
   * @param teamId - The ID of the team.
   * @returns The team's current lives, or 0 if the team doesn't exist.
   */
  public getLives(teamId: string | number): number {
    return this.lives.get(teamId) ?? 0;
  }

  /**
   * Gets a team's maximum lives.
   * @param teamId - The ID of the team.
   * @returns The team's maximum lives, or 0 if unlimited or not defined.
   */
  public getMaxLives(teamId: string | number): number {
    return this.maxLives.get(teamId) ?? 0;
  }

  /**
   * Gets all teams' lives as a map of teamId to lives.
   * @returns A record mapping teamId to lives.
   */
  public getAllLives(): Record<string | number, number> {
    const result: Record<string | number, number> = {};
    this.lives.forEach((lives, teamId) => {
      result[teamId] = lives;
    });
    return result;
  }

  /**
   * Checks if a team is eliminated (has zero lives).
   * @param teamId - The ID of the team.
   * @returns True if the team is eliminated, false otherwise.
   */
  public isTeamEliminated(teamId: string | number): boolean {
    return this.eliminatedTeams.has(teamId);
  }

  /**
   * Gets all eliminated teams.
   * @returns An array of eliminated team IDs.
   */
  public getEliminatedTeams(): (string | number)[] {
    return Array.from(this.eliminatedTeams);
  }

  /**
   * Checks if the game is over (at least one team has zero lives).
   * @param requireAllEliminated - If true, only returns true when all teams are eliminated.
   * @returns True if the game is over, false otherwise.
   */
  public isGameOver(requireAllEliminated: boolean = false): boolean {
    if (this.eliminatedTeams.size === 0) {
      return false;
    }
    
    if (requireAllEliminated) {
      // All teams must be eliminated
      return this.eliminatedTeams.size === this.teams.size;
    }
    
    // At least one team is eliminated
    return this.eliminatedTeams.size > 0;
  }

  // --- Team Data ---

  /**
   * Gets comprehensive data for a specific team.
   * @param teamId - The ID of the team.
   * @returns The team's score data, or null if the team doesn't exist.
   */
  public getTeamData(teamId: string | number): TeamScoreData | null {
    const team = this.teams.get(teamId);
    if (!team) {
      return null;
    }
    
    return {
      teamId,
      score: this.getScore(teamId),
      lives: this.getLives(teamId),
      maxLives: this.getMaxLives(teamId),
      displayName: team.name,
      color: team.color,
      eliminated: this.isTeamEliminated(teamId)
    };
  }

  /**
   * Gets comprehensive data for all teams.
   * @returns An array of team score data.
   */
  public getAllTeamData(): TeamScoreData[] {
    return Array.from(this.teams.keys()).map(teamId => 
      this.getTeamData(teamId) as TeamScoreData
    );
  }

  // --- Private Helper Methods ---

  private _eliminateTeam(teamId: string | number): void {
    if (this.eliminatedTeams.has(teamId)) {
      return; // Already eliminated
    }
    
    this.eliminatedTeams.add(teamId);
    this._saveToStorage();
    
    // Emit team eliminated event
    const payload: ScoringTeamEliminatedPayload = {
      teamId
    };
    this.eventBus.emit(SCORING_EVENTS.TEAM_ELIMINATED, payload);
  }

  private _unEliminateTeam(teamId: string | number): void {
    if (!this.eliminatedTeams.has(teamId)) {
      return; // Not eliminated
    }
    
    this.eliminatedTeams.delete(teamId);
    this._saveToStorage();
  }

  private _loadFromStorage(): void {
    try {
      const savedScores = this.storageManager.get<Record<string, number>>(this.STORAGE_KEY_SCORES);
      if (savedScores) {
        this.scores = new Map(Object.entries(savedScores));
      }
      
      const savedLives = this.storageManager.get<Record<string, number>>(this.STORAGE_KEY_LIVES);
      if (savedLives) {
        this.lives = new Map(Object.entries(savedLives));
      }
      
      const savedEliminated = this.storageManager.get<string[]>(this.STORAGE_KEY_ELIMINATED);
      if (savedEliminated) {
        this.eliminatedTeams = new Set(savedEliminated);
      }
    } catch (error) {
      console.error('ScoringManager: Failed to load data from storage', error);
    }
  }

  private _saveToStorage(): void {
    try {
      // Save scores
      const scoresObj = Object.fromEntries(this.scores);
      this.storageManager.set(this.STORAGE_KEY_SCORES, scoresObj);
      
      // Save lives
      const livesObj = Object.fromEntries(this.lives);
      this.storageManager.set(this.STORAGE_KEY_LIVES, livesObj);
      
      // Save eliminated teams
      const eliminatedArray = Array.from(this.eliminatedTeams);
      this.storageManager.set(this.STORAGE_KEY_ELIMINATED, eliminatedArray);
    } catch (error) {
      console.error('ScoringManager: Failed to save data to storage', error);
    }
  }

  /**
   * Cleans up resources when the ScoringManager is no longer needed.
   */
  public destroy(): void {
    console.log('Destroying ScoringManager...');
    
    // Reset internal state
    this.scores.clear();
    this.lives.clear();
    this.maxLives.clear();
    this.teams.clear();
    this.eliminatedTeams.clear();
    
    // Clear from storage
    this.storageManager.remove(this.STORAGE_KEY_SCORES);
    this.storageManager.remove(this.STORAGE_KEY_LIVES);
    this.storageManager.remove(this.STORAGE_KEY_ELIMINATED);
  }
}
