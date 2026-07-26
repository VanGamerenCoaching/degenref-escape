import { LoadingState, Panel } from '../components/ui';

export function ContentLoadingScreen() {
  return (
    <main className="app-main app-main--standalone">
      <Panel className="system-state">
        <h1>Content laden</h1>
        <p>
          De fases, vragen en regelkaarten worden lokaal voorbereid. Er worden geen
          gegevens naar een server gestuurd.
        </p>
        <LoadingState label="Content laden..." />
      </Panel>
    </main>
  );
}
