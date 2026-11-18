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
  createdAt: Date | string;
  /** Omitted on the public catalog. Game setup loads the full quiz by id. */
  questions?: Question[];
  /** Present on catalog cards so the grid does not need every question body. */
  questionCount?: number;
  likedByMe?: boolean;
  favoritedByMe?: boolean;
  level?: string;
  defaultSettings?: QuizDefaultSettings;
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
    /** Power-down: question timer expires 20% faster */
    fasterClock: boolean;
    /** Power-down: answers blur then clear over 10s */
    blurredVision: boolean;
}

/** Splash Dash pickup power-ups (setup → GameConfig). */
export interface SplashPowerupsData {
  enabled: boolean;
  /** 30 | 60 | 120 */
  intervalSeconds: 30 | 60 | 120;
  radioactive: boolean;
  immunity: boolean;
}

/** Ninja Climb starting power-ups (setup → GameConfig). */
export interface NinjaPowerupsData {
  enabled: boolean;
  teleport: boolean;
  rope: boolean;
  smoke: boolean;
  shortcuts: boolean;
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
  /** Ninja Climb and Tug of War match length. Regular is the classroom default. */
  gameLength?: 'short' | 'regular' | 'long';
  limitedGuesses: number | null;
  powerups: PowerupsData;
  splashPowerups?: SplashPowerupsData;
  ninjaPowerups?: NinjaPowerupsData;
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

