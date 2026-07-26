import type { GeneratedContent, MissionContent, QuestionContent } from '../../content/types';
import { matchesSelectedSeason } from '../missions/missionUtils';

export type ContentReviewStatusFilter = 'all' | 'reviewed' | 'unreviewed';

export interface ReviewFilters {
  article: string;
  category: string;
  missionId: string;
  query: string;
  reviewStatus: ContentReviewStatusFilter;
  season: string;
}

export interface ReviewQuestionItem {
  question: QuestionContent;
  missionIds: string[];
  missionTitles: string[];
}

export interface ReviewFilterOptions {
  articles: string[];
  categories: string[];
  missions: MissionContent[];
  seasons: string[];
}

export function createDefaultReviewFilters(
  seasons: readonly string[],
): ReviewFilters {
  return {
    article: 'all',
    category: 'all',
    missionId: 'all',
    query: '',
    reviewStatus: 'all',
    season: seasons[0] ?? 'all',
  };
}

export function buildReviewItems(content: GeneratedContent): ReviewQuestionItem[] {
  const missionById = new Map(
    content.missions.map((mission) => [mission.id, mission.title]),
  );
  const missionIdsByQuestionId = new Map<string, string[]>();

  for (const link of content.missionQuestionLinks) {
    for (const questionId of link.questionIds) {
      const missionIds = missionIdsByQuestionId.get(questionId) ?? [];
      missionIdsByQuestionId.set(questionId, [...missionIds, link.missionId]);
    }
  }

  return content.questions.map((question) => {
    const missionIds = missionIdsByQuestionId.get(question.id) ?? [];

    return {
      question,
      missionIds,
      missionTitles: missionIds.map((missionId) => missionById.get(missionId) ?? missionId),
    };
  });
}

export function filterReviewItems(
  items: readonly ReviewQuestionItem[],
  filters: ReviewFilters,
): ReviewQuestionItem[] {
  const normalizedQuery = normalize(filters.query);

  return items.filter((item) => {
    const { question } = item;
    const matchesQuery =
      normalizedQuery.length === 0 || normalize(question.id).includes(normalizedQuery);
    const matchesMission =
      filters.missionId === 'all' || item.missionIds.includes(filters.missionId);
    const matchesArticle = filters.article === 'all' || question.article === filters.article;
    const matchesCategory =
      filters.category === 'all' || question.category === filters.category;
    const matchesSeason =
      filters.season === 'all' || matchesSelectedSeason(question, filters.season);
    const matchesReviewStatus =
      filters.reviewStatus === 'all' ||
      (filters.reviewStatus === 'reviewed' && question.reviewed) ||
      (filters.reviewStatus === 'unreviewed' && !question.reviewed);

    return (
      matchesQuery &&
      matchesMission &&
      matchesArticle &&
      matchesCategory &&
      matchesSeason &&
      matchesReviewStatus
    );
  });
}

export function getReviewFilterOptions(content: GeneratedContent): ReviewFilterOptions {
  return {
    articles: uniqueSorted(content.questions.map((question) => question.article)),
    categories: uniqueSorted(content.questions.map((question) => question.category)),
    missions: [...content.missions].sort((left, right) =>
      left.title.localeCompare(right.title, 'nl'),
    ),
    seasons: [...content.seasonValues],
  };
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'nl'));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
