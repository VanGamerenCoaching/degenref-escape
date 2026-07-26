import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AppButton,
  Badge,
  DifficultyBadge,
  Panel,
  ReviewStatusBadge,
  RuleReference,
  StatusMessage,
} from '../components/ui';
import { useContent } from '../content/ContentContext';
import {
  getMissionCategories,
  getMissionDifficulty,
  getMissionQuestions,
  getMissionStatus,
  selectSessionQuestions,
} from '../features/missions/missionUtils';
import { useGameState } from '../storage/useGameState';

export function MissionDetailPage() {
  const { missionId } = useParams();
  const content = useContent();
  const { dispatch, state } = useGameState();
  const navigate = useNavigate();
  const mission = content.missions.find((candidate) => candidate.id === missionId);
  const allQuestions = useMemo(
    () => (mission === undefined ? [] : getMissionQuestions(content, mission.id)),
    [content, mission],
  );

  if (mission === undefined) {
    return (
      <Panel>
        <h1>Missie niet gevonden</h1>
        <Link className="button button--secondary" to="/missions">
          Terug naar missieoverzicht
        </Link>
      </Panel>
    );
  }

  const playableQuestions = selectSessionQuestions(content, mission.id, state.settings);
  const status = getMissionStatus(mission, content.missions, state.progress, state.settings);
  const stats = state.progress.missionStats[mission.id];
  const difficulty = getMissionDifficulty(allQuestions);
  const categories = getMissionCategories(allQuestions);
  const canStart = status !== 'locked' && playableQuestions.length > 0;

  const startMission = () => {
    if (!canStart) {
      return;
    }

    dispatch({
      type: 'start-session',
      missionId: mission.id,
      mode: state.settings.preferredMode,
      selectedSeason: state.settings.selectedSeason,
      questionIds: playableQuestions.map((question) => question.id),
      now: new Date().toISOString(),
    });
    void navigate(`/play/${mission.id}`);
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Missie</p>
        <h1>{mission.title}</h1>
        <p>{mission.story}</p>
      </section>

      {!mission.reviewed ? (
        <StatusMessage title="Niet gecontroleerde missie" variant="warning">
          Deze missie is speelbaar als leerinhoud, maar niet inhoudelijk
          gecontroleerd. De app suggereert geen officiële goedkeuring.
        </StatusMessage>
      ) : null}

      <div className="detail-grid">
        <Panel className="mission-brief">
          <h2>Missiedoel</h2>
          <p>{mission.passCondition}</p>
          <h3>Beloning</h3>
          <p>{mission.reward}</p>
          <div className="tag-row">
            <DifficultyBadge difficulty={difficulty} />
            <ReviewStatusBadge reviewed={mission.reviewed} />
            {categories.map((category) => (
              <Badge key={category} variant="ghost">
                {category}
              </Badge>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2>Leerdoelen en opdrachten</h2>
          <ul className="check-list">
            {mission.tasks.map((task) => (
              <li key={`${task.type}-${task.instruction}`}>{task.instruction}</li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2>Regelartikelen</h2>
          <div className="tag-row">
            {mission.articles.map((article) => (
              <RuleReference article={article} key={article} />
            ))}
          </div>
          <p>{playableQuestions.length} opdrachten beschikbaar voor je instellingen.</p>
        </Panel>

        <Panel>
          <h2>Voortgang</h2>
          <div className="mission-readiness" aria-label="Missiestatus">
            <span>{playableQuestions.length} opdrachten klaar</span>
            <span>Seizoen {state.settings.selectedSeason}</span>
          </div>
          <dl className="metric-list">
            <div>
              <dt>Pogingen</dt>
              <dd>{stats?.attempts ?? 0}</dd>
            </div>
            <div>
              <dt>Voltooid</dt>
              <dd>
                {state.progress.completedMissionIds.includes(mission.id) ? 'Ja' : 'Nee'}
              </dd>
            </div>
            <div>
              <dt>Beste score</dt>
              <dd>{stats?.bestScore?.points ?? 'Nog geen'}</dd>
            </div>
          </dl>
          {status === 'locked' ? (
            <StatusMessage variant="warning">
              Rond eerst de vorige missie af, of maak alle missies beschikbaar in
              leermodus via instellingen.
            </StatusMessage>
          ) : null}
          {playableQuestions.length === 0 ? (
            <StatusMessage variant="danger">
              Er zijn geen vragen beschikbaar met de huidige filters.
            </StatusMessage>
          ) : null}
          <div className="button-row">
            <AppButton disabled={!canStart} onClick={startMission}>
              {stats?.lastCompletedAt === null || stats?.lastCompletedAt === undefined
                ? 'Start missie'
                : 'Speel opnieuw'}
            </AppButton>
            <Link className="button button--secondary" to="/missions">
              Missieoverzicht
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
