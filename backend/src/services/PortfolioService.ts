// backend/src/services/PortfolioService.ts
import { prisma } from './PrismaService';
import { ethers } from 'ethers';
import { zapperGraphQLFetcher } from './ZapperGraphQLFetcher';
import { deBankPositionFetcher } from './DeBankPositionFetcher';
import { realPositionFetcher } from './RealPositionFetcher';

export class PortfolioService {
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  /**
   * Get or create user by wallet address
   */
  async getOrCreateUser(walletAddress: string) {
    const address = walletAddress.toLowerCase();

    let user = await (prisma as any).user.findUnique({
      where: { address },
    });

    if (!user) {
      user = await (prisma as any).user.create({
        data: { address },
      });
    }

    return user;
  }

  /**
   * Get user's portfolio with all positions (fetched from Zapper/DeBank/Blockchain)
   */
  async getUserPortfolio(walletAddress: string) {
    const user = await this.getOrCreateUser(walletAddress);
    
    // Fetch real positions using multi-tier fallback strategy
    let positions: any[] = [];
    
    try {
      // Try DeBank first (free, comprehensive)
      positions = await deBankPositionFetcher.fetchAllPositions(walletAddress);
      if (positions.length === 0) throw new Error('DeBank empty');
    } catch (debankError) {
      try {
        // Fallback to Zapper GraphQL (with key, very comprehensive)
        positions = await zapperGraphQLFetcher.fetchAllPositions(walletAddress);
        if (positions.length === 0) throw new Error('Zapper empty');
      } catch (zapperError) {
        // Final fallback: Direct blockchain queries (limited coverage)
        positions = await realPositionFetcher.fetchAllPositions(walletAddress);
      }
    }
    
    // Calculate portfolio stats
    const totalValue = positions.reduce((sum, p) => sum + (p.totalValueUSD || 0), 0);
    const totalEarnings = positions.reduce((sum, p) => sum + (p.fees24h || 0), 0);
    const weightedAPY = positions.length > 0
      ? positions.reduce((sum, p) => sum + (p.apy || 0), 0) / positions.length
      : 0;
    
    return {
      user: { walletAddress: user.address, ens: null },
      portfolio: {
        totalValue,
        totalEarnings,
        weightedAPY,
        positionCount: positions.length
      },
      positions,
    };
  }

  /**
   * Add position to user's portfolio (manual tracking)
   * ⚠️ NOT IMPLEMENTED - Manual portfolio tracking coming in next release
   * Currently only real blockchain positions are tracked automatically
   */
  async addPosition(
    walletAddress: string,
    poolId: string,
    amount: number,
    amountUSD?: number
  ) {
    console.warn('[PortfolioService] addPosition() not implemented - returns placeholder');
    return {
      status: 'not-implemented',
      message: 'Manual position tracking coming soon',
      poolId,
      amount,
      amountUSD
    } as any;
  }

  /**
   * Remove position from portfolio
   * ⚠️ NOT IMPLEMENTED - Coming in next release
   */
  async removePosition(walletAddress: string, poolId: string) {
    console.warn('[PortfolioService] removePosition() not implemented');
    return { count: 0, status: 'not-implemented' } as any;
  }

  /**
   * Get user's watchlist
   * ⚠️ NOT IMPLEMENTED - Watchlist feature coming in next release
   */
  async getWatchlist(walletAddress: string) {
    console.warn('[PortfolioService] getWatchlist() not implemented - returns empty array');
    return [] as any[];
  }

  /**
   * Add pool to watchlist
   * ⚠️ NOT IMPLEMENTED - Coming in next release
   */
  async addToWatchlist(walletAddress: string, poolId: string, notes?: string) {
    console.warn('[PortfolioService] addToWatchlist() not implemented');
    return {
      id: 'temp',
      poolId,
      notes: notes || null,
      createdAt: new Date(),
      status: 'not-implemented'
    } as any;
  }

  /**
   * Remove pool from watchlist
   * ⚠️ NOT IMPLEMENTED - Coming in next release
   */
  async removeFromWatchlist(walletAddress: string, poolId: string) {
    console.warn('[PortfolioService] removeFromWatchlist() not implemented');
    return { count: 0, status: 'not-implemented' } as any;
  }

  /**
   * Get investment suggestions based on user's holdings
   * Uses DefiLlama API data instead of database
   */
  async getSuggestions(walletAddress: string, riskTolerance: 'low' | 'medium' | 'high' = 'medium') {
    try {
      const portfolio = await this.getUserPortfolio(walletAddress);

      // Get user's current assets
      const userAssets = new Set((portfolio.positions || []).map((p: any) => p.pool?.asset || p.token0Symbol).filter(Boolean));

      // Import DefiLlama aggregator
      const { defiLlamaAggregator } = await import('./DefiLlamaAggregator');

      // Get top pools from DefiLlama based on risk tolerance
      const minAPY = riskTolerance === 'low' ? 3 : riskTolerance === 'medium' ? 5 : 8;
      const pools = await defiLlamaAggregator.getTopPools({
        minAPY,
        minTVL: 1000000, // $1M minimum TVL
        chains: ['Ethereum'],
        limit: 20,
      });

      // Filter and score suggestions
      const scoredPools = pools.map(pool => {
        let score = 0;

        // Prefer pools with assets user already has
        const poolAssets = pool.symbol.split('-');
        if (poolAssets.some(asset => userAssets.has(asset))) {
          score += 10;
        }

        // Prefer stablecoins for low risk
        if (riskTolerance === 'low' && pool.stablecoin) {
          score += 5;
        }

        // Prefer high APY for high risk
        if (riskTolerance === 'high' && pool.apy > 15) {
          score += 5;
        }

        // Avoid high IL risk for low/medium tolerance
        if (riskTolerance !== 'high' && pool.ilRisk === 'yes') {
          score -= 10;
        }

        return { ...pool, score };
      });

      // Sort by score and take top 5
      const topSuggestions = scoredPools
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(pool => ({
          id: pool.pool,
          name: `${pool.project} ${pool.symbol}`,
          asset: pool.symbol.split('-')[0],
          poolAddress: pool.pool,
          poolType: 'double',
          totalAPY: pool.apy,
          tvl: pool.tvlUsd,
          riskLevel: pool.stablecoin ? 'low' : (pool.ilRisk === 'yes' ? 'high' : 'medium'),
          protocol: {
            name: pool.project,
            chain: pool.chain,
            audited: false,
          },
        }));

      return {
        suggestions: topSuggestions,
        reasoning: `Based on your ${riskTolerance} risk tolerance${userAssets.size > 0 ? ' and current holdings' : ''}`,
      };
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return {
        suggestions: [],
        reasoning: 'Unable to fetch suggestions at this time',
      };
    }
  }
}

export default PortfolioService;
