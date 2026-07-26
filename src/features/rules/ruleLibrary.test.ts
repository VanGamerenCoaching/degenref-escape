import { describe, expect, it } from 'vitest';
import type { GeneratedContent } from '../../content/types';
import {
  articleMatchesQuery,
  buildSeasonWarning,
  findRuleByArticle,
  searchRuleLibrary,
} from './ruleLibrary';

describe('ruleLibrary', () => {
  it('zoekt tolerant op artikelnummer', () => {
    expect(articleMatchesQuery('t.90', 't90')).toBe(true);
    expect(articleMatchesQuery('t.90', '90')).toBe(true);
    expect(articleMatchesQuery('t.90', 'T. 90')).toBe(true);
    expect(articleMatchesQuery('t.124', '  124  ')).toBe(true);
    expect(articleMatchesQuery('t.124', 'T124')).toBe(true);
  });

  it('vindt woorden uit sectie, kamertitel en leervertaling hoofdletterongevoelig', () => {
    const content = createContent();
    const results = searchRuleLibrary(content, {
      query: '  WEDSTRIJD   zone ',
      category: 'all',
      difficulty: 'all',
      reviewStatus: 'all',
      season: '2025-2026',
    });

    expect(results.map((item) => item.lesson.article)).toContain('t.90');
  });

  it('filtert op categorie en reviewstatus', () => {
    const content = createContent();
    const results = searchRuleLibrary(content, {
      query: '',
      category: 'piste',
      difficulty: 'all',
      reviewStatus: 'unreviewed',
      season: '2025-2026',
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.lesson.article).toBe('t.90');
  });

  it('filtert gereviewde artikelen zonder niet-gecontroleerde inhoud mee te nemen', () => {
    const content = createContent();
    const results = searchRuleLibrary(content, {
      query: '',
      category: 'all',
      difficulty: 'all',
      reviewStatus: 'reviewed',
      season: '2025-2026',
    });

    expect(results.map((item) => item.lesson.article)).toEqual(['t.91']);
  });

  it('filtert op moeilijkheid binnen het gekozen seizoen', () => {
    const content = createContent();
    const results2025 = searchRuleLibrary(content, {
      query: 't.124',
      category: 'non-combativity',
      difficulty: '1',
      reviewStatus: 'all',
      season: '2025-2026',
    });
    const results2026 = searchRuleLibrary(content, {
      query: 't.124',
      category: 'non-combativity',
      difficulty: '1',
      reviewStatus: 'all',
      season: '2026-2027',
    });

    expect(results2025).toHaveLength(1);
    expect(results2026).toHaveLength(0);
  });

  it('houdt seizoensgebonden t.124-vragen gescheiden op de artikelpagina', () => {
    const content = createContent();
    const item2025 = findRuleByArticle(content, '124', '2025-2026');
    const item2026 = findRuleByArticle(content, 't124', '2026-2027');

    expect(item2025?.relatedQuestions.map((question) => question.id)).toEqual([
      'q-t124-general',
      'q-t124-2025',
    ]);
    expect(item2026?.relatedQuestions.map((question) => question.id)).toEqual([
      'q-t124-general',
      'q-t124-2026',
    ]);
    expect(item2026 === null ? null : buildSeasonWarning(item2026, '2026-2027')).toContain(
      'Actief seizoen: 2026-2027',
    );
  });

  it('geeft alleen een seizoenswaarschuwing bij seizoensgebonden regelinhoud', () => {
    const content = createContent();
    const generalItem = findRuleByArticle(content, 't.90', '2025-2026');
    const seasonalItem = findRuleByArticle(content, 't.124', '2025-2026');

    expect(generalItem === null ? null : buildSeasonWarning(generalItem, '2025-2026')).toBeNull();
    expect(
      seasonalItem === null ? null : buildSeasonWarning(seasonalItem, '2025-2026'),
    ).toContain('Vermeng deze versies niet');
  });

  it('toont geen artikelen uit uitgesloten floret- en sabelreeksen', () => {
    const content = createContent();
    const results = searchRuleLibrary(content, {
      query: '',
      category: 'all',
      difficulty: 'all',
      reviewStatus: 'all',
      season: '2025-2026',
    });

    expect(results.map((item) => item.lesson.article)).not.toContain('t.80');
  });
});

function createContent(): GeneratedContent {
  return {
    schemaVersion: 1,
    source: {
      canonicalFile: 'content-source/degenref_content_pack.json',
      supportingFiles: [],
      relationStrategy: 'mission-room-article-match',
    },
    metadata: {
      title: 'Test',
      sourceFile: 'test.pdf',
      sourceEdition: 'FIE Technical Rules - December 2025',
      generatedDate: '2026-07-25',
      scope: {
        included: ['t.1-t.75', 't.90-t.95', 't.107-t.178'],
        excluded: ['t.76-t.89 (floretconventies)', 't.96-t.106 (sabelconventies)'],
        emptyInSource: [],
      },
      disclaimer: 'Niet officieel',
      nonCombativityNote: 't.124 verschilt per seizoen',
    },
    rooms: [
      {
        id: 'room',
        title: 'Wedstrijdzone',
        subtitle: 'Piste en degen',
        articles: 't.1-t.95',
      },
    ],
    lessons: [
      {
        id: 'lesson-1',
        article: 't.90',
        sourcePage: 1,
        roomId: 'room',
        section: 'Pistepositie',
        dutchLearningTranslation: 'Tekst over de wedstrijdzone en de piste',
        sourceVersion: 'FIE Technical Rules - December 2025',
        translationType: 'learning',
        reviewed: false,
        reviewedBy: '',
      },
      {
        id: 'lesson-2',
        article: 't.91',
        sourcePage: 2,
        roomId: 'room',
        section: 'Sanctie',
        dutchLearningTranslation: 'Tekst over sancties',
        sourceVersion: 'FIE Technical Rules - December 2025',
        translationType: 'learning',
        reviewed: true,
        reviewedBy: 'reviewer',
      },
      {
        id: 'lesson-t124',
        article: 't.124',
        sourcePage: 3,
        roomId: 'room',
        section: 'Onwil tot schermen',
        dutchLearningTranslation:
          'Voor seizoen 2025-2026 staat P-geel in de leerkaart. Vanaf seizoen 2026-2027 staat P-rood in de leerkaart.',
        sourceVersion: 'FIE Technical Rules - December 2025',
        translationType: 'learning',
        reviewed: false,
        reviewedBy: '',
      },
      {
        id: 'lesson-floret',
        article: 't.80',
        sourcePage: 4,
        roomId: 'room',
        section: 'Floretconventies',
        dutchLearningTranslation: 'Uitgesloten floretinhoud',
        sourceVersion: 'FIE Technical Rules - December 2025',
        translationType: 'learning',
        reviewed: false,
        reviewedBy: '',
      },
    ],
    missions: [],
    questions: [
      {
        id: 'q-1',
        roomId: 'room',
        type: 'multiple-choice',
        category: 'piste',
        difficulty: 1,
        article: 't.90',
        sourcePage: 1,
        question: 'Vraag',
        options: ['A', 'B'],
        correctAnswer: 0,
        hints: [],
        explanation: 'Uitleg',
        rulesVersion: 'FIE Technical Rules - December 2025',
        reviewed: false,
        reviewedBy: '',
      },
      {
        id: 'q-t124-general',
        roomId: 'room',
        type: 'multiple-choice',
        category: 'non-combativity',
        difficulty: 2,
        article: 't.124',
        sourcePage: 3,
        question: 'Wanneer ontstaat onwil tot schermen?',
        options: ['Na een minuut', 'Nooit'],
        correctAnswer: 0,
        hints: [],
        explanation: 'Deze uitleg noemt geen specifiek seizoen.',
        rulesVersion: 'FIE Technical Rules - December 2025',
        reviewed: false,
        reviewedBy: '',
      },
      {
        id: 'q-t124-2025',
        roomId: 'room',
        type: 'multiple-choice',
        category: 'non-combativity',
        difficulty: 1,
        article: 't.124',
        sourcePage: 3,
        question: 'Welke eerste sanctie geldt in seizoen 2025-2026?',
        options: ['P-geel', 'P-rood'],
        correctAnswer: 0,
        hints: [],
        explanation: 'Seizoen 2025-2026 gebruikt deze leerkaart.',
        rulesVersion: 'FIE Technical Rules - December 2025',
        reviewed: false,
        reviewedBy: '',
      },
      {
        id: 'q-t124-2026',
        roomId: 'room',
        type: 'multiple-choice',
        category: 'non-combativity',
        difficulty: 3,
        article: 't.124',
        sourcePage: 3,
        question: 'Welke eerste sanctie geldt vanaf seizoen 2026-2027?',
        options: ['P-geel', 'P-rood'],
        correctAnswer: 1,
        hints: [],
        explanation: 'Seizoen 2026-2027 gebruikt deze leerkaart.',
        rulesVersion: 'FIE Technical Rules - December 2025',
        reviewed: false,
        reviewedBy: '',
      },
    ],
    missionQuestionLinks: [],
    seasonValues: ['2025-2026'],
  };
}
