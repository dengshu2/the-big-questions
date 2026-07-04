import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '1.25rem',
            color: 'var(--ink-soft)',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ fontSize: '2.5rem', color: 'var(--gold)' }}>✦</div>
          <h1 style={{ fontSize: '1.4rem' }}>星图暂时无法展开</h1>
          <p style={{ fontSize: '0.875rem', maxWidth: 420, lineHeight: 1.75 }}>
            页面出现了意外错误，请刷新重试。
            {this.state.error && (
              <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--ink-faint)', fontSize: '0.75rem' }}>
                {this.state.error.message}
              </span>
            )}
          </p>
          <button className="btn" onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
