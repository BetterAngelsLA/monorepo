import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MapErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full bg-white p-8">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-6">
            <p className="text-gray-700 font-medium">Map Component Error</p>
            <p className="text-gray-600 text-sm mt-2">
              The map couldn't load due to API issues. Other features are
              available.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
