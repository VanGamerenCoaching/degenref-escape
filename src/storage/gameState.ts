export const GAME_MODES = ['learning', 'practice', 'exam'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const EXPERIENCE_LEVELS = ['beginner', 'advanced', 'exam-training'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export type SeasonValue = string;
export type AnswerValue = number | number[] | string | string[];

export interface ScoreState {
  correct: number;
  incorrect: number;
  points: number;
  accuracy: number;
}

export interface AnswerRecord {
  questionId: string;
  category: string;
  article: string;
  difficulty: number;
  value: AnswerValue;
  isCorrect: boolean;
  maxPoints: number;
  hintPenalty: number;
  pointsAwarded: number;
  usedHintsAtAnswer: number;
  answeredAt: string;
  explanationVisible: boolean;
}

export interface GameSession {
  id: string;
  mode: GameMode;
  selectedSeason: SeasonValue;
  missionId: string;
  previousBestScore: ScoreState | null;
  currentQuestionId: string | null;
  currentQuestionIndex: number;
  questionOrder: string[];
  answers: AnswerRecord[];
  score: ScoreState;
  usedHints: Record<string, number>;
  remainingLives: number | null;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
}

export interface MissionProgressStats {
  attempts: number;
  bestScore: ScoreState | null;
  lastCompletedAt: string | null;
}

export interface GameProgress {
  completedMissionIds: string[];
  unlockedMissionIds: string[];
  missionStats: Record<string, MissionProgressStats>;
  errorsByCategory: Record<string, number>;
}

export interface AppSettings {
  selectedSeason: SeasonValue;
  preferredMode: GameMode;
  experienceLevel: ExperienceLevel;
  soundEnabled: boolean;
  reduceMotion: 'system' | 'always';
  showRuleReferences: boolean;
  allowAllMissionsInLearning: boolean;
  excludeUnreviewedQuestions: boolean;
  resultsStorageEnabled: boolean;
}

export interface PersistedAppState {
  schemaVersion: 1;
  settings: AppSettings;
  activeSession: GameSession | null;
  progress: GameProgress;
  startedAt: string;
  lastActivityAt: string;
}
