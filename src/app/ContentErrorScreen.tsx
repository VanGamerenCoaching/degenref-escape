import { Link } from 'react-router-dom';
import { Panel, StatusMessage } from '../components/ui';

export function ContentErrorScreen({
  errorMessage,
  warningMessages,
}: {
  errorMessage: string;
  warningMessages: readonly string[];
}) {
  return (
    <main className="app-main app-main--standalone">
      <Panel className="system-state system-state--error">
        <h1>Content kan niet worden geladen</h1>
        <StatusMessage title="Controleer de JSON-content" variant="danger">
          De gegenereerde content voldoet niet aan de lokale validatie.
        </StatusMessage>
        <pre className="error-details">{errorMessage}</pre>
        {warningMessages.length > 0 ? (
          <>
            <h2>Waarschuwingen</h2>
            <ul>
              {warningMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </>
        ) : null}
        <Link className="button button--secondary" to="/about">
          Over deze app
        </Link>
      </Panel>
    </main>
  );
}
