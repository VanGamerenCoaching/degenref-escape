export const QUESTION_TYPES = ['multiple-choice', 'sequence'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface ContentMetadata {
  title: string;
  sourceFile: string;
  sourceEdition: string;
  generatedDate: string;
  scope: {
    included: string[];
    excluded: string[];
    emptyInSource: string[];
  };
  disclaimer: string;
  nonCombativityNote: string;
}

export interface RoomContent {
  id: string;
  title: string;
  subtitle: string;
  articles: string;
}

export interface LessonContent {
  id: string;
  article: string;
  sourcePage: number;
  roomId: string;
  section: string;
  dutchLearningTranslation: string;
  sourceVersion: string;
  translationType: string;
  reviewed: boolean;
  reviewedBy: string;
}

export interface MissionTaskContent {
  type: string;
  instruction: string;
}

export interface MissionContent {
  id: string;
  roomId: string;
  title: string;
  story: string;
  articles: string[];
  tasks: MissionTaskContent[];
  passCondition: string;
  reward: string;
  reviewed: boolean;
}

export interface BaseQuestionContent {
  id: string;
  roomId: string;
  type: QuestionType;
  category: string;
  difficulty: number;
  article: string;
  sourcePage: number;
  question: string;
  hints: string[];
  explanation: string;
  rulesVersion: string;
  reviewed: boolean;
  reviewedBy: string;
}

export interface MultipleChoiceQuestionContent extends BaseQuestionContent {
  type: 'multiple-choice';
  options: string[];
  correctAnswer: number | number[];
  maxSelections?: number;
}

export interface SequenceQuestionContent extends BaseQuestionContent {
  type: 'sequence';
  items: string[];
  correctAnswer: number[];
}

export type QuestionContent =
  | MultipleChoiceQuestionContent
  | SequenceQuestionContent;

export interface MissionQuestionLink {
  missionId: string;
  questionIds: string[];
}

export interface GeneratedContent {
  schemaVersion: 1;
  source: {
    canonicalFile: string;
    supportingFiles: string[];
    relationStrategy: 'mission-room-article-match' | 'tournament-phase-article-map';
  };
  metadata: ContentMetadata;
  rooms: RoomContent[];
  lessons: LessonContent[];
  missions: MissionContent[];
  questions: QuestionContent[];
  missionQuestionLinks: MissionQuestionLink[];
  seasonValues: string[];
}
