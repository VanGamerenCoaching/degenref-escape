import { useEffect, useMemo, useRef, useState } from 'react';
import type { QuestionContent } from '../../content/types';
import { AppButton, Panel, ReviewStatusBadge, RuleReference } from '../../components/ui';
import type { AnswerRecord, AnswerValue, GameSession } from '../../storage/gameState';
import { shuffleWithSeed } from '../../utils/random';

interface QuestionInteractionProps {
  question: QuestionContent;
  session: GameSession;
  onSubmit: (value: AnswerValue) => void;
}

export function QuestionInteraction({
  question,
  session,
  onSubmit,
}: QuestionInteractionProps) {
  switch (question.type) {
    case 'sequence':
      return <SequenceQuestion question={question} onSubmit={onSubmit} />;
    case 'multiple-choice':
      return (
        <MultipleChoiceQuestion
          question={question}
          seed={`${session.id}-${question.id}`}
          onSubmit={onSubmit}
        />
      );
    default: {
      const fallbackQuestion = question as unknown as { id?: string };
      return (
        <Panel>
          <h2>Vraagtype nog niet ondersteund</h2>
          <p>Deze vraag kan nog niet worden weergegeven.</p>
          {import.meta.env.DEV && fallbackQuestion.id !== undefined ? (
            <p>Vraag-ID: {fallbackQuestion.id}</p>
          ) : null}
        </Panel>
      );
    }
  }
}

export function FeedbackPanel({
  answer,
  question,
}: {
  answer: AnswerRecord;
  question: QuestionContent;
}) {
  const feedbackRef = useRef<HTMLElement>(null);

  useEffect(() => {
    feedbackRef.current?.focus();
  }, [answer.questionId]);

  return (
    <section
      aria-labelledby={`feedback-title-${question.id}`}
      aria-live="polite"
      className="panel feedback-panel"
      ref={feedbackRef}
      tabIndex={-1}
    >
      <h2 id={`feedback-title-${question.id}`}>
        {answer.isCorrect ? 'Goed beoordeeld' : 'Nog niet goed'}
      </h2>
      <dl className="feedback-list">
        <div>
          <dt>Jouw antwoord</dt>
          <dd>{formatAnswer(question, answer.value)}</dd>
        </div>
        <div>
          <dt>Juiste keuze</dt>
          <dd>{formatCorrectAnswer(question)}</dd>
        </div>
        <div>
          <dt>Uitleg</dt>
          <dd>{question.explanation}</dd>
        </div>
        <div>
          <dt>Regelartikel</dt>
          <dd>
            <RuleReference article={question.article} />
          </dd>
        </div>
        <div>
          <dt>Bronpagina</dt>
          <dd>{question.sourcePage}</dd>
        </div>
        <div>
          <dt>Reglementversie</dt>
          <dd>{question.rulesVersion}</dd>
        </div>
        <div>
          <dt>Reviewstatus</dt>
          <dd>
            <ReviewStatusBadge reviewed={question.reviewed} />
          </dd>
        </div>
        <div>
          <dt>Categorie</dt>
          <dd>{question.category}</dd>
        </div>
      </dl>
      {!question.reviewed ? (
        <p className="review-warning">
          Deze inhoud is nog niet inhoudelijk gecontroleerd en is geen officiele
          leervertaling.
        </p>
      ) : null}
    </section>
  );
}

function MultipleChoiceQuestion({
  onSubmit,
  question,
  seed,
}: {
  onSubmit: (value: AnswerValue) => void;
  question: Extract<QuestionContent, { type: 'multiple-choice' }>;
  seed: string;
}) {
  const isMultiple = Array.isArray(question.correctAnswer);
  const [selected, setSelected] = useState<number[]>([]);
  const options = useMemo(
    () =>
      shuffleWithSeed(
        question.options.map((option, index) => ({ id: index, text: option })),
        seed,
      ),
    [question.options, seed],
  );
  const maxSelections = question.maxSelections ?? question.options.length;
  const canSubmit = selected.length > 0 && selected.length <= maxSelections;

  useEffect(() => {
    setSelected([]);
  }, [question.id]);

  const toggleSelection = (id: number) => {
    setSelected((current) => {
      if (!isMultiple) {
        return [id];
      }

      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= maxSelections) {
        return current;
      }

      return [...current, id].sort((left, right) => left - right);
    });
  };

  return (
    <form
      className="question-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          onSubmit(isMultiple ? selected : selected[0] ?? -1);
        }
      }}
    >
      <fieldset>
        <legend>{question.question}</legend>
        {isMultiple ? (
          <p className="form-hint">Kies maximaal {maxSelections} antwoorden.</p>
        ) : null}
        <div className="answer-grid">
          {options.map((option) => {
            const checked = selected.includes(option.id);
            const inputId = `${question.id}-${option.id}`;

            return (
              <label className="answer-option" htmlFor={inputId} key={option.id}>
                <input
                  checked={checked}
                  id={inputId}
                  name={question.id}
                  onChange={() => toggleSelection(option.id)}
                  type={isMultiple ? 'checkbox' : 'radio'}
                />
                <span>{option.text}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <AppButton disabled={!canSubmit} type="submit">
        Antwoord bevestigen
      </AppButton>
    </form>
  );
}

function SequenceQuestion({
  onSubmit,
  question,
}: {
  onSubmit: (value: AnswerValue) => void;
  question: Extract<QuestionContent, { type: 'sequence' }>;
}) {
  const initialOrder = useMemo(
    () => question.items.map((item, index) => ({ id: index, text: item })),
    [question.items],
  );
  const [order, setOrder] = useState(initialOrder);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const moveItem = (index: number, direction: -1 | 1) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= order.length) {
      return;
    }

    setOrder((current) => {
      const next = [...current];
      const currentItem = next[index];
      const swapItem = next[swapIndex];

      if (currentItem !== undefined && swapItem !== undefined) {
        next[index] = swapItem;
        next[swapIndex] = currentItem;
        setAnnouncement(
          `${currentItem.text} staat nu op positie ${swapIndex + 1}.`,
        );
      }

      return next;
    });
  };

  return (
    <form
      className="question-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(order.map((item) => item.id));
      }}
    >
      <fieldset>
        <legend>{question.question}</legend>
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
        <ol className="sequence-list">
          {order.map((item, index) => (
            <li key={item.id}>
              <span>{item.text}</span>
              <div className="sequence-controls">
                <AppButton
                  aria-label={`${item.text} omhoog`}
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  variant="secondary"
                >
                  Omhoog
                </AppButton>
                <AppButton
                  aria-label={`${item.text} omlaag`}
                  disabled={index === order.length - 1}
                  onClick={() => moveItem(index, 1)}
                  variant="secondary"
                >
                  Omlaag
                </AppButton>
              </div>
            </li>
          ))}
        </ol>
      </fieldset>
      <div className="button-row">
        <AppButton type="submit">Volgorde bevestigen</AppButton>
        <AppButton
          onClick={() => {
            setOrder(initialOrder);
            setAnnouncement('De beginvolgorde is hersteld.');
          }}
          variant="ghost"
        >
          Beginvolgorde herstellen
        </AppButton>
      </div>
    </form>
  );
}

function formatAnswer(question: QuestionContent, value: AnswerValue): string {
  if (question.type === 'sequence' && Array.isArray(value)) {
    return value.map((item) => question.items[Number(item)] ?? String(item)).join(' > ');
  }

  if (question.type === 'multiple-choice' && Array.isArray(value)) {
    return value.map((item) => question.options[Number(item)] ?? String(item)).join(', ');
  }

  if (question.type === 'multiple-choice' && typeof value === 'number') {
    return question.options[value] ?? String(value);
  }

  return String(value);
}

function formatCorrectAnswer(question: QuestionContent): string {
  if (question.type === 'sequence') {
    return question.correctAnswer
      .map((item) => question.items[item] ?? String(item))
      .join(' > ');
  }

  if (Array.isArray(question.correctAnswer)) {
    return question.correctAnswer
      .map((item) => question.options[item] ?? String(item))
      .join(', ');
  }

  return question.options[question.correctAnswer] ?? String(question.correctAnswer);
}
