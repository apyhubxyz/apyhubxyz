// Base Platform Adapter - Interface for all DeFi platforms
// Each platform (Pendle, Beefy, etc.) extends this

export interface PlatformPosition {
  id: string;
  platform: string;  // e.g., "Pendle", "Beefy"
  poolAddress: string;
  poolName: string;
  chain: string;
  asset: string;
  apy: number;
  tvl: number;
  risk: {
    score: number;  // 0-100, lower is safer
    ilRisk: number;  // Impermanent loss risk
    liquidationRisk: number;  // For leveraged positions
    auditScore: number;  // Protocol audit score
  };
  composability: string[];  // Other protocols this can stack with
  minDeposit: number;  // Minimum USD
  lockPeriod?: number;  // Days locked (0 = no lock)
  rewardTokens: string[];  // Reward token symbols
  lastUpdated: Date;
}

export abstract class BasePlatformAdapter {
  abstract platformName: string;
  abstract apiBaseUrl: string;
  
  /**
   * Fetch all LP positions from this platform
   */
  abstract fetchPositions(): Promise<PlatformPosition[]>;
  
  /**
   * Calculate risk score for a position (0-100, lower is safer)
   */
  calculateRiskScore(
    ilRisk: number,
    liquidationRisk: number,
    auditScore: number
  ): number {
    // Weighted risk: IL (40%), liquidation (40%), audit (20%)
    return (
      ilRisk * 0.4 +
      liquidationRisk * 0.4 +
      (100 - auditScore) * 0.2
    );
  }
  
  /**
   * Estimate IL risk based on asset volatility
   */
  estimateILRisk(asset: string): number {
    // Simplified: Stable = 5, ETH/BTC = 30, Alts = 60
    const stablecoins = ['USDC', 'USDT', 'DAI', 'PYUSD', 'FRAX', 'LUSD'];
    const majors = ['ETH', 'WETH', 'BTC', 'WBTC'];
    
    if (stablecoins.some(s => asset.includes(s))) return 5;
    if (majors.some(m => asset.includes(m))) return 30;
    return 60;  // High risk for altcoins
  }
}

