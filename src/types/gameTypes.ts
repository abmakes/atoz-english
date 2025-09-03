export interface QuizListItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  statistics: {
    favoritesCount: number;
    playsCount: number;
    likes: number;
  };
  tags: string[];
  authorId: string;
  createdAt: Date;
  questions: Question[];
  likes: number;
  level?: string;
  defaultSettings?: QuizDefaultSettings; // Quiz default settings
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
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
    timeExtension: boolean;
    comeback: boolean;
}

export interface QuizDefaultSettings {
  theme: string;
  powerUps: string[];
  gameMode: string;
  guessOptions: string;
  timeLimit: string;
  music: boolean;
  soundEffects: boolean;
}

export interface GameSetupData {
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

