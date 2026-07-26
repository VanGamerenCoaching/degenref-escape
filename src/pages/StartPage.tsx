import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton, Panel, StatusMessage } from '../components/ui';
import { useContent } from '../content/ContentContext';
import type { AppSettings, ExperienceLevel, GameMode } from '../storage/gameState';
import { useGameState } from '../storage/useGameState';

const modeOptions: readonly { id: GameMode; label: string; description: string }[] = [
  {
    id: 'learning',
    label: 'Leren',
    description: 'Onbeperkt opnieuw proberen, hints beschikbaar en meteen uitleg.',
  },
  {
    id: 'practice',
    label: 'Oefenen',
    description: 'Maximaal twee hints per vraag en levensverlies bij fouten.',
  },
  {
    id: 'exam',
    label: 'Examen',
    description: 'Geen hints, vaste volgorde en feedback pas na afronding.',
  },
];

const levelOptions: readonly {
  id: ExperienceLevel;
  label: string;
  description: string;
}[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Start met de basis en lagere moeilijkheidsniveaus.',
  },
  {
    id: 'advanced',
    label: 'Gevorderd',
    description: 'Gebruik de volledige beschikbare vraagset.',
  },
  {
    id: 'exam-training',
    label: 'Examentraining',
    description: 'Leg nadruk op moeilijkere beslissingen.',
  },
];

export function StartPage() {
  const content = useContent();
  const { dispatch, state } = useGameState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<GameMode>(state.settings.preferredMode);
  const [season, setSeason] = useState(state.settings.selectedSeason);
  const [level, setLevel] = useState<ExperienceLevel>(state.settings.experienceLevel);

  const submitSettings = () => {
    dispatch({
      type: 'update-settings',
      settings: {
        preferredMode: mode,
        selectedSeason: season,
        experienceLevel: level,
      },
      missionIds: content.missions.map((mission) => mission.id),
      now: new Date().toISOString(),
    });
    void navigate('/missions');
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Nieuwe training</p>
        <h1>Stel je sessie samen</h1>
        <p>
          Kies spelmodus, regelseizoen en ervaringsniveau. Je kunt deze keuze later in
          instellingen aanpassen.
        </p>
        <ol className="onboarding-steps" aria-label="Onboardingstappen">
          <li>
            <span>1</span>
            Modus
          </li>
          <li>
            <span>2</span>
            Seizoen
          </li>
          <li>
            <span>3</span>
            Niveau
          </li>
        </ol>
      </section>

      <Panel>
        <StatusMessage variant="warning">
          Dit is een niet-officiële leerapp. De leervertaling moet inhoudelijk
          worden gecontroleerd; bij twijfel geldt het officiële reglement.
        </StatusMessage>
      </Panel>

      <form
        className="settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitSettings();
        }}
      >
        <Panel>
          <p className="eyebrow">Stap 1</p>
          <fieldset>
            <legend>Spelmodus</legend>
            <div className="choice-grid">
              {modeOptions.map((option) => (
                <label className="choice-card" key={option.id}>
                  <input
                    checked={mode === option.id}
                    name="mode"
                    onChange={() => setMode(option.id)}
                    type="radio"
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Panel>

        <Panel>
          <div className="form-section-header">
            <p className="eyebrow">Stap 2</p>
            <h2>Regelseizoen</h2>
          </div>
          <label className="field">
            <span>Actief seizoen</span>
            <select value={season} onChange={(event) => setSeason(event.target.value)}>
              {content.seasonValues.map((seasonValue) => (
                <option key={seasonValue} value={seasonValue}>
                  {seasonValue}
                </option>
              ))}
            </select>
          </label>
          <p className="form-hint">
            Bepaalde regels, waaronder t.124, kunnen per seizoen verschillen. Een
            seizoenswissel kan invloed hebben op actieve oefeningen.
          </p>
        </Panel>

        <Panel>
          <p className="eyebrow">Stap 3</p>
          <fieldset>
            <legend>Ervaringsniveau</legend>
            <div className="choice-grid">
              {levelOptions.map((option) => (
                <label className="choice-card" key={option.id}>
                  <input
                    checked={level === option.id}
                    name="level"
                    onChange={() => setLevel(option.id)}
                    type="radio"
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Panel>

        <div className="form-submit-bar">
          <span>Je training wordt alleen lokaal opgeslagen.</span>
          <AppButton type="submit">Naar missieoverzicht</AppButton>
        </div>
      </form>
    </div>
  );
}

export function getModeLabel(mode: AppSettings['preferredMode']): string {
  return modeOptions.find((option) => option.id === mode)?.label ?? mode;
}
