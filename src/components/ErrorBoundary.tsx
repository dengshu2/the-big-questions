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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '1.5rem',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          padding: '2rem',
        }}>
          <div style={{ fontSize: '3rem' }}>⚠</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>
            数据加载失败
          </h1>
          <p style={{ fontSize: '0.875rem', maxWidth: '400px', lineHeight: '1.75' }}>
            无法加载典籍数据，请检查网络连接后刷新页面。
            {this.state.error && (
              <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                {this.state.error.message}
              </span>
            )}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.625rem 1.5rem',
              background: 'var(--color-accent-gold)',
              color: 'var(--color-bg-primary)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
