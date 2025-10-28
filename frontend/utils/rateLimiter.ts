/**
 * Rate Limiter Utility
 * 
 * Prevents excessive API calls by enforcing a minimum interval between calls.
 * Critical for preventing ERR_INSUFFICIENT_RESOURCES errors.
 * 
 * Usage:
 * ```typescript
 * const limiter = new RateLimiter(5000); // 5 seconds minimum between calls
 * 
 * if (limiter.canProceed()) {
 *   await makeApiCall();
 * } else {
 *   console.log('Rate limited, please wait');
 * }
 * ```
 */

export class RateLimiter {
  private lastCallTime: number = 0;
  private minInterval: number;
  private callCount: number = 0;
  private blockedAttempts: number = 0;

  constructor(minIntervalMs: number) {
    if (minIntervalMs <= 0) {
      throw new Error('Minimum interval must be greater than 0');
    }
    this.minInterval = minIntervalMs;
  }

  /**
   * Check if enough time has passed since last call
   * @returns true if call is allowed, false if rate limited
   */
  canProceed(): boolean {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall >= this.minInterval || this.lastCallTime === 0) {
      this.lastCallTime = now;
      this.callCount++;
      return true;
    }
    
    this.blockedAttempts++;
    return false;
  }

  /**
   * Get time remaining until next call is allowed (in milliseconds)
   */
  getTimeRemaining(): number {
    if (this.lastCallTime === 0) return 0;
    
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    const remaining = this.minInterval - elapsed;
    
    return Math.max(0, remaining);
  }

  /**
   * Get time remaining in seconds (rounded up)
   */
  getTimeRemainingSeconds(): number {
    return Math.ceil(this.getTimeRemaining() / 1000);
  }

  /**
   * Reset the rate limiter (allows immediate next call)
   */
  reset(): void {
    this.lastCallTime = 0;
    this.blockedAttempts = 0;
  }

  /**
   * Get statistics about rate limiter usage
   */
  getStats() {
    return {
      totalCalls: this.callCount,
      blockedAttempts: this.blockedAttempts,
      lastCallTime: this.lastCallTime,
      minInterval: this.minInterval,
      timeRemaining: this.getTimeRemaining()
    };
  }

  /**
   * Update the minimum interval
   */
  setMinInterval(minIntervalMs: number): void {
    if (minIntervalMs <= 0) {
      throw new Error('Minimum interval must be greater than 0');
    }
    this.minInterval = minIntervalMs;
  }
}

/**
 * Throttle function - executes at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= intervalMs) {
      lastCall = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      // Schedule for next available slot
      const delay = intervalMs - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
        timeoutId = null;
      }, delay);
    }
  };
}

/**
 * Debounce function - delays execution until after interval has elapsed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delayMs);
  };
}