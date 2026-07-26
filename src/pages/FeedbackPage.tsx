import { Link } from 'react-router-dom';
import { Panel, StatusMessage } from '../components/ui';

export function FeedbackPage() {
  return (
    <Panel>
      <p className="eyebrow">Feedback</p>
      <h1>Feedback verschijnt tijdens het oefenen</h1>
      <StatusMessage variant="secondary">
        In leren en oefenen zie je na het beantwoorden uitleg, correcte keuze en
        regelreferentie. In examenmodus verschijnt feedback pas na afronding.
      </StatusMessage>
      <Link className="button button--primary" to="/missions">
        Naar fases
      </Link>
    </Panel>
  );
}
