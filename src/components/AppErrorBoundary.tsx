import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Ottimo application error', error, info)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="app-error" role="alert" aria-labelledby="app-error-title">
        <div className="app-error__panel">
          <p className="eyebrow">Something went wrong</p>
          <h1 id="app-error-title">Ottimo could not finish loading this view.</h1>
          <p>
            The application hit an unexpected runtime error. Your saved audit evidence is not changed by this screen.
          </p>
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
            Reload Ottimo
          </button>
        </div>
      </main>
    )
  }
}
