import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep diagnostics in DevTools without exposing stack traces in the UI.
    console.error("Criando XP render failure", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="fatal-shell" role="alert">
        <section className="fatal-card" aria-labelledby="fatal-title">
          <img src="/icons/criandoxp.png" alt="" width="48" height="48" />
          <p className="fatal-eyebrow">Falha inesperada</p>
          <h1 id="fatal-title">A central encontrou um problema.</h1>
          <p>
            Seus dados não foram apagados. Recarregue a aplicação; se o problema continuar,
            abra novamente a central e repita a última ação.
          </p>
          <div className="fatal-actions">
            <button type="button" onClick={() => window.location.reload()}>Recarregar</button>
            <button type="button" className="secondary" onClick={() => { window.history.replaceState({}, "", "/"); window.location.reload(); }}>
              Voltar ao início
            </button>
          </div>
        </section>
      </main>
    );
  }
}
