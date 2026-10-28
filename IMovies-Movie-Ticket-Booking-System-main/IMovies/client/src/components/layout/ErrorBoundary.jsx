import React from 'react'
import Button from '../ui/Button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('IMovies React Application Error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
          <div className="max-w-md rounded-3xl border border-zinc-800 bg-cinema-900/90 p-8 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-400/10 text-2xl border border-gold-400/30">
              🎬
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              An unexpected display glitch occurred while rendering this cinema view.
            </p>
            {this.state.error?.message ? (
              <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs text-red-300 font-mono text-left break-words">
                {this.state.error.message}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => window.location.reload()} variant="primary">
                Reload Page
              </Button>
              <Button onClick={this.handleReset} variant="secondary">
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
