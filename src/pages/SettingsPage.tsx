import { useState } from 'react';
import { AppButton, ConfirmDialog, Panel, StatusMessage } from '../components/ui';
import { useContent } from '../content/ContentContext';
import {
  STORAGE_KEY,
  USED_LOCAL_STORAGE_KEYS,
  deleteAllLocalData,
} from '../storage/localStorageState';
import type { AppSettings, ExperienceLevel, GameMode } from '../storage/gameState';
import { useGameState } from '../storage/useGameState';
import { formatDateTime } from '../utils/format';

type ConfirmTarget = 'session' | 'all' | null;

export function SettingsPage() {
  const content = useContent();
  const { dispatch, state } = useGameState();
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);
  const missionIds = content.missions.map((mission) => mission.id);
  const savedAnswerCount = state.activeSession?.answers.length ?? 0;
  const savedHintCount =
    state.activeSession === null
      ? 0
      : Object.values(state.activeSession.usedHints).reduce(
          (total, hintCount) => total + hintCount,
          0,
        );
  const missionAttemptCount = Object.values(state.progress.missionStats).reduce(
    (total, stats) => total + stats.attempts,
    0,
  );
  const categoryErrorCount = Object.values(state.progress.errorsByCategory).reduce(
    (total, errors) => total + errors,
    0,
  );

  const updateSettings = (settings: Partial<AppSettings>) => {
    dispatch({
      type: 'update-settings',
      settings,
      missionIds,
      now: new Date().toISOString(),
    });
  };

  const removeActiveSession = () => {
    dispatch({ type: 'clear-active-session', now: new Date().toISOString() });
    setConfirmTarget(null);
  };

  const removeAllProgress = () => {
    if (typeof window !== 'undefined') {
      deleteAllLocalData(window.localStorage);
      window.location.hash = '#/start';
      window.location.reload();
      return;
    }

    dispatch({
      type: 'reset-all',
      missionIds,
      seasons: content.seasonValues,
      now: new Date().toISOString(),
    });
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Instellingen</p>
        <h1>Regels, privacy en lokale gegevens</h1>
      </section>

      <div className="detail-grid">
        <Panel>
          <h2>Training</h2>
          <div className="settings-form">
            <label className="field">
              <span>Regelseizoen</span>
              <select
                value={state.settings.selectedSeason}
                onChange={(event) => updateSettings({ selectedSeason: event.target.value })}
              >
                {content.seasonValues.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Standaardspelmodus</span>
              <select
                value={state.settings.preferredMode}
                onChange={(event) =>
                  updateSettings({ preferredMode: event.target.value as GameMode })
                }
              >
                <option value="learning">Leren</option>
                <option value="practice">Oefenen</option>
                <option value="exam">Examen</option>
              </select>
            </label>
            <label className="field">
              <span>Moeilijkheidsniveau</span>
              <select
                value={state.settings.experienceLevel}
                onChange={(event) =>
                  updateSettings({
                    experienceLevel: event.target.value as ExperienceLevel,
                  })
                }
              >
                <option value="beginner">Beginner</option>
                <option value="advanced">Gevorderd</option>
                <option value="exam-training">Examentraining</option>
              </select>
            </label>
            <CheckboxField
              checked={!state.settings.excludeUnreviewedQuestions}
              label="Niet-gecontroleerde vragen tonen"
              onChange={(checked) => updateSettings({ excludeUnreviewedQuestions: !checked })}
            />
            <CheckboxField
              checked={state.settings.allowAllMissionsInLearning}
              label="Alle missies beschikbaar maken in leermodus"
              onChange={(checked) => updateSettings({ allowAllMissionsInLearning: checked })}
            />
            <CheckboxField
              checked={state.settings.resultsStorageEnabled}
              label="Resultaten opslaan"
              onChange={(checked) => updateSettings({ resultsStorageEnabled: checked })}
            />
          </div>
        </Panel>

        <Panel>
          <h2>Voorkeuren</h2>
          <div className="settings-form">
            <CheckboxField
              checked={state.settings.reduceMotion === 'always'}
              label="Animaties verminderen"
              onChange={(checked) =>
                updateSettings({ reduceMotion: checked ? 'always' : 'system' })
              }
            />
            <CheckboxField
              checked={state.settings.soundEnabled}
              label="Geluid aan"
              onChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
            <CheckboxField
              checked={state.settings.showRuleReferences}
              label="Regelverwijzingen tonen"
              onChange={(checked) => updateSettings({ showRuleReferences: checked })}
            />
          </div>
          <p className="form-hint">
            Geluid wordt nog niet automatisch afgespeeld. Deze instelling staat alvast klaar.
          </p>
        </Panel>
      </div>

      <Panel>
        <h2>Lokale gegevens</h2>
        <p>
          De app gebruikt één hoofdsleutel in <code>localStorage</code>:{' '}
          <code>{STORAGE_KEY}</code>.
        </p>
        <dl className="metric-list">
          <div>
            <dt>Schema-versie</dt>
            <dd>{state.schemaVersion}</dd>
          </div>
          <div>
            <dt>App gestart op dit apparaat</dt>
            <dd>{formatDateTime(state.startedAt)}</dd>
          </div>
          <div>
            <dt>Actieve sessie</dt>
            <dd>{state.activeSession === null ? 'Nee' : state.activeSession.missionId}</dd>
          </div>
          <div>
            <dt>Opgeslagen antwoorden in actieve sessie</dt>
            <dd>{savedAnswerCount}</dd>
          </div>
          <div>
            <dt>Gebruikte hints in actieve sessie</dt>
            <dd>{savedHintCount}</dd>
          </div>
          <div>
            <dt>Voltooide missies</dt>
            <dd>{state.progress.completedMissionIds.length}</dd>
          </div>
          <div>
            <dt>Ontgrendelde missies</dt>
            <dd>{state.progress.unlockedMissionIds.length}</dd>
          </div>
          <div>
            <dt>Missiepogingen</dt>
            <dd>{missionAttemptCount}</dd>
          </div>
          <div>
            <dt>Fouten per categorie</dt>
            <dd>{categoryErrorCount}</dd>
          </div>
          <div>
            <dt>Instellingen opgeslagen</dt>
            <dd>
              Seizoen, spelmodus, niveau, reviewfilter, animatie, geluid,
              missieontgrendeling en resultaatopslag
            </dd>
          </div>
          <div>
            <dt>Laatste activiteit</dt>
            <dd>{formatDateTime(state.lastActivityAt)}</dd>
          </div>
        </dl>
        <h3>Gebruikte localStorage-sleutels</h3>
        <ul className="compact-list">
          {USED_LOCAL_STORAGE_KEYS.map((key) => (
            <li key={key}>
              <code>{key}</code>
            </li>
          ))}
        </ul>
        <div className="button-row">
          <AppButton
            disabled={state.activeSession === null}
            onClick={() => setConfirmTarget('session')}
            variant="warning"
          >
            Actieve sessie verwijderen
          </AppButton>
          <AppButton onClick={() => setConfirmTarget('all')} variant="danger">
            Alle voortgang verwijderen
          </AppButton>
        </div>
      </Panel>

      <Panel>
        <h2>Privacy</h2>
        <StatusMessage variant="secondary">
          DegenRef Escape werkt volledig lokaal en gebruikt geen online diensten voor
          voortgang of analyse.
        </StatusMessage>
        <ul className="check-list">
          <li>Geen account</li>
          <li>Geen backend</li>
          <li>Geen analytics</li>
          <li>Geen tracking</li>
          <li>Geen gegevens naar een server</li>
          <li>Voortgang blijft alleen in deze browser</li>
          <li>Wissen van browsergegevens kan voortgang verwijderen</li>
        </ul>
      </Panel>

      <ConfirmDialog
        confirmLabel="Sessie verwijderen"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={removeActiveSession}
        open={confirmTarget === 'session'}
        title="Actieve sessie verwijderen?"
      >
        Je huidige sessie wordt gewist. Voltooide missievoortgang blijft bestaan.
      </ConfirmDialog>
      <ConfirmDialog
        confirmLabel="Alles verwijderen"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={removeAllProgress}
        open={confirmTarget === 'all'}
        title="Alle voortgang verwijderen?"
      >
        Alle lokale DegenRef Escape-gegevens worden verwijderd en de app start schoon.
      </ConfirmDialog>
    </div>
  );
}

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="checkbox-field">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}
