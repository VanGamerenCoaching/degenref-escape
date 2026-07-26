import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, EmptyState, Panel, ReviewStatusBadge, StatusMessage } from '../components/ui';
import { useContent } from '../content/ContentContext';
import {
  buildSeasonWarning,
  searchRuleLibrary,
  type ReviewFilter,
  type RuleFilters,
} from '../features/rules/ruleLibrary';
import { useGameState } from '../storage/useGameState';

export function RulesPage() {
  const content = useContent();
  const { state } = useGameState();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [reviewStatus, setReviewStatus] = useState<ReviewFilter>('all');
  const [season, setSeason] = useState(state.settings.selectedSeason);
  const categories = useMemo(
    () => [...new Set(content.questions.map((question) => question.category))].sort(),
    [content.questions],
  );
  const filters: RuleFilters = {
    query,
    category,
    difficulty,
    reviewStatus,
    season,
  };
  const results = searchRuleLibrary(content, filters);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Regelbibliotheek</p>
        <h1>Zoek in de Nederlandse leervertaling</h1>
        <p>
          Dit is een niet-officiële Nederlandse leervertaling. Raadpleeg bij
          twijfel het officiële reglement.
        </p>
      </section>

      <Panel>
        <StatusMessage variant="warning">
          De bibliotheek toont de meegeleverde degencontent en algemene artikelen die in
          het pakket aanwezig zijn. Floret- en sabelartikelen buiten de bronselectie
          worden niet toegevoegd.
        </StatusMessage>
      </Panel>

      <div className="filters filters--wide" aria-label="Regelfilters">
        <label>
          Zoeken
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="t.90, t90, 90 of zoektekst"
            type="search"
            value={query}
          />
        </label>
        <label>
          Categorie
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Alle categorieën</option>
            {categories.map((categoryValue) => (
              <option key={categoryValue} value={categoryValue}>
                {categoryValue}
              </option>
            ))}
          </select>
        </label>
        <label>
          Moeilijkheid
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option value="all">Alle niveaus</option>
            <option value="1">Beginner</option>
            <option value="2">Gevorderd</option>
            <option value="3">Examentraining</option>
          </select>
        </label>
        <label>
          Reviewstatus
          <select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value as ReviewFilter)}
          >
            <option value="all">Alle statussen</option>
            <option value="reviewed">Gereviewd</option>
            <option value="unreviewed">Niet gecontroleerd</option>
          </select>
        </label>
        <label>
          Seizoen
          <select value={season} onChange={(event) => setSeason(event.target.value)}>
            {content.seasonValues.map((seasonValue) => (
              <option key={seasonValue} value={seasonValue}>
                {seasonValue}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="result-count" aria-live="polite">
        {results.length} artikelen gevonden voor seizoen {season}.
      </p>

      {results.length === 0 ? (
        <EmptyState title="Geen artikelen gevonden">
          Probeer een ander artikelnummer, trefwoord of filter.
        </EmptyState>
      ) : (
        <div className="rule-list">
          {results.map((item) => (
            <article className="rule-row" key={item.lesson.id}>
              <div>
                <h2>
                  <Link to={`/rules/${encodeURIComponent(item.lesson.article)}`}>
                    {item.lesson.article}
                  </Link>
                </h2>
                <p className="rule-row__section">
                  {item.lesson.section}
                  {item.room === null ? '' : ` · ${item.room.title}`}
                </p>
                <p>{item.lesson.dutchLearningTranslation}</p>
                <div className="tag-row">
                  <ReviewStatusBadge reviewed={item.lesson.reviewed} />
                  {item.hasSeasonSpecificContent ? (
                    <Badge variant="warning">Seizoensgebonden</Badge>
                  ) : (
                    <Badge variant="secondary">Algemeen/degen</Badge>
                  )}
                  {item.categories.slice(0, 3).map((categoryValue) => (
                    <Badge key={categoryValue} variant="ghost">
                      {categoryValue}
                    </Badge>
                  ))}
                </div>
                {buildSeasonWarning(item, season) === null ? null : (
                  <p className="form-hint">{buildSeasonWarning(item, season)}</p>
                )}
              </div>
              <span className="rule-row__meta">Bronpagina {item.lesson.sourcePage}</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
