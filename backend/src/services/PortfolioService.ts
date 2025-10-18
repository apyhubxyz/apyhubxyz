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

    let user = await prisma.user.findUnique({
      where: { walletAddress: address },
    });

    if (!user) {
      // Try to resolve ENS name
      let ens: string | null = null;
      try {
        ens = await this.provider.lookupAddress(address);
      } catch (error) {
        console.log('ENS lookup failed:', error);
      }

      user = await prisma.user.create({
        data: {
          walletAddress: address,
          ens,
        },
      });
    } else {
      // Update last seen
      user = await prisma.user.update({
        where: { walletAddress: address },
        data: { lastSeen: new Date() },
      });
    }

    return user;
  }

  /**
   * Get user's portfolio with all positions
   */
  async getUserPortfolio(walletAddress: string) {
    const user = await this.getOrCreateUser(walletAddress);

    const positions = await prisma.userPosition.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      include: {
        pool: {
          include: {
            protocol: {
              select: {
                name: true,
                logo: true,
                chain: true,
              },
            },
          },
        },
      },
      orderBy: { amountUSD: 'desc' },
    });

    // Calculate total portfolio value
    const totalValue = positions.reduce((sum, pos) => {
      return sum + (pos.amountUSD?.toNumber() || 0);
    }, 0);

    const totalEarnings = positions.reduce((sum, pos) => {
      return sum + (pos.earningsUSD?.toNumber() || 0);
    }, 0);

    const weightedAPY = positions.reduce((sum, pos) => {
      const weight = (pos.amountUSD?.toNumber() || 0) / totalValue;
      return sum + pos.currentAPY.toNumber() * weight;
    }, 0);

    return {
      user: {
        walletAddress: user.walletAddress,
        ens: user.ens,
      },
      portfolio: {
        totalValue,
        totalEarnings,
        weightedAPY,
        positionCount: positions.length,
      },
      positions: positions.map((pos) => ({
        id: pos.id,
        pool: {
          id: pos.pool.id,
          name: pos.pool.name,
          asset: pos.pool.asset,
          poolAddress: pos.pool.poolAddress,
          protocol: pos.pool.protocol,
        },
        amount: pos.amount.toString(),
        amountUSD: pos.amountUSD?.toNumber() || 0,
        entryAPY: pos.entryAPY.toNumber(),
        currentAPY: pos.currentAPY.toNumber(),
        earnings: pos.earnings.toString(),
        earningsUSD: pos.earningsUSD?.toNumber() || 0,
        startDate: pos.startDate,
        lastUpdated: pos.lastUpdated,
      })),
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
    const user = await this.getOrCreateUser(walletAddress);

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new Error('Pool not found');
    }

    // Check if position already exists
    const existingPosition = await prisma.userPosition.findUnique({
      where: {
        userId_poolId: {
          userId: user.id,
          poolId: poolId,
        },
      },
    });

    if (existingPosition) {
      // Update existing position
      return await prisma.userPosition.update({
        where: { id: existingPosition.id },
        data: {
          amount,
          amountUSD,
          currentAPY: pool.totalAPY,
          lastUpdated: new Date(),
          active: true,
        },
      });
    }

    // Create new position
    return await prisma.userPosition.create({
      data: {
        userId: user.id,
        poolId: poolId,
        amount,
        amountUSD,
        entryAPY: pool.totalAPY,
        currentAPY: pool.totalAPY,
      },
    });
  }

  /**
   * Remove position from portfolio
   */
  async removePosition(walletAddress: string, poolId: string) {
    const user = await this.getOrCreateUser(walletAddress);

    return await prisma.userPosition.updateMany({
      where: {
        userId: user.id,
        poolId: poolId,
      },
      data: {
        active: false,
      },
    });
  }

  /**
   * Get user's watchlist
   */
  async getWatchlist(walletAddress: string) {
    const user = await this.getOrCreateUser(walletAddress);

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: {
        // Note: poolId is just a string, we'll need to fetch pools separately
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch pool details
    const poolIds = watchlist.map((w) => w.poolId);
    const pools = await prisma.pool.findMany({
      where: { id: { in: poolIds } },
      include: {
        protocol: {
          select: {
            name: true,
            logo: true,
            chain: true,
          },
        },
      },
    });

    return watchlist.map((w) => {
      const pool = pools.find((p) => p.id === w.poolId);
      return {
        id: w.id,
        pool,
        notes: w.notes,
        createdAt: w.createdAt,
      };
    });
  }

  /**
   * Add pool to watchlist
   */
  async addToWatchlist(walletAddress: string, poolId: string, notes?: string) {
    const user = await this.getOrCreateUser(walletAddress);

    // Check if pool exists
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new Error('Pool not found');
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_poolId: {
          userId: user.id,
          poolId: poolId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return await prisma.watchlist.create({
      data: {
        userId: user.id,
        poolId: poolId,
        notes,
      },
    });
  }

  /**
   * Remove pool from watchlist
   */
  async removeFromWatchlist(walletAddress: string, poolId: string) {
    const user = await this.getOrCreateUser(walletAddress);

    return await prisma.watchlist.deleteMany({
      where: {
        userId: user.id,
        poolId: poolId,
      },
    });
  }

  /**
   * Get investment suggestions based on user's holdings
   */
  async getSuggestions(walletAddress: string, riskTolerance: 'low' | 'medium' | 'high' = 'medium') {
    const portfolio = await this.getUserPortfolio(walletAddress);

    // Get user's current assets
    const userAssets = new Set(portfolio.positions.map((p) => p.pool.asset));

    // Find high APY pools with similar risk
    const suggestions = await prisma.pool.findMany({
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
