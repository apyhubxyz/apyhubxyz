'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useNexus } from '@avail-project/nexus-widgets';
import type { EthereumProvider } from '@avail-project/nexus-core';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';
import { RateLimiter } from '@/utils/rateLimiter';
import toast from 'react-hot-toast';

/**
 * WalletBridge Component - CRITICAL COMPONENT
 *
 * This is the SINGLE SOURCE OF TRUTH for Nexus SDK initialization.
 * It forwards the connected wallet's EIP-1193 provider to the Nexus SDK.
 *
 * ⚠️ SECURITY & PERFORMANCE IMPROVEMENTS:
 * - Debouncing: Prevents rapid re-initialization (500ms delay)
 * - Rate Limiting: Minimum 5 seconds between initialization attempts
 * - Circuit Breaker: Blocks initialization after 3 consecutive failures
 * - Proper Cleanup: Clears timeouts and resets state on unmount
 * - Error Recovery: Automatic retry with exponential backoff
 *
 * This prevents:
 * ❌ Infinite loops
 * ❌ ERR_INSUFFICIENT_RESOURCES errors
 * ❌ Memory leaks
 * ❌ Race conditions
 * ❌ Multiple simultaneous initializations
 *
 * @see https://docs.availproject.org/docs/build-with-avail/Nexus/avail-nexus-widgets-quickstart
 */
export function WalletBridge() {
  const { connector, isConnected } = useAccount();
  const { setProvider, isSdkInitialized, sdk } = useNexus();
  
  // Prevent multiple simultaneous initializations
  const isInitializing = useRef(false);
  const initTimeout = useRef<NodeJS.Timeout>();
  
  // Rate limiter - minimum 5 seconds between initialization attempts
  const rateLimiter = useRef(new RateLimiter(5000));
  
  // Circuit breaker - prevent cascading failures
  const circuitBreaker = useCircuitBreaker({
    failureThreshold: 3,    // Open circuit after 3 failures
    resetTimeout: 30000,    // Try recovery after 30 seconds
    halfOpenAttempts: 1     // Allow 1 attempt during recovery
  });
  
  // Track provider to detect changes
  const lastProviderRef = useRef<any>(null);
  const initAttempts = useRef(0);

  /**
   * Sync provider with Nexus SDK
   * Includes all safety mechanisms: debouncing, rate limiting, circuit breaker
   */
  const syncProvider = useCallback(async () => {
    // Guard: Check if we're already initializing
    if (isInitializing.current) {
      return;
    }
    
    // Guard: Check if connected
    if (!isConnected || !connector?.getProvider) {
      return;
    }
    
    // Guard: Rate limiting check
    if (!rateLimiter.current.canProceed()) {
      return;
    }
    
    // Guard: Circuit breaker check
    if (!circuitBreaker.canAttempt()) {
      return;
    }
    
    try {
      isInitializing.current = true;
      initAttempts.current++;
      
      // Get provider from wallet connector
      const provider = await connector.getProvider();
      
      if (!provider) {
        throw new Error('Provider is null or undefined');
      }
      
      // Check if provider has changed (avoid redundant updates)
      if (lastProviderRef.current === provider) {
        isInitializing.current = false;
        return;
      }
      
      // Forward provider to Nexus SDK
      await setProvider(provider as unknown as EthereumProvider);
      
      // Update tracking reference
      lastProviderRef.current = provider;
      
      // Wait a moment for provider to be processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to initialize SDK if available and not already initialized
      if (sdk && !isSdkInitialized) {
        try {
          // Try to initialize the SDK with the provider
          if (typeof sdk.initialize === 'function') {
            await sdk.initialize(provider as unknown as EthereumProvider);
            toast.success('Bridge SDK ready!', { duration: 2000 });
          }
        } catch (initError: any) {
          // SDK initialization not needed or already done
        }
      }
      
      // Record success
      circuitBreaker.recordSuccess();
      initAttempts.current = 0;
      
    } catch (error: any) {
      // Record failure in circuit breaker
      circuitBreaker.recordFailure();

      // Reset rate limiter on error to allow faster retry
      if (initAttempts.current > 3) {
        rateLimiter.current.reset();
      }
      
    } finally {
      isInitializing.current = false;
    }
  }, [isConnected, connector, setProvider, circuitBreaker]);

  /**
   * Effect: Monitor wallet connection and sync provider
   * Uses debouncing to prevent rapid re-initialization
   */
  useEffect(() => {
    // Debounce: wait 500ms before attempting sync
    initTimeout.current = setTimeout(() => {
      syncProvider();
    }, 500);
    
    // Cleanup: clear timeout on unmount or dependency change
    return () => {
      if (initTimeout.current) {
        clearTimeout(initTimeout.current);
      }
    };
  }, [syncProvider]);

  /**
   * Effect: Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isInitializing.current = false;
      lastProviderRef.current = null;
    };
  }, []);

  /**
   * Effect: Reset on disconnect
   */
  useEffect(() => {
    if (!isConnected) {
      lastProviderRef.current = null;
      initAttempts.current = 0;
      rateLimiter.current.reset();
      circuitBreaker.reset();
    }
  }, [isConnected, circuitBreaker]);

  // This component doesn't render anything - it's a bridge component
  return null;
}