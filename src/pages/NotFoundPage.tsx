import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export function NotFoundPage() {
  return (
    <EmptyState
      action={
        <Link className="button button--primary" to="/">
          Naar startscherm
        </Link>
      }
      headingLevel={1}
      title="Pagina niet gevonden"
    >
      Deze route bestaat niet in DegenRef Escape.
    </EmptyState>
  );
}
