import type {
  GeneratedContent,
  LessonContent,
  QuestionContent,
  RoomContent,
} from '../../content/types';

export type ReviewFilter = 'all' | 'reviewed' | 'unreviewed';

export interface RuleFilters {
  query: string;
  category: string;
  difficulty: string;
  reviewStatus: ReviewFilter;
  season: string;
}

export interface RuleSearchItem {
  lesson: LessonContent;
  room: RoomContent | null;
  categories: string[];
  difficulties: number[];
  relatedQuestions: QuestionContent[];
  relatedMissionIds: string[];
  seasonValues: string[];
  appliesToEpeeScope: boolean;
  hasSeasonSpecificContent: boolean;
}

export function searchRuleLibrary(
  content: GeneratedContent,
  filters: RuleFilters,
): RuleSearchItem[] {
  return content.lessons
    .filter((lesson) => isApplicableToEpeeScope(content, lesson))
    .map((lesson) => buildRuleSearchItem(content, lesson, filters.season))
    .filter((item) => matchesRuleFilters(item, filters));
}

export function buildRuleSearchItem(
  content: GeneratedContent,
  lesson: LessonContent,
  season = '',
): RuleSearchItem {
  const relatedQuestions = content.questions.filter(
    (question) =>
      question.article === lesson.article && questionMatchesSeason(question, season),
  );
  const relatedQuestionIds = new Set(relatedQuestions.map((question) => question.id));
  const relatedMissionIds = content.missionQuestionLinks.flatMap((link) =>
    link.questionIds.some((questionId) => relatedQuestionIds.has(questionId))
      ? [link.missionId]
      : [],
  );

  return {
    lesson,
    room: content.rooms.find((room) => room.id === lesson.roomId) ?? null,
    categories: [...new Set(relatedQuestions.map((question) => question.category))].sort(),
    difficulties: [...new Set(relatedQuestions.map((question) => question.difficulty))].sort(),
    relatedQuestions,
    relatedMissionIds: [...new Set(relatedMissionIds)],
    seasonValues: extractSeasonValues(lesson.dutchLearningTranslation),
    appliesToEpeeScope: true,
    hasSeasonSpecificContent: hasSeasonSpecificContent(lesson),
  };
}

export function findRuleByArticle(
  content: GeneratedContent,
  articleQuery: string,
  season = '',
): RuleSearchItem | null {
  const lesson = content.lessons.find(
    (candidate) =>
      isApplicableToEpeeScope(content, candidate) &&
      articleMatchesQuery(candidate.article, articleQuery),
  );

  return lesson === undefined ? null : buildRuleSearchItem(content, lesson, season);
}

export function articleMatchesQuery(article: string, query: string): boolean {
  const normalizedArticle = normalizeArticle(article);
  const normalizedQuery = normalizeArticle(query);

  if (normalizedQuery.length === 0) {
    return true;
  }

  return (
    normalizedArticle.includes(normalizedQuery) ||
    normalizedArticle.replace(/^t/, '').includes(normalizedQuery.replace(/^t/, ''))
  );
}

export function normalizeArticle(value: string): string {
  return value.toLowerCase().replaceAll('.', '').replace(/\s+/g, '');
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\d a-z.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function questionMatchesSeason(
  question: QuestionContent,
  selectedSeason: string,
): boolean {
  if (selectedSeason.length === 0) {
    return true;
  }

  const seasonValues = extractSeasonValues(
    `${question.question} ${question.explanation} ${question.rulesVersion}`,
  );

  return seasonValues.length === 0 || seasonValues.includes(selectedSeason);
}

export function isApplicableToEpeeScope(
  content: GeneratedContent,
  lesson: LessonContent,
): boolean {
  const articleNumber = getArticleNumber(lesson.article);

  if (articleNumber === null) {
    return true;
  }

  return !content.metadata.scope.excluded.some((rangeLabel) =>
    rangeContainsArticle(rangeLabel, articleNumber),
  );
}

export function buildSeasonWarning(
  item: RuleSearchItem,
  selectedSeason: string,
): string | null {
  if (!item.hasSeasonSpecificContent) {
    return null;
  }

  const seasonList =
    item.seasonValues.length === 0
      ? 'meerdere seizoenen'
      : item.seasonValues.join(' en ');

  return `Dit artikel bevat seizoensgebonden leerinhoud voor ${seasonList}. Actief seizoen: ${selectedSeason}. Vermeng deze versies niet in een beoordelingsvraag.`;
}

export function getOptionalLearningExplanation(lesson: LessonContent): string | null {
  const candidate = lesson as LessonContent & {
    readonly learningExplanation?: unknown;
    readonly learningNote?: unknown;
    readonly shortExplanation?: unknown;
    readonly shortLearningExplanation?: unknown;
  };
  const value =
    candidate.shortLearningExplanation ??
    candidate.learningExplanation ??
    candidate.learningNote ??
    candidate.shortExplanation;

  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function matchesRuleFilters(item: RuleSearchItem, filters: RuleFilters): boolean {
  const textMatches = ruleMatchesQuery(item, filters.query);

  if (!textMatches) {
    return false;
  }

  if (filters.category !== 'all' && !item.categories.includes(filters.category)) {
    return false;
  }

  if (
    filters.difficulty !== 'all' &&
    !item.difficulties.includes(Number(filters.difficulty))
  ) {
    return false;
  }

  if (filters.reviewStatus === 'reviewed' && !item.lesson.reviewed) {
    return false;
  }

  if (filters.reviewStatus === 'unreviewed' && item.lesson.reviewed) {
    return false;
  }

  return true;
}

function ruleMatchesQuery(item: RuleSearchItem, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length === 0) {
    return true;
  }

  if (articleMatchesQuery(item.lesson.article, normalizedQuery)) {
    return true;
  }

  const searchIndex = normalizeSearchText(
    [
      item.lesson.article,
      item.lesson.section,
      item.lesson.dutchLearningTranslation,
      item.room?.title ?? '',
      item.room?.subtitle ?? '',
      item.categories.join(' '),
      item.relatedQuestions.map((question) => question.question).join(' '),
    ].join(' '),
  );

  return normalizedQuery
    .split(' ')
    .filter((token) => token.length > 0)
    .every((token) => searchIndex.includes(token));
}

function extractSeasonValues(value: string): string[] {
  return [...new Set(value.match(/20\d{2}-20\d{2}/g) ?? [])].sort();
}

function hasSeasonSpecificContent(lesson: LessonContent): boolean {
  return lesson.article === 't.124' || extractSeasonValues(lesson.dutchLearningTranslation).length > 0;
}

function getArticleNumber(article: string): number | null {
  const match = article.match(/^t\.(\d+)$/i);
  return match?.[1] === undefined ? null : Number(match[1]);
}

function rangeContainsArticle(rangeLabel: string, articleNumber: number): boolean {
  const match = rangeLabel.match(/t\.(\d+)-t\.(\d+)/i);

  if (match?.[1] === undefined || match[2] === undefined) {
    return false;
  }

  const start = Number(match[1]);
  const end = Number(match[2]);

  return articleNumber >= start && articleNumber <= end;
}
