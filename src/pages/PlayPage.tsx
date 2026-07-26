import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AppButton,
  Badge,
  EmptyState,
  Panel,
  ProgressBar,
  StatusMessage,
} from '../components/ui';
import { useContent } from '../content/ContentContext';
import { selectSessionQuestions } from '../features/missions/missionUtils';
import { FeedbackPanel, QuestionInteraction } from '../features/questions/QuestionInteraction';
import { getAllowedHints, getHintPenalty } from '../storage/gameRules';
import type { AnswerValue } from '../storage/gameState';
import { useGameState } from '../storage/useGameState';

export function PlayPage() {
  const { missionId } = useParams();
  const content = useContent();
  const { dispatch, state } = useGameState();
  const navigate = useNavigate();
  const [reviewAnswerId, setReviewAnswerId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState('');
  const mission = content.missions.find((candidate) => candidate.id === missionId);
  const session =
    state.activeSession?.missionId === missionId ? state.activeSession : null;
  const questionById = useMemo(
    () => new Map(content.questions.map((question) => [question.id, question])),
    [content.questions],
  );
  const currentQuestion =
    session?.currentQuestionId === null || session?.currentQuestionId === undefined
      ? null
      : questionById.get(session.currentQuestionId) ?? null;
  const reviewQuestion =
    reviewAnswerId === null ? null : questionById.get(reviewAnswerId) ?? null;
  const reviewAnswer =
    reviewAnswerId === null
      ? undefined
      : session?.answers.find((answer) => answer.questionId === reviewAnswerId);

  useEffect(() => {
    setReviewAnswerId(null);
    setSavedMessage('');
  }, [session?.id]);

  useEffect(() => {
    if (
      session?.completedAt !== null &&
      session?.completedAt !== undefined &&
      (session.mode === 'exam' || reviewAnswerId === null)
    ) {
      void navigate('/results');
    }
  }, [navigate, reviewAnswerId, session?.completedAt, session?.mode]);

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

  const startSession = (questionIds = playableQuestions.map((question) => question.id)) => {
    dispatch({
      type: 'start-session',
      missionId: mission.id,
      mode: state.settings.preferredMode,
      selectedSeason: state.settings.selectedSeason,
      questionIds,
      now: new Date().toISOString(),
    });
  };

  if (session === null) {
    return (
      <EmptyState
        action={
          <AppButton
            disabled={playableQuestions.length === 0}
            onClick={() => startSession()}
          >
            Sessie starten
          </AppButton>
        }
        headingLevel={1}
        title="Geen actieve sessie"
      >
        Start deze missie om de vragenreeks lokaal op te slaan en te kunnen hervatten.
      </EmptyState>
    );
  }

  if (reviewQuestion !== null && reviewAnswer !== undefined && session.mode !== 'exam') {
    return (
      <div className="page-stack">
        <section className="page-heading">
          <p className="eyebrow">Feedback</p>
          <h1>{mission.title}</h1>
        </section>
        <FeedbackPanel answer={reviewAnswer} question={reviewQuestion} />
        <div className="button-row">
          {session.completedAt === null ? (
            <AppButton onClick={() => setReviewAnswerId(null)}>
              Volgende vraag
            </AppButton>
          ) : (
            <AppButton
              onClick={() => {
                void navigate('/results');
              }}
            >
              Naar resultaat
            </AppButton>
          )}
          <Link className="button button--secondary" to="/rules">
            Regelbibliotheek
          </Link>
        </div>
      </div>
    );
  }

  if (session.completedAt !== null) {
    return (
      <EmptyState
        action={
          <Link className="button button--primary" to="/results">
            Resultaat bekijken
          </Link>
        }
        headingLevel={1}
        title="Missie afgerond"
      >
        De sessie is voltooid. Bekijk je score en oefenadvies.
      </EmptyState>
    );
  }

  if (currentQuestion === null) {
    return (
      <EmptyState headingLevel={1} title="Geen vraag beschikbaar">
        Er is geen vraag gevonden voor de huidige sessie.
      </EmptyState>
    );
  }

  const usedHints = session.usedHints[currentQuestion.id] ?? 0;
  const allowedHints = getAllowedHints(session.mode, currentQuestion.hints.length);
  const visibleHints = currentQuestion.hints.slice(0, usedHints);
  const hintPenalty = getHintPenalty(session.mode, usedHints + 1);
  const progressValue = session.answers.length + 1;

  const submitAnswer = (value: AnswerValue) => {
    if (session.mode !== 'exam') {
      setReviewAnswerId(currentQuestion.id);
    } else {
      setSavedMessage('Antwoord opgeslagen.');
    }

    dispatch({
      type: 'submit-answer',
      question: currentQuestion,
      value,
      missionIds: content.missions.map((item) => item.id),
      now: new Date().toISOString(),
    });
  };

  return (
    <div className="page-stack">
      <section className="page-heading page-heading--compact">
        <p className="eyebrow">Speelsessie</p>
        <h1>{mission.title}</h1>
        <div className="tag-row">
          <Badge variant="secondary">Seizoen {session.selectedSeason}</Badge>
          <Badge variant="ghost">Vraag {progressValue}</Badge>
          {session.remainingLives === null ? null : (
            <Badge variant="warning">{session.remainingLives} levens over</Badge>
          )}
        </div>
      </section>

      <ProgressBar
        label="Missievoortgang"
        max={session.questionOrder.length}
        value={progressValue}
      />

      {session.mode === 'exam' ? (
        <StatusMessage variant="warning">
          Examenmodus is geen officieel examen. Je krijgt pas na afronding inhoudelijke
          feedback.
        </StatusMessage>
      ) : null}

      {savedMessage.length > 0 ? (
        <StatusMessage variant="success">{savedMessage}</StatusMessage>
      ) : null}

      <Panel>
        <div className="question-meta">
          <Badge variant="ghost">{currentQuestion.category}</Badge>
          <Badge variant="ghost">Niveau {currentQuestion.difficulty}</Badge>
          <Badge variant={currentQuestion.reviewed ? 'success' : 'warning'}>
            {currentQuestion.reviewed ? 'Gereviewd' : 'Niet gecontroleerd'}
          </Badge>
        </div>
        <QuestionInteraction
          question={currentQuestion}
          session={session}
          onSubmit={submitAnswer}
        />
      </Panel>

      <Panel labelledBy="hints-title">
        <h2 id="hints-title">Hints</h2>
        {session.mode === 'exam' ? (
          <p>Hints zijn uitgeschakeld in examenmodus.</p>
        ) : (
          <>
            <p aria-atomic="true" aria-live="polite">
              {usedHints}/{allowedHints} hints gebruikt.
              {session.mode === 'practice' && usedHints < allowedHints
                ? ` Volgende hint verlaagt de mogelijke vraagscore naar ${Math.max(
                    0,
                    10 - hintPenalty,
                  )} punten.`
                : ''}
            </p>
            {visibleHints.length > 0 ? (
              <ol aria-live="polite" className="hint-list">
                {visibleHints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ol>
            ) : null}
            <AppButton
              disabled={usedHints >= allowedHints}
              onClick={() =>
                dispatch({
                  type: 'use-hint',
                  question: currentQuestion,
                  now: new Date().toISOString(),
                })
              }
              variant="secondary"
            >
              Hint tonen
            </AppButton>
          </>
        )}
      </Panel>
    </div>
  );
}
