import { Component, ReactNode, ErrorInfo } from 'react'
import { ErrorAlert } from './ErrorAlert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | undefined
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: undefined
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100">
          <ErrorAlert error={this.state.error} message="An unexpected error occurred" tryAgain={() => {
            this.setState({ hasError: false, error: undefined })
            window.location.reload()
          }} />
        </div>
      )
    }

    return this.props.children
  }
}