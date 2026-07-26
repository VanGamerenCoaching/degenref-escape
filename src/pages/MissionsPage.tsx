import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Card,
  DifficultyBadge,
  EmptyState,
  ProgressBar,
  ReviewStatusBadge,
} from '../components/ui';
import { useContent } from '../content/ContentContext';
import {
  getMissionCategories,
  getMissionDifficulty,
  getMissionQuestions,
  getMissionStatus,
  type MissionStatus,
} from '../features/missions/missionUtils';
import { formatPercentage } from '../utils/format';
import { useGameState } from '../storage/useGameState';

const statusLabels: Record<MissionStatus | 'all' | 'not-started' | 'in-progress', string> = {
  all: 'Alle fases',
  available: 'Open',
  completed: 'Voltooid',
  locked: 'Vergrendeld',
  'not-started': 'Niet gestart',
  'in-progress': 'Bezig',
};

const statusFilterOptions: Array<Exclude<keyof typeof statusLabels, 'locked'>> = [
  'all',
  'not-started',
  'in-progress',
  'available',
  'completed',
];

export function MissionsPage() {
  const content = useContent();
  const { state } = useGameState();
  const [statusFilter, setStatusFilter] = useState<
    MissionStatus | 'all' | 'not-started' | 'in-progress'
  >('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const categories = useMemo(
    () => [...new Set(content.questions.map((question) => question.category))].sort(),
    [content.questions],
  );
  const missionCards = content.missions.map((mission) => {
    const questions = getMissionQuestions(content, mission.id);
    const status = getMissionStatus(mission, state.progress);
    const stats = state.progress.missionStats[mission.id];
    const isInProgress = state.activeSession?.missionId === mission.id;

    return {
      mission,
      questions,
      status,
      isInProgress,
      categories: getMissionCategories(questions),
      difficulty: getMissionDifficulty(questions),
      stats,
    };
  });
  const visibleMissions = missionCards.filter((card) => {
    const statusMatch =
      statusFilter === 'all' ||
      card.status === statusFilter ||
      (statusFilter === 'in-progress' && card.isInProgress) ||
      (statusFilter === 'not-started' && card.stats === undefined);
    const difficultyMatch =
      difficultyFilter === 'all' || String(card.difficulty) === difficultyFilter;
    const categoryMatch =
      categoryFilter === 'all' || card.categories.includes(categoryFilter);

    return statusMatch && difficultyMatch && categoryMatch;
  });

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Toernooifases</p>
        <h1>Kies een situatie uit de wedstrijddag</h1>
        <p>
          Alle fases staan direct open. Ze volgen herkenbare momenten die een
          degenscheidsrechter tijdens een toernooi tegenkomt.
        </p>
      </section>

      <section className="mission-toolbar" aria-labelledby="mission-filters-title">
        <div>
          <h2 id="mission-filters-title">Fases filteren</h2>
          <p className="result-count">
            {visibleMissions.length} van {missionCards.length} fases zichtbaar
          </p>
        </div>
        <div className="filters" aria-label="Fasefilters">
          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as typeof statusFilter)
              }
            >
              {statusFilterOptions.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Moeilijkheid
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
            >
              <option value="all">Alle niveaus</option>
              <option value="1">Beginner</option>
              <option value="2">Gevorderd</option>
              <option value="3">Examentraining</option>
            </select>
          </label>
          <label>
            Hoofdcategorie
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">Alle categorieën</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {visibleMissions.length === 0 ? (
        <EmptyState title="Geen fases gevonden">
          Pas de filters aan om weer fases te tonen.
        </EmptyState>
      ) : (
        <div className="mission-grid">
          {visibleMissions.map((card) => (
            <Card
              className={`mission-card mission-card--${card.status}`}
              key={card.mission.id}
            >
              <div className="mission-card__rail" aria-hidden="true" />
              <div className="mission-card__header">
                <h2>{card.mission.title}</h2>
                <Badge variant={card.status === 'completed' ? 'success' : 'secondary'}>
                  {statusLabels[card.status]}
                </Badge>
              </div>
              <p>{card.mission.story}</p>
              <div className="tag-row">
                <DifficultyBadge difficulty={card.difficulty} />
                <ReviewStatusBadge reviewed={card.mission.reviewed} />
                {card.categories.slice(0, 3).map((category) => (
                  <Badge key={category} variant="ghost">
                    {category}
                  </Badge>
                ))}
              </div>
              <dl className="metric-list">
                <div>
                  <dt>Vragen</dt>
                  <dd>{card.questions.length}</dd>
                </div>
                <div>
                  <dt>Omvang</dt>
                  <dd>{describeMissionSize(card.questions.length)}</dd>
                </div>
                <div>
                  <dt>Pogingen</dt>
                  <dd>{card.stats?.attempts ?? 0}</dd>
                </div>
                <div>
                  <dt>Beste score</dt>
                  <dd>
                    {card.stats?.bestScore === null || card.stats?.bestScore === undefined
                      ? 'Nog geen'
                      : `${card.stats.bestScore.points} p, ${formatPercentage(card.stats.bestScore.accuracy)}`}
                  </dd>
                </div>
              </dl>
              {card.isInProgress && state.activeSession !== null ? (
                <ProgressBar
                  label="Voortgang"
                  max={state.activeSession.questionOrder.length}
                  value={state.activeSession.answers.length}
                />
              ) : null}
              <div className="mission-card__action">
                <Link className="button button--primary" to={`/mission/${card.mission.id}`}>
                  Fase openen
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function describeMissionSize(questionCount: number): string {
  if (questionCount <= 5) {
    return 'compacte fase';
  }

  if (questionCount <= 12) {
    return 'middelgrote fase';
  }

  return 'uitgebreide fase';
}
