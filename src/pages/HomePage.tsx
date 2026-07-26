import { Link } from 'react-router-dom';
import { Card, Panel, StatusMessage } from '../components/ui';
import { useContent } from '../content/ContentContext';
import { useGameState } from '../storage/useGameState';

export function HomePage() {
  const content = useContent();
  const { state } = useGameState();
  const hasProgress =
    state.activeSession !== null || state.progress.completedMissionIds.length > 0;

  return (
    <div className="page-grid page-grid--hero">
      <section className="hero">
        <div className="piste-motif" aria-hidden="true" />
        <p className="eyebrow">Niet-officiële leervertaling</p>
        <h1>DegenRef Escape</h1>
        <p className="hero__subtitle">Train je beslissingen als degenscheidsrechter</p>
        <div className="hero__actions">
          <Link className="button button--primary" to="/start">
            Nieuwe training
          </Link>
          {hasProgress ? (
            <Link
              className="button button--secondary"
              to={
                state.activeSession === null
                  ? '/missions'
                  : `/play/${state.activeSession.missionId}`
              }
            >
              Doorgaan
            </Link>
          ) : null}
          <Link className="button button--ghost" to="/rules">
            Regels bekijken
          </Link>
        </div>
      </section>

      <Panel>
        <h2>Rustig oefenen, lokaal opgeslagen</h2>
        <p>
          Alle voortgang blijft op dit apparaat in deze browser. Er zijn geen accounts,
          backend, analytics of trackingcookies.
        </p>
        <StatusMessage variant="warning">
          Dit is geen officiële app van de FIE, KNAS of een andere schermbond.
          Raadpleeg bij twijfel het officiële reglement.
        </StatusMessage>
      </Panel>

      <div className="card-grid card-grid--three">
        <Card>
          <h2>{content.missions.length} missies</h2>
          <p>Gebaseerd op het aangeleverde contentpakket.</p>
        </Card>
        <Card>
          <h2>{content.questions.length} vragen</h2>
          <p>Met uitleg, regelreferenties en reviewstatus uit de JSON-bron.</p>
        </Card>
        <Card>
          <h2>{content.seasonValues.join(' en ')}</h2>
          <p>Seizoensversies worden zichtbaar gekozen, onder meer bij t.124.</p>
        </Card>
      </div>
    </div>
  );
}
