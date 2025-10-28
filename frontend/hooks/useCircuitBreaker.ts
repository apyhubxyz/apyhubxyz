import { useState, useRef, useCallback } from 'react';

/**
 * Circuit Breaker Pattern Hook
 * 
 * Prevents repeated failures from cascading by opening the circuit after threshold.
 * Automatically attempts recovery after timeout period.
 * 
 * States:
 * - CLOSED: Normal operation, allows all requests
 * - OPEN: Too many failures, blocks all requests
 * - HALF_OPEN: Testing recovery, allows limited requests
 */

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenAttempts: number;
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export function useCircuitBreaker(config: CircuitBreakerConfig = {
  failureThreshold: 3,      // Open circuit after 3 failures
  resetTimeout: 30000,      // Try recovery after 30 seconds
  halfOpenAttempts: 1       // Allow 1 attempt in half-open state
}) {
  const [state, setState] = useState<CircuitState>('CLOSED');
  const failureCount = useRef(0);
  const lastFailureTime = useRef<number>(0);
  const resetTimer = useRef<NodeJS.Timeout>();
  const halfOpenAttempts = useRef(0);

  const recordFailure = useCallback(() => {
    failureCount.current++;
    lastFailureTime.current = Date.now();

    if (failureCount.current >= config.failureThreshold) {
      setState('OPEN');

      // Auto-reset to half-open after timeout
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }

      resetTimer.current = setTimeout(() => {
        setState('HALF_OPEN');
        halfOpenAttempts.current = 0;
      }, config.resetTimeout);
    }
  }, [config.failureThreshold, config.resetTimeout]);

  const recordSuccess = useCallback(() => {
    const previousState = state;
    failureCount.current = 0;
    halfOpenAttempts.current = 0;
    setState('CLOSED');

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
  }, [state]);

  const canAttempt = useCallback(() => {
    if (state === 'CLOSED') {
      return true;
    }
    
    if (state === 'OPEN') {
      return false;
    }
    
    // HALF_OPEN state: allow limited attempts
    if (state === 'HALF_OPEN') {
      if (halfOpenAttempts.current < config.halfOpenAttempts) {
        halfOpenAttempts.current++;
        return true;
      }
      return false;
    }
    
    return false;
  }, [state, config.halfOpenAttempts]);

  const reset = useCallback(() => {
    failureCount.current = 0;
    halfOpenAttempts.current = 0;
    setState('CLOSED');

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
  }, []);

  return {
    state,
    canAttempt,
    recordFailure,
    recordSuccess,
    reset,
    failureCount: failureCount.current,
    lastFailureTime: lastFailureTime.current
  };
}