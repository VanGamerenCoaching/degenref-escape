import { useMemo, useState } from 'react';
import {
  AppButton,
  Badge,
  Panel,
  ReviewStatusBadge,
  RuleReference,
  StatusMessage,
} from '../components/ui';
import { useContent } from '../content/ContentContext';
import type { QuestionContent } from '../content/types';
import {
  buildReviewItems,
  createDefaultReviewFilters,
  filterReviewItems,
  getReviewFilterOptions,
  type ContentReviewStatusFilter,
  type ReviewFilters,
  type ReviewQuestionItem,
} from '../features/review/reviewFilters';
import { buildReviewReport } from '../features/review/reviewReport';
import {
  REVIEW_NOTE_STATUSES,
  createReviewNote,
  loadReviewNotes,
  saveReviewNotes,
  upsertReviewNote,
  type ReviewNote,
  type ReviewNoteStatus,
} from '../storage/reviewNotesStorage';
import { formatDateTime } from '../utils/format';

const reviewNoteStatusLabels: Record<ReviewNoteStatus, string> = {
  akkoord: 'Akkoord',
  aanpassen: 'Aanpassen',
  controleren: 'Controleren',
};
const MAX_VISIBLE_REVIEW_ITEMS = 60;

interface ReviewNoteDraft {
  status: ReviewNoteStatus;
  text: string;
}

