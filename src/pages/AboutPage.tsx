import { Link } from 'react-router-dom';
import { APP_NAME, APP_VERSION, REPOSITORY_URL } from '../app/appInfo';
import { Panel, StatusMessage } from '../components/ui';
import { useContent } from '../content/ContentContext';

export function AboutPage() {
  const content = useContent();

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Over deze app</p>
        <h1>{APP_NAME}</h1>
        <p>
          Een Nederlandstalige educatieve escape-roomwebapp voor mensen die leren
          arbitreren bij het degenschermen.
        </p>
      </section>

      <Panel>
        <h2>Doel en status</h2>
        <p>
          De app helpt je oefenen met beslissingen, uitleg en regelverwijzingen. De app
          is niet officieel en is niet goedgekeurd door de FIE, KNAS of een andere
          schermbond.
        </p>
        <StatusMessage variant="warning">
          Dit is geen officiële Nederlandse FIE-vertaling. Raadpleeg bij twijfel het
          officiële reglement.
        </StatusMessage>
      </Panel>

      <Panel>
        <h2>Bronvermelding</h2>
        <dl className="metric-list">
          <div>
            <dt>Contentpakket</dt>
            <dd>{content.metadata.title}</dd>
          </div>
          <div>
            <dt>Versie van het contentpakket</dt>
            <dd>
              Schema {content.schemaVersion}, gegenereerd op{' '}
              {content.metadata.generatedDate}
            </dd>
          </div>
          <div>
            <dt>Canonieke appbron</dt>
            <dd>{content.source.canonicalFile}</dd>
          </div>
          <div>
            <dt>Bronbestand</dt>
            <dd>{content.metadata.sourceFile}</dd>
          </div>
          <div>
            <dt>Reglementversie</dt>
            <dd>{content.metadata.sourceEdition}</dd>
          </div>
          <div>
            <dt>Gegenereerd</dt>
            <dd>{content.metadata.generatedDate}</dd>
          </div>
          <div>
            <dt>Appversie</dt>
            <dd>{APP_VERSION}</dd>
          </div>
          <div>
            <dt>Reviewstatus content</dt>
            <dd>
              {content.questions.filter((question) => question.reviewed).length} van{' '}
              {content.questions.length} vragen gereviewd
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel>
        <h2>Project</h2>
        <p>
          De repository-URL is configureerbaar via <code>VITE_REPOSITORY_URL</code>.
        </p>
        <p className="form-hint">{REPOSITORY_URL}</p>
        <a
          className="button button--secondary"
          href={REPOSITORY_URL}
          rel="noreferrer"
          target="_blank"
        >
          GitHub bekijken
        </a>
        <Link className="button button--ghost" to="/rules">
          Regelbibliotheek openen
        </Link>
      </Panel>
    </div>
  );
}
