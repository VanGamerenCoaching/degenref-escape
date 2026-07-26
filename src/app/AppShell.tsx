import { lazy, Suspense, useEffect } from 'react';
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { APP_NAME } from './appInfo';
import { PwaUpdateNotice } from './PwaUpdateNotice';
import { LoadingState } from '../components/ui';
import { useGameState } from '../storage/useGameState';

const AboutPage = lazy(() =>
  import('../pages/AboutPage').then((module) => ({ default: module.AboutPage })),
);
const FeedbackPage = lazy(() =>
  import('../pages/FeedbackPage').then((module) => ({
    default: module.FeedbackPage,
  })),
);
const HomePage = lazy(() =>
  import('../pages/HomePage').then((module) => ({ default: module.HomePage })),
);
const MissionDetailPage = lazy(() =>
  import('../pages/MissionDetailPage').then((module) => ({
    default: module.MissionDetailPage,
  })),
);
const MissionsPage = lazy(() =>
  import('../pages/MissionsPage').then((module) => ({
    default: module.MissionsPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);
const PlayPage = lazy(() =>
  import('../pages/PlayPage').then((module) => ({ default: module.PlayPage })),
);
const ResultsPage = lazy(() =>
  import('../pages/ResultsPage').then((module) => ({
    default: module.ResultsPage,
  })),
);
const ReviewPage = lazy(() =>
  import('../pages/ReviewPage').then((module) => ({
    default: module.ReviewPage,
  })),
);
const RuleArticlePage = lazy(() =>
  import('../pages/RuleArticlePage').then((module) => ({
    default: module.RuleArticlePage,
  })),
);
const RulesPage = lazy(() =>
  import('../pages/RulesPage').then((module) => ({ default: module.RulesPage })),
);
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
);
const StartPage = lazy(() =>
  import('../pages/StartPage').then((module) => ({ default: module.StartPage })),
);

const modeLabels = {
  learning: 'Leren',
  practice: 'Oefenen',
  exam: 'Examen',
} as const;

export function AppShell() {
  const { state } = useGameState();
  const location = useLocation();
  const navigate = useNavigate();
  const activeMode =
    state.activeSession !== null && state.activeSession.completedAt === null
      ? modeLabels[state.activeSession.mode]
      : null;

  useEffect(() => {
    const main = document.querySelector<HTMLElement>('#main-content');
    main?.focus();
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Naar hoofdinhoud
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link className="brand" to="/">
            <span className="brand__mark" aria-hidden="true">
              DR
            </span>
            <span>{APP_NAME}</span>
          </Link>
          {activeMode === null ? null : (
            <span className="mode-pill">Spelmodus: {activeMode}</span>
          )}
          <nav aria-label="Hoofdnavigatie" className="main-nav">
            <NavLink to="/start">Start</NavLink>
            <NavLink to="/missions">Fases</NavLink>
            <NavLink to="/rules">Regels</NavLink>
          </nav>
          <button
            aria-label="Instellingen openen"
            className="button button--ghost app-header__settings"
            onClick={() => {
              void navigate('/settings');
            }}
            type="button"
          >
            <span aria-hidden="true">⚙</span>
            <span>Instellingen</span>
          </button>
        </div>
      </header>
      <main className="app-main" id="main-content" tabIndex={-1}>
        <BackButton />
        <Suspense fallback={<LoadingState label="Scherm laden..." />}>
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<StartPage />} path="/start" />
            <Route element={<MissionsPage />} path="/missions" />
            <Route element={<MissionDetailPage />} path="/mission/:missionId" />
            <Route element={<PlayPage />} path="/play/:missionId" />
            <Route element={<FeedbackPage />} path="/feedback" />
            <Route element={<ResultsPage />} path="/results" />
            <Route element={<ReviewPage />} path="/review" />
            <Route element={<RulesPage />} path="/rules" />
            <Route element={<RuleArticlePage />} path="/rules/:articleId" />
            <Route element={<SettingsPage />} path="/settings" />
            <Route element={<AboutPage />} path="/about" />
            <Route element={<NotFoundPage />} path="/not-found" />
            <Route element={<Navigate replace to="/not-found" />} path="*" />
          </Routes>
        </Suspense>
      </main>
      <footer className="app-footer">
        <span>Niet-officiële leerapp voor degenschermarbitrage</span>
        <Link to="/about">Over deze app</Link>
        <Link to="/rules">Regelbibliotheek</Link>
        <Link to="/review">Contentreview</Link>
      </footer>
      <PwaUpdateNotice />
    </div>
  );
}

function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const canGoBack = location.pathname !== '/';

  if (!canGoBack) {
    return null;
  }

  return (
    <button
      className="back-button"
      onClick={() => {
        void navigate(-1);
      }}
      type="button"
    >
      ← Terug
    </button>
  );
}