export function ReviewPage() {
  const content = useContent();
  const [filters, setFilters] = useState<ReviewFilters>(() =>
    createDefaultReviewFilters(content.seasonValues),
  );
  const [reviewerName, setReviewerName] = useState('');
  const [notes, setNotes] = useState<ReviewNote[]>(() =>
    typeof window === 'undefined' ? [] : loadReviewNotes(window.localStorage),
  );
  const [drafts, setDrafts] = useState<Record<string, ReviewNoteDraft>>({});
  const [statusMessage, setStatusMessage] = useState('');

  const reviewItems = useMemo(() => buildReviewItems(content), [content]);
  const filterOptions = useMemo(() => getReviewFilterOptions(content), [content]);
  const filteredItems = useMemo(
    () => filterReviewItems(reviewItems, filters),
    [filters, reviewItems],
  );
  const visibleItems = useMemo(
    () => filteredItems.slice(0, MAX_VISIBLE_REVIEW_ITEMS),
    [filteredItems],
  );
  const noteByQuestionId = useMemo(
    () => new Map(notes.map((note) => [note.questionId, note])),
    [notes],
  );

  const updateFilter = <Key extends keyof ReviewFilters>(
    key: Key,
    value: ReviewFilters[Key],
  ) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  };

  const getDraft = (questionId: string): ReviewNoteDraft => {
    const draft = drafts[questionId];
    const savedNote = noteByQuestionId.get(questionId);

    if (draft !== undefined) {
      return draft;
    }

    return savedNote === undefined
      ? { status: 'controleren', text: '' }
      : { status: savedNote.status, text: savedNote.text };
  };

  const updateDraft = (questionId: string, draft: Partial<ReviewNoteDraft>) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [questionId]: { ...getDraft(questionId), ...draft },
    }));
  };

  const saveNote = (questionId: string) => {
    const draft = getDraft(questionId);
    const note = createReviewNote({
      questionId,
      status: draft.status,
      text: draft.text,
      date: new Date().toISOString(),
      reviewerName,
    });
    const updatedNotes = upsertReviewNote(notes, note);

    setNotes(updatedNotes);
    saveReviewNotes(window.localStorage, updatedNotes);
    setStatusMessage(`Reviewnotitie voor ${questionId} lokaal opgeslagen.`);
  };

  const exportReport = () => {
    const report = buildReviewReport({
      content,
      generatedAt: new Date().toISOString(),
      notes,
    });
    const downloaded = downloadJsonReport(
      `degenref-reviewrapport-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(report, null, 2),
    );

    setStatusMessage(
      downloaded
        ? 'Reviewrapport is als JSON-export klaargezet.'
        : 'Reviewrapport is samengesteld, maar downloaden is in deze omgeving niet beschikbaar.',
    );
  };

  return (
    <div className="page-stack review-page">
      <section className="page-heading">
        <p className="eyebrow">Lokale contentreview</p>
        <h1>Review vragen en brongegevens</h1>
        <p>
          Deze hulpmodus is bedoeld voor opleiders en scheidsrechters die de
          aangeleverde vragen willen controleren. Er is geen login, backend of
          serveropslag.
        </p>
      </section>

      <StatusMessage title="Lokale notities" variant="warning">
        De ingebouwde content wordt niet vanuit de browser aangepast.
        Reviewnotities blijven alleen in deze browser staan. Verwerk akkoord,
        aanpassingen of controlepunten daarna handmatig in de bron-JSON.
      </StatusMessage>

      <Panel className="review-toolbar">
        <div className="review-actions">
          <label className="field">
            <span>Reviewer naam (optioneel, lokaal)</span>
            <input
              autoComplete="name"
              onChange={(event) => setReviewerName(event.target.value)}
              type="text"
              value={reviewerName}
            />
          </label>
          <div className="button-row button-row--wrap">
            <AppButton onClick={exportReport} variant="secondary">
              Reviewrapport JSON exporteren
            </AppButton>
            <AppButton
              onClick={() => {
                window.print();
              }}
              variant="ghost"
            >
              Printweergave openen
            </AppButton>
          </div>
        </div>
        {statusMessage.length === 0 ? null : (
          <p aria-live="polite" className="form-hint">
            {statusMessage}
          </p>
        )}
      </Panel>

      <Panel className="review-filters">
        <h2>Filters</h2>
        <div className="filters filters--wide">
          <label>
            <span>Vraag-ID</span>
            <input
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="Bijvoorbeeld q-t124"
              type="search"
              value={filters.query}
            />
          </label>
          <label>
            <span>Missie</span>
            <select
              onChange={(event) => updateFilter('missionId', event.target.value)}
              value={filters.missionId}
            >
              <option value="all">Alle missies</option>
              {filterOptions.missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Artikel</span>
            <select
              onChange={(event) => updateFilter('article', event.target.value)}
              value={filters.article}
            >
              <option value="all">Alle artikelen</option>
              {filterOptions.articles.map((article) => (
                <option key={article} value={article}>
                  {article}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Categorie</span>
            <select
              onChange={(event) => updateFilter('category', event.target.value)}
              value={filters.category}
            >
              <option value="all">Alle categorieen</option>
              {filterOptions.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Seizoen</span>
            <select
              onChange={(event) => updateFilter('season', event.target.value)}
              value={filters.season}
            >
              <option value="all">Alle seizoenen</option>
              {filterOptions.seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Reviewstatus content</span>
            <select
              onChange={(event) =>
                updateFilter(
                  'reviewStatus',
                  event.target.value as ContentReviewStatusFilter,
                )
              }
              value={filters.reviewStatus}
            >
              <option value="all">Alle statussen</option>
              <option value="reviewed">Gereviewd</option>
              <option value="unreviewed">Niet gecontroleerd</option>
            </select>
          </label>
        </div>
      </Panel>

      <p aria-live="polite" className="result-count">
        {filteredItems.length} vragen gevonden. {notes.length} lokale reviewnotities
        opgeslagen.
        {visibleItems.length < filteredItems.length
          ? ` Eerste ${visibleItems.length} vragen getoond; verfijn de filters om gerichter te reviewen.`
          : ''}
      </p>

      <div className="review-list">
        {visibleItems.map((item) => (
          <ReviewQuestionCard
            draft={getDraft(item.question.id)}
            item={item}
            key={item.question.id}
            note={noteByQuestionId.get(item.question.id)}
            onDraftChange={(draft) => updateDraft(item.question.id, draft)}
            onSave={() => saveNote(item.question.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewQuestionCard({
  draft,
  item,
  note,
  onDraftChange,
  onSave,
}: {
  draft: ReviewNoteDraft;
  item: ReviewQuestionItem;
  note: ReviewNote | undefined;
  onDraftChange: (draft: Partial<ReviewNoteDraft>) => void;
  onSave: () => void;
}) {
  const { question } = item;

  return (
    <Panel className="review-card" labelledBy={`review-title-${question.id}`}>
      <div className="review-card__header">
        <div>
          <p className="eyebrow">Vraag {question.id}</p>
          <h2 id={`review-title-${question.id}`}>{question.question}</h2>
        </div>
        <div className="tag-row">
          <ReviewStatusBadge reviewed={question.reviewed} />
          <Badge variant="ghost">{question.category}</Badge>
        </div>
      </div>

      <ReviewAnswerBlock question={question} />

      <div className="detail-grid">
        <section className="review-subpanel">
          <h3>Hints</h3>
          {question.hints.length === 0 ? (
            <p>Geen hints opgenomen.</p>
          ) : (
            <ol className="compact-list">
              {question.hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ol>
          )}
        </section>

        <section className="review-subpanel">
          <h3>Bron en uitleg</h3>
          <dl className="metric-list">
            <div>
              <dt>Uitleg</dt>
              <dd>{question.explanation}</dd>
            </div>
            <div>
              <dt>Regelreferentie</dt>
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
              <dt>Gekoppelde missie</dt>
              <dd>
                {item.missionTitles.length === 0
                  ? 'Geen missie gekoppeld'
                  : item.missionTitles.join(', ')}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <form
        className="review-note-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <h3>Reviewnotitie</h3>
        {note === undefined ? (
          <p className="form-hint">Nog geen lokale reviewnotitie opgeslagen.</p>
        ) : (
          <p className="form-hint">
            Laatst opgeslagen op {formatDateTime(note.date)}
            {note.reviewerName === undefined ? '' : ` door ${note.reviewerName}`}.
          </p>
        )}
        <div className="filters">
          <label>
            <span>Status</span>
            <select
              onChange={(event) =>
                onDraftChange({ status: event.target.value as ReviewNoteStatus })
              }
              value={draft.status}
            >
              {REVIEW_NOTE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {reviewNoteStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Vrij tekstveld</span>
            <textarea
              onChange={(event) => onDraftChange({ text: event.target.value })}
              rows={4}
              value={draft.text}
            />
          </label>
        </div>
        <AppButton type="submit">Reviewnotitie opslaan</AppButton>
      </form>
    </Panel>
  );
}

function ReviewAnswerBlock({ question }: { question: QuestionContent }) {
  if (question.type === 'sequence') {
    return (
      <section className="review-subpanel">
        <h3>Antwoordopties en correcte volgorde</h3>
        <div className="detail-grid">
          <div>
            <h4>Antwoordopties</h4>
            <ul className="compact-list">
              {question.items.map((item, index) => (
                <li key={`${question.id}-item-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Correcte volgorde</h4>
            <ol className="compact-list">
              {question.correctAnswer.map((itemId) => (
                <li className="review-answer review-answer--correct" key={itemId}>
                  <span>{question.items[itemId] ?? `Onbekend item ${itemId}`}</span>
                  <Badge variant="success">Correct antwoord</Badge>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    );
  }

  const correctAnswers = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];

  return (
    <section className="review-subpanel">
      <h3>Antwoordopties</h3>
      <ol className="review-answer-list">
        {question.options.map((option, index) => {
          const isCorrect = correctAnswers.includes(index);

          return (
            <li
              className={`review-answer ${isCorrect ? 'review-answer--correct' : ''}`.trim()}
              key={`${question.id}-${index}`}
            >
              <span>{option}</span>
              {isCorrect ? <Badge variant="success">Correct antwoord</Badge> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function downloadJsonReport(fileName: string, json: string): boolean {
  if (typeof URL.createObjectURL !== 'function') {
    return false;
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return true;
}
