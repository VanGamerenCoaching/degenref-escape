import { Link, useParams } from 'react-router-dom';
import { Badge, Panel, ReviewStatusBadge, RuleReference, StatusMessage } from '../components/ui';
import { useContent } from '../content/ContentContext';
import {
  buildSeasonWarning,
  findRuleByArticle,
  getOptionalLearningExplanation,
} from '../features/rules/ruleLibrary';
import { useGameState } from '../storage/useGameState';

export function RuleArticlePage() {
  const { articleId } = useParams();
  const content = useContent();
  const { state } = useGameState();
  const article = articleId === undefined ? '' : decodeURIComponent(articleId);
  const item = findRuleByArticle(content, article, state.settings.selectedSeason);
  const lesson = item?.lesson;

  if (item === null || lesson === undefined) {
    return (
      <Panel>
        <h1>Artikel niet gevonden</h1>
        <Link className="button button--secondary" to="/rules">
          Terug naar regelbibliotheek
        </Link>
      </Panel>
    );
  }

  const missions = content.missions.filter((mission) =>
    item.relatedMissionIds.includes(mission.id),
  );
  const seasonWarning = buildSeasonWarning(item, state.settings.selectedSeason);
  const learningExplanation = getOptionalLearningExplanation(lesson);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Regelartikel</p>
        <h1>{lesson.article}</h1>
        <p>{lesson.section}</p>
      </section>

      <Panel>
        <StatusMessage variant="warning">
          Dit is een niet-officiële Nederlandse leervertaling. Raadpleeg bij twijfel
          het officiële reglement.
        </StatusMessage>
      </Panel>

      {seasonWarning === null ? null : (
        <StatusMessage variant="warning">
          {seasonWarning}
        </StatusMessage>
      )}

      <Panel>
        <h2>Leervertaling</h2>
        {item.room === null ? null : (
          <p className="form-hint">
            Onderwerp: {lesson.section}. Thema: {item.room.title} - {item.room.subtitle}.
          </p>
        )}
        {learningExplanation === null ? null : (
          <>
            <h3>Korte leeruitleg</h3>
            <p>{learningExplanation}</p>
          </>
        )}
        <p className="rule-translation">{lesson.dutchLearningTranslation}</p>
        <dl className="metric-list">
          <div>
            <dt>Categorie</dt>
            <dd>{item.categories.length === 0 ? 'Niet gekoppeld' : item.categories.join(', ')}</dd>
          </div>
          <div>
            <dt>Moeilijkheid</dt>
            <dd>
              {item.difficulties.length === 0
                ? 'Niet gekoppeld'
                : item.difficulties.map((difficulty) => `niveau ${difficulty}`).join(', ')}
            </dd>
          </div>
          <div>
            <dt>Bronpagina</dt>
            <dd>{lesson.sourcePage}</dd>
          </div>
          <div>
            <dt>Reglementversie</dt>
            <dd>{lesson.sourceVersion}</dd>
          </div>
          <div>
            <dt>Reviewstatus</dt>
            <dd>
              <ReviewStatusBadge reviewed={lesson.reviewed} />
            </dd>
          </div>
          <div>
            <dt>Toepassing</dt>
            <dd>
              {item.hasSeasonSpecificContent
                ? `Seizoensgebonden, actief seizoen ${state.settings.selectedSeason}`
                : 'Degen of algemeen toepasbaar binnen het contentpakket'}
            </dd>
          </div>
        </dl>
      </Panel>

      <div className="detail-grid">
        <Panel>
          <h2>Gerelateerde vragen</h2>
          {item.relatedQuestions.length === 0 ? (
            <p>Geen vragen gekoppeld.</p>
          ) : (
            <ul className="compact-list">
              {item.relatedQuestions.map((question) => (
                <li key={question.id}>
                  <Badge variant="ghost">{question.category}</Badge> {question.question}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h2>Gerelateerde fases</h2>
          {missions.length === 0 ? (
            <p>Geen fases gekoppeld.</p>
          ) : (
            <div className="tag-row">
              {missions.map((mission) => (
                <Link
                  className="button button--secondary"
                  key={mission.id}
                  to={`/mission/${mission.id}`}
                >
                  {mission.title}
                </Link>
              ))}
            </div>
          )}
          <h3>Artikelverwijzing</h3>
          <RuleReference article={lesson.article} />
        </Panel>
      </div>
    </div>
  );
}
