import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppButton,
  Badge,
  ConfirmDialog,
  EmptyState,
  Panel,
  ProgressBar,
  ScoreDisplay,
  StatusMessage,
} from '../components/ui';
import { useContent } from '../content/ContentContext';
import { getNextMissionId, selectSessionQuestions } from '../features/missions/missionUtils';
import { buildResultSummary, type ResultGroupStat } from '../features/results/resultSummary';
import { useGameState } from '../storage/useGameState';
import { formatPercentage } from '../utils/format';

export function ResultsPage() {
  const content = useContent();
  const { dispatch, state } = useGameState();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const session = state.activeSession;
  const summary = useMemo(
    () => (session === null ? null : buildResultSummary(session, content.questions)),
    [content.questions, session],
  );
  const mission =
    session === null
      ? undefined
      : content.missions.find((candidate) => candidate.id === session.missionId);

  if (session === null || summary === null || mission === undefined) {
    return (
      <EmptyState
        action={
          <Link className="button button--primary" to="/missions">
            Naar faseoverzicht
          </Link>
        }
        headingLevel={1}
        title="Geen resultaat beschikbaar"
      >
        Rond eerst een fase af om je score en oefenadvies te bekijken.
      </EmptyState>
    );
  }

  const wrongQuestionIds = session.answers
    .filter((answer) => !answer.isCorrect)
    .map((answer) => answer.questionId);
  const weakestQuestionIds =
    summary.weakestCategory === null
      ? []
      : session.questionOrder.filter((questionId) => {
          const question = content.questions.find((candidate) => candidate.id === questionId);
          return question?.category === summary.weakestCategory?.id;
        });
  const nextMissionId = getNextMissionId(content.missions, session.missionId);

  const startQuestionSet = (questionIds: readonly string[], fallbackToFullMission: boolean) => {
    const fallbackIds = selectSessionQuestions(content, session.missionId, state.settings).map(
      (question) => question.id,
    );
    const selectedIds =
      questionIds.length > 0 || !fallbackToFullMission ? [...questionIds] : fallbackIds;

    if (selectedIds.length === 0) {
      return;
    }

    dispatch({
      type: 'start-session',
      missionId: session.missionId,
      mode: state.settings.preferredMode,
      selectedSeason: state.settings.selectedSeason,
      questionIds: selectedIds,
      now: new Date().toISOString(),
    });
    void navigate(`/play/${session.missionId}`);
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Resultaat</p>
        <h1>{mission.title}</h1>
        <p>
          Dit resultaat is lokaal berekend. Er wordt geen officiële slagingsclaim
          gedaan.
        </p>
      </section>

      <div className="result-hero">
        <div className="result-hero__summary">
          <span className="eyebrow">Eindstatus</span>
          <strong>
            {summary.missionCompleted ? 'Fase voltooid' : 'Fase nog open'}
          </strong>
          <p>
            {summary.accuracy >= 80
              ? 'Sterke ronde. Gebruik de details om scherp te blijven.'
              : 'Gebruik het advies hieronder om gericht opnieuw te oefenen.'}
          </p>
        </div>
        <ScoreDisplay label="Totale score" points={summary.scorePoints} />
        <div className="result-hero__stat">
          <span>Correct</span>
          <strong>{formatPercentage(summary.accuracy)}</strong>
        </div>
        <div className="result-hero__stat">
          <span>Vragen</span>
          <strong>
            {summary.correctAnswers}/{summary.totalQuestions}
          </strong>
        </div>
      </div>

      <div className="detail-grid">
        <Panel>
          <h2>Scoredetails</h2>
          <dl className="metric-list">
            <div>
              <dt>Correcte antwoorden</dt>
              <dd>{summary.correctAnswers}</dd>
            </div>
            <div>
              <dt>Foutieve antwoorden</dt>
              <dd>{summary.incorrectAnswers}</dd>
            </div>
            <div>
              <dt>Overgeslagen vragen</dt>
              <dd>{summary.skippedQuestions}</dd>
            </div>
            <div>
              <dt>Gebruikte hints</dt>
              <dd>{summary.usedHints}</dd>
            </div>
            <div>
              <dt>Overgebleven levens</dt>
              <dd>{summary.remainingLives ?? 'Niet van toepassing'}</dd>
            </div>
            <div>
              <dt>Voltooiingsstatus</dt>
              <dd>{summary.missionCompleted ? 'Voltooid' : 'Afgebroken of onvolledig'}</dd>
            </div>
            <div>
              <dt>Beste eerdere score</dt>
              <dd>
                {summary.previousBestScore === null
                  ? 'Nog geen'
                  : `${summary.previousBestScore.points} punten`}
              </dd>
            </div>
            <div>
              <dt>Verschil</dt>
              <dd>
                {summary.scoreDifference === null
                  ? 'Niet beschikbaar'
                  : `${summary.scoreDifference >= 0 ? '+' : ''}${summary.scoreDifference}`}
              </dd>
            </div>
          </dl>
          <ProgressBar
            label="Punten ten opzichte van maximum"
            max={summary.maxPoints}
            value={summary.scorePoints}
          />
        </Panel>

        <Panel>
          <h2>Persoonlijk oefenadvies</h2>
          <div className="advice-list">
            {summary.advice.map((advice) => (
              <StatusMessage
                key={advice.id}
                variant={advice.tone === 'strong' ? 'success' : 'warning'}
              >
                {advice.text}
              </StatusMessage>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <h2>Resultaat per categorie</h2>
        <ResultChart groups={summary.categoryResults} />
      </Panel>

      <Panel>
        <h2>Resultaat per moeilijkheidsniveau</h2>
        <ResultChart groups={summary.difficultyResults} />
      </Panel>

      <Panel>
        <h2>Behandelde regelartikelen</h2>
        <div className="tag-row">
          {summary.articles.map((article) => (
            <Link className="rule-reference" key={article} to={`/rules/${article}`}>
              {article}
            </Link>
          ))}
        </div>
      </Panel>

      <Panel>
        <h2>Verder oefenen</h2>
        <div className="button-row button-row--wrap result-actions">
          <AppButton onClick={() => startQuestionSet([], true)}>
            Fase opnieuw spelen
          </AppButton>
          <AppButton
            disabled={wrongQuestionIds.length === 0}
            onClick={() => startQuestionSet(wrongQuestionIds, false)}
            variant="secondary"
          >
            Alleen fouten oefenen
          </AppButton>
          <AppButton
            disabled={weakestQuestionIds.length === 0}
            onClick={() => startQuestionSet(weakestQuestionIds, false)}
            variant="secondary"
          >
            Zwakste categorie oefenen
          </AppButton>
          {nextMissionId === null ? null : (
            <Link className="button button--secondary" to={`/mission/${nextMissionId}`}>
              Volgende fase
            </Link>
          )}
          <Link className="button button--ghost" to="/missions">
            Terug naar faseoverzicht
          </Link>
          <AppButton onClick={() => setConfirmDelete(true)} variant="danger">
            Resultaat verwijderen
          </AppButton>
        </div>
      </Panel>

      <ConfirmDialog
        confirmLabel="Resultaat verwijderen"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          dispatch({ type: 'clear-active-session', now: new Date().toISOString() });
          setConfirmDelete(false);
          void navigate('/missions');
        }}
        open={confirmDelete}
        title="Resultaat verwijderen?"
      >
        Dit verwijdert de actieve resultatensessie uit lokale opslag. Eerdere
        fasevoortgang blijft staan.
      </ConfirmDialog>
    </div>
  );
}

function ResultChart({ groups }: { groups: readonly ResultGroupStat[] }) {
  if (groups.length === 0) {
    return <p>Geen gegevens beschikbaar.</p>;
  }

  return (
    <div className="result-chart">
      {groups.map((group) => (
        <div className="result-chart__row" key={group.id}>
          <div className="result-chart__label">
            <span>{group.label}</span>
            <small>
              {group.correct} goed, {group.incorrect} fout, {group.skipped} open
            </small>
          </div>
          <div
            aria-label={`${group.label}: ${group.accuracy}% correct`}
            className="result-chart__track"
            role="img"
          >
            <span style={{ width: `${group.accuracy}%` }} />
          </div>
          <Badge variant={group.accuracy >= 80 ? 'success' : 'warning'}>
            {group.accuracy}%
          </Badge>
        </div>
      ))}
    </div>
  );
}
