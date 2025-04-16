export interface QuizListItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  questionCount: number;
  likes: number;
  level?: string;
}

export interface TeamData {
  id: string;
  name: string;
}

export interface GameSettingsData {
    music: boolean;
    sounds: boolean;
    animation: boolean;
}

export interface PowerupsData {
    fiftyFifty: boolean;
    doublePoints: boolean;
    comeback: boolean;
}

export interface FullGameConfig {
  quizId: string;
  gameSlug: string;
  teams: TeamData[];
  theme: string;
  settings: GameSettingsData;
  gameFeatures: string;
  intensityTimeLimit: number;
  limitedGuesses: number | null;
  powerups: PowerupsData;
}

export interface PlayerScoreData {
  playerName: string;
  score: number;
}

export interface ScoreUpdatePayload {
  teamId: string;
  currentScore: number;
  livesRemaining: number;
}

export interface GameOverPayload {
  scores: PlayerScoreData[];
  winner?: string;
}

