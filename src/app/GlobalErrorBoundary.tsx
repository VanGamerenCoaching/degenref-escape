import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppButton, Panel, StatusMessage } from '../components/ui';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

interface GlobalErrorBoundaryState {
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  override state: GlobalErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Onverwachte applicatiefout', error, info.componentStack);
  }

  override render() {
    if (this.state.error !== null) {
      return (
        <main className="app-main app-main--standalone">
          <Panel>
            <StatusMessage title="Er ging iets mis" variant="danger">
              De app is gestopt door een onverwachte fout. Herlaad de pagina om opnieuw
              te beginnen.
            </StatusMessage>
            <pre className="error-details">{this.state.error.message}</pre>
            <AppButton onClick={() => window.location.reload()}>Pagina herladen</AppButton>
          </Panel>
        </main>
      );
    }

    return this.props.children;
  }
}
