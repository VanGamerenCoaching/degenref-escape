import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react';
import { Link } from 'react-router-dom';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'ghost';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function AppButton({
  children,
  className = '',
  type = 'button',
  variant = 'primary',
  ...props
}: AppButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
}

export function IconButton({
  children,
  className = '',
  label,
  type = 'button',
  variant = 'ghost',
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`icon-button button--${variant} ${className}`.trim()}
      title={label}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <article className={`card ${className}`.trim()}>{children}</article>;
}

export function Panel({
  children,
  className = '',
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section aria-labelledby={labelledBy} className={`panel ${className}`.trim()}>
      {children}
    </section>
  );
}

export function Badge({
  children,
  variant = 'secondary',
}: {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}

export function ProgressBar({
  label,
  max,
  value,
}: {
  label: string;
  max: number;
  value: number;
}) {
  const normalizedMax = Math.max(1, max);
  const normalizedValue = Math.min(Math.max(0, value), normalizedMax);
  const percentage = Math.round((normalizedValue / normalizedMax) * 100);

  return (
    <div className="progress">
      <div className="progress__label">
        <span>{label}</span>
        <span>
          {normalizedValue}/{normalizedMax}
        </span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={normalizedMax}
        aria-valuemin={0}
        aria-valuenow={normalizedValue}
        className="progress__track"
        role="progressbar"
      >
        <span className="progress__bar" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function ScoreDisplay({
  label,
  points,
}: {
  label: string;
  points: number;
}) {
  return (
    <div className="score-display" aria-label={`${label}: ${points} punten`}>
      <span>{label}</span>
      <strong>{points}</strong>
    </div>
  );
}

export function StatusMessage({
  children,
  title,
  variant = 'secondary',
}: {
  children: ReactNode;
  title?: string;
  variant?: ButtonVariant;
}) {
  const role = variant === 'danger' ? 'alert' : 'status';

  return (
    <div
      aria-atomic="true"
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      className={`status-message status-message--${variant}`}
      role={role}
    >
      {title === undefined ? null : <strong>{title}</strong>}
      <span>{children}</span>
    </div>
  );
}

export function Modal({
  children,
  closeLabel = 'Sluiten',
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  closeLabel?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousActiveElement = document.activeElement;
    const panel = panelRef.current;

    if (panel !== null) {
      const focusable = getFocusableElements(panel);
      (focusable[0] ?? panel).focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || panel === null) {
        return;
      }

      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (first === undefined || last === undefined) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <IconButton label={closeLabel} onClick={onClose}>
            Sluiten
          </IconButton>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  confirmLabel,
  children,
  onCancel,
  onConfirm,
  open,
  title,
}: {
  children: ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}) {
  return (
    <Modal onClose={onCancel} open={open} title={title}>
      <div className="stack">
        <p>{children}</p>
        <div className="button-row">
          <AppButton onClick={onConfirm} variant="danger">
            {confirmLabel}
          </AppButton>
          <AppButton onClick={onCancel} variant="secondary">
            Annuleren
          </AppButton>
        </div>
      </div>
    </Modal>
  );
}

export function Tabs({
  activeId,
  items,
  onChange,
}: {
  activeId: string;
  items: readonly { id: string; label: string; panel: ReactNode }[];
  onChange: (id: string) => void;
}) {
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div className="tabs">
      <div aria-label="Weergave" className="tabs__list" role="tablist">
        {items.map((item) => (
          <button
            aria-controls={`panel-${item.id}`}
            aria-selected={activeItem?.id === item.id}
            className="tabs__tab"
            id={`tab-${item.id}`}
            key={item.id}
            onClick={() => onChange(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {activeItem === undefined ? null : (
        <div
          aria-labelledby={`tab-${activeItem.id}`}
          className="tabs__panel"
          id={`panel-${activeItem.id}`}
          role="tabpanel"
        >
          {activeItem.panel}
        </div>
      )}
    </div>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: number }) {
  const label =
    difficulty <= 1 ? 'Beginner' : difficulty === 2 ? 'Gevorderd' : 'Examentraining';

  return <Badge variant="warning">{label}</Badge>;
}

export function ReviewStatusBadge({ reviewed }: { reviewed: boolean }) {
  return reviewed ? (
    <Badge variant="success">Gereviewd</Badge>
  ) : (
    <Badge variant="warning">Niet gecontroleerd</Badge>
  );
}

export function RuleReference({ article }: { article: string }) {
  return (
    <Link className="rule-reference" to={`/rules/${encodeURIComponent(article)}`}>
      Regel {article}
    </Link>
  );
}

export function LoadingState({ label = 'Laden...' }: { label?: string }) {
  return (
    <div aria-label={label} aria-live="polite" className="loading-state" role="status">
      <span className="loading-state__marker" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  action,
  children,
  headingLevel = 2,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  headingLevel?: 1 | 2;
  title: string;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <div className="empty-state">
      <Heading>{title}</Heading>
      <p>{children}</p>
      {action}
    </div>
  );
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll(selector)).filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
}
