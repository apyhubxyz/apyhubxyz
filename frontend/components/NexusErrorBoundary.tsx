'use client';

import React, { Component, ReactNode } from 'react';
import { FaExclamationTriangle, FaRedo, FaInfoCircle } from 'react-icons/fa';
import { HiLightningBolt } from 'react-icons/hi';

/**
 * Error Boundary for Nexus SDK
 * 
 * Catches and handles errors from the Nexus Bridge SDK initialization
 * and operations. Provides fallback UI and recovery options.
 * 
 * Features:
 * - Automatic error detection and isolation
 * - User-friendly error messages
 * - Manual retry mechanism
 * - Error count tracking to detect persistent issues
 * - Prevents entire app crash from SDK errors
 */

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

export class NexusErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const now = Date.now();
    
    // Log error details for debugging
    console.error('🔴 Nexus SDK Error Boundary Caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date(now).toISOString()
    });
    
    // Update error state with details
    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
      lastErrorTime: now
    }));
    
    // Report to monitoring service (if configured)
    this.reportError(error, errorInfo);
  }

  reportError(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Integrate with error monitoring service (e.g., Sentry, LogRocket)
    // Example:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack
    //     }
    //   }
    // });
  }

  handleReset = () => {
    console.log('🔄 Nexus Error Boundary: User initiated reset');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Force reload if too many errors
    if (this.state.errorCount > 5) {
      console.warn('⚠️ Too many errors detected, forcing page reload');
      window.location.reload();
    }
  };

  handleReload = () => {
    console.log('🔄 Nexus Error Boundary: Force reload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isPersistentError = this.state.errorCount > 3;
      const isFrequentError = this.state.errorCount > 1 && 
        (Date.now() - this.state.lastErrorTime < 10000);
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-red-200 dark:border-red-800">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Bridge Connection Error
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Error #{this.state.errorCount}
                </p>
              </div>
            </div>

            {/* Error Message */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
            </div>

            {/* Possible Causes */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FaInfoCircle className="text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Possible Causes:
                </h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Network connectivity issues</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Nexus backend service temporarily unavailable</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Wallet provider not properly connected</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Browser extension conflicts</span>
                </li>
              </ul>
            </div>

            {/* Warning for persistent errors */}
            {isPersistentError && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <HiLightningBolt className="text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                      Persistent Issue Detected
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      Multiple failures detected. The bridge service may be experiencing issues. 
                      Please try again later or contact support if the problem persists.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <FaRedo />
                Try Again
              </button>
              
              {isFrequentError && (
                <button
                  onClick={this.handleReload}
                  className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition-all duration-200"
                >
                  Reload Page
                </button>
              )}
            </div>

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-xs">
                <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto max-h-40">
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}