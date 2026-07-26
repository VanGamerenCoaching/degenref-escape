import type { QuestionContent } from './types';

export interface ContentIssue {
  code: string;
  message: string;
}

export interface ContentValidationResult {
  valid: boolean;
  errors: ContentIssue[];
  warnings: ContentIssue[];
}

const validQuestionTypes = new Set(['multiple-choice', 'sequence']);

export function validateContent(content: unknown): ContentValidationResult {
  const errors: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];

  if (!isRecord(content)) {
    return {
      valid: false,
      errors: [{ code: 'content-format', message: 'Content is geen object.' }],
      warnings,
    };
  }

  const questions = Array.isArray(content.questions)
    ? (content.questions as QuestionContent[])
    : [];
  const missions = Array.isArray(content.missions) ? content.missions : [];
  const links = Array.isArray(content.missionQuestionLinks)
    ? content.missionQuestionLinks
    : [];
  const seenQuestionIds = new Set<string>();

  for (const question of questions) {
    if (!isRecord(question)) {
      errors.push({ code: 'question-format', message: 'Vraag is geen object.' });
      continue;
    }

    const id = getString(question.id);
    if (id === undefined || id.length === 0) {
      errors.push({ code: 'question-id', message: 'Vraag zonder ID gevonden.' });
      continue;
    }

    if (seenQuestionIds.has(id)) {
      errors.push({ code: 'question-id-duplicate', message: `Vraag ${id} is dubbel.` });
    }
    seenQuestionIds.add(id);

    if (!validQuestionTypes.has(getString(question.type) ?? '')) {
      errors.push({ code: 'question-type', message: `Vraag ${id} heeft een ongeldig type.` });
    }
    if ((getString(question.question) ?? '').trim().length === 0) {
      errors.push({ code: 'question-text', message: `Vraag ${id} heeft geen vraagtekst.` });
    }
    if ((getString(question.explanation) ?? '').trim().length === 0) {
      errors.push({ code: 'question-explanation', message: `Vraag ${id} heeft geen uitleg.` });
    }
    if ((getString(question.category) ?? '').trim().length === 0) {
      errors.push({ code: 'question-category', message: `Vraag ${id} heeft geen categorie.` });
    }
    if ((getString(question.article) ?? '').trim().length === 0) {
      errors.push({ code: 'question-article', message: `Vraag ${id} heeft geen regelreferentie.` });
    }
    if ((getString(question.rulesVersion) ?? '').trim().length === 0) {
      errors.push({ code: 'question-version', message: `Vraag ${id} heeft geen reglementversie.` });
    }
    if (typeof question.reviewed !== 'boolean') {
      errors.push({ code: 'question-review', message: `Vraag ${id} heeft geen geldige reviewstatus.` });
    } else if (!question.reviewed) {
      warnings.push({ code: 'question-unreviewed', message: `Vraag ${id} is nog niet inhoudelijk gereviewd.` });
    }

    if (question.type === 'multiple-choice') {
      const options = Array.isArray(question.options) ? question.options : [];
      if (options.length < 2) {
        errors.push({ code: 'question-options', message: `Vraag ${id} heeft minder dan twee opties.` });
      }
      const correctAnswers = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];
      if (
        correctAnswers.some(
          (answer) => typeof answer !== 'number' || answer < 0 || answer >= options.length,
        )
      ) {
        errors.push({ code: 'question-correct-answer', message: `Vraag ${id} verwijst naar een ongeldig correct antwoord.` });
      }
    }
  }

  const missionIds = new Set(
    missions.flatMap((mission) => isRecord(mission) && typeof mission.id === 'string' ? [mission.id] : []),
  );
  const linkedMissionIds = new Set<string>();
  const linkedQuestionMissionIds = new Map<string, string[]>();
  for (const link of links) {
    if (!isRecord(link) || typeof link.missionId !== 'string') {
      continue;
    }
    linkedMissionIds.add(link.missionId);
    if (!missionIds.has(link.missionId)) {
      errors.push({ code: 'unknown-mission', message: `Link verwijst naar onbekende fase ${link.missionId}.` });
    }
    const questionIds = Array.isArray(link.questionIds) ? link.questionIds : [];
    if (questionIds.length === 0) {
      errors.push({ code: 'mission-no-questions', message: `Fase ${link.missionId} heeft geen vragen.` });
    }
    for (const questionId of questionIds) {
      if (typeof questionId !== 'string') {
        continue;
      }

      linkedQuestionMissionIds.set(questionId, [
        ...(linkedQuestionMissionIds.get(questionId) ?? []),
        link.missionId,
      ]);
      if (!seenQuestionIds.has(questionId)) {
        errors.push({ code: 'unknown-question', message: `Fase ${link.missionId} verwijst naar onbekende vraag ${questionId}.` });
      }
    }
  }
  for (const [questionId, missionIdsForQuestion] of linkedQuestionMissionIds) {
    if (missionIdsForQuestion.length > 1) {
      errors.push({
        code: 'duplicate-mission-question-link',
        message: `Vraag ${questionId} is gekoppeld aan meerdere fases: ${missionIdsForQuestion.join(', ')}.`,
      });
    }
  }
  for (const missionId of missionIds) {
    if (!linkedMissionIds.has(missionId)) {
      errors.push({ code: 'mission-no-link', message: `Fase ${missionId} heeft geen vraagkoppeling.` });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function formatContentIssues(result: ContentValidationResult): string {
  return [...result.errors, ...result.warnings]
    .map((issue) => `${issue.code}: ${issue.message}`)
    .join('\n');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
