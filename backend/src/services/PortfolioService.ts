// backend/src/services/PortfolioService.ts
import { prisma } from './PrismaService';
import { ethers } from 'ethers';

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
   * Get user's portfolio with all positions
   */
  async getUserPortfolio(walletAddress: string) {
    const user = await this.getOrCreateUser(walletAddress);
    // No userPosition model in current schema; return empty portfolio summary
    return {
      user: { walletAddress: user.address, ens: null },
      portfolio: { totalValue: 0, totalEarnings: 0, weightedAPY: 0, positionCount: 0 },
      positions: [] as any[],
    };
  }

  /**
   * Add position to user's portfolio (manual tracking)
   */
  async addPosition(
    walletAddress: string,
    poolId: string,
    amount: number,
    amountUSD?: number
  ) {
    // Not implemented with current schema: return a friendly placeholder
    return { status: 'not-implemented', poolId, amount, amountUSD } as any;
  }

  /**
   * Remove position from portfolio
   */
  async removePosition(walletAddress: string, poolId: string) {
    // Not implemented with current schema
    return { count: 0 } as any;
  }

  /**
   * Get user's watchlist
   */
  async getWatchlist(walletAddress: string) {
    // Not implemented with current schema
    return [] as any[];
  }

  /**
   * Add pool to watchlist
   */
  async addToWatchlist(walletAddress: string, poolId: string, notes?: string) {
    // Not implemented with current schema
    return { id: 'temp', poolId, notes: notes || null, createdAt: new Date() } as any;
  }

  /**
   * Remove pool from watchlist
   */
  async removeFromWatchlist(walletAddress: string, poolId: string) {
    // Not implemented with current schema
    return { count: 0 } as any;
  }

  /**
   * Get investment suggestions based on user's holdings
   */
  async getSuggestions(walletAddress: string, riskTolerance: 'low' | 'medium' | 'high' = 'medium') {
    const portfolio = await this.getUserPortfolio(walletAddress);
    const userAssets = new Set((portfolio.positions || []).map((p: any) => p.pool.asset));
    const suggestions = await (prisma as any).pool.findMany({
      where: {
        active: true,
        verified: true,
        riskLevel: riskTolerance,
        // Prefer pools with assets user already has
        ...(userAssets.size > 0 && {
          asset: { in: Array.from(userAssets) },
        }),
      },
      include: {
        protocol: {
          select: {
            name: true,
            logo: true,
            chain: true,
            audited: true,
          },
        },
      },
      orderBy: { totalAPY: 'desc' },
      take: 5,
    });

    return {
      suggestions,
      reasoning: `Based on your ${riskTolerance} risk tolerance and current holdings`,
    };
  }
}

export default PortfolioService;
