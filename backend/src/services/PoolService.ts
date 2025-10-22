// backend/src/services/PoolService.ts
import { prisma } from './PrismaService';
import { Prisma } from '@prisma/client';

export interface PoolFilters {
  asset?: string;
  poolType?: 'single' | 'double' | 'lending' | 'staking';
  isLoopable?: boolean;
  protocolId?: string;
  chain?: string;
  minAPY?: number;
  maxAPY?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  active?: boolean;
}

export interface PoolSortOptions {
  sortBy?: 'totalAPY' | 'tvl' | 'riskScore' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class PoolService {
  /**
   * Get pools with advanced filtering, sorting, and pagination
   */
  async getPools(
    filters: PoolFilters = {},
    sortOptions: PoolSortOptions = {},
    paginationOptions: PaginationOptions = {}
  ) {
    const {
      asset,
      poolType,
      isLoopable,
      protocolId,
      chain,
      minAPY,
      maxAPY,
      riskLevel,
      active = true,
    } = filters;

    const { sortBy = 'totalAPY', sortOrder = 'desc' } = sortOptions;
    const { page = 1, limit = 20 } = paginationOptions;

    // Build where clause
  const where: any = {
      active,
      ...(asset && { asset: { contains: asset, mode: 'insensitive' } }),
      ...(poolType && { poolType }),
      ...(isLoopable !== undefined && { isLoopable }),
      ...(protocolId && { protocolId }),
      ...(riskLevel && { riskLevel }),
      ...(chain && {
        protocol: {
          chain: { contains: chain, mode: 'insensitive' },
        },
      }),
      ...(minAPY !== undefined || maxAPY !== undefined
        ? {
            totalAPY: {
              ...(minAPY !== undefined && { gte: minAPY }),
              ...(maxAPY !== undefined && { lte: maxAPY }),
            },
          }
        : {}),
    };

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const [pools, total] = await Promise.all([
  (prisma as any).pool.findMany({
        where,
        include: {
          protocol: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              chain: true,
              audited: true,
              website: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
  (prisma as any).pool.count({ where }),
    ]);

    return {
      pools,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single pool by ID with all details
   */
  async getPoolById(id: string) {
  const pool = await (prisma as any).pool.findUnique({
      where: { id },
      include: {
        protocol: true,
        historicalData: {
          orderBy: { timestamp: 'desc' },
          take: 90, // Last 90 data points
        },
      },
    });

    return pool;
  }

  /**
   * Get pool by address
   */
  async getPoolByAddress(address: string) {
  return await (prisma as any).pool.findUnique({
      where: { poolAddress: address },
      include: {
        protocol: true,
      },
    });
  }

  /**
   * Get top pools by APY
   */
  async getTopPools(limit: number = 10) {
  return await (prisma as any).pool.findMany({
      where: { active: true, verified: true },
      include: {
        protocol: {
          select: {
            name: true,
            logo: true,
            chain: true,
          },
        },
      },
      orderBy: { totalAPY: 'desc' },
      take: limit,
    });
  }

  /**
   * Get pools by protocol
   */
  async getPoolsByProtocol(protocolSlug: string) {
    const protocol = await prisma.protocol.findUnique({
      where: { slug: protocolSlug },
    });

    if (!protocol) {
      return null;
    }

  return await (prisma as any).pool.findMany({
      where: {
        protocolId: protocol.id,
        active: true,
      },
      include: {
        protocol: true,
      },
      orderBy: { totalAPY: 'desc' },
    });
  }

  /**
   * Search pools by name or asset
   */
  async searchPools(query: string) {
    return await prisma.pool.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { asset: { contains: query, mode: 'insensitive' } },
        ],
        active: true,
      },
      include: {
        protocol: {
          select: {
            name: true,
            logo: true,
            chain: true,
          },
        },
      },
      take: 20,
    });
  }

  /**
   * Get pool statistics
   */
  async getPoolStats() {
    const [totalPools, activePools, totalTVL, avgAPY] = await Promise.all([
      (prisma as any).pool.count(),
      (prisma as any).pool.count({ where: { active: true } }),
      (prisma as any).pool.aggregate({
        where: { active: true },
        _sum: { tvl: true },
      }),
      (prisma as any).pool.aggregate({
        where: { active: true },
        _avg: { totalAPY: true },
      }),
    ]);

    return {
      totalPools,
      activePools,
      totalTVL: totalTVL._sum.tvl ?? 0,
      avgAPY: avgAPY._avg.totalAPY ?? 0,
    };
  }

  /**
   * Get similar pools (same asset, different protocols)
   */
  async getSimilarPools(poolId: string) {
  const pool = await (prisma as any).pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      return [];
    }

  return await (prisma as any).pool.findMany({
      where: {
        asset: pool.asset,
        id: { not: poolId },
        active: true,
      },
      include: {
        protocol: {
          select: {
            name: true,
            logo: true,
            chain: true,
          },
        },
      },
      orderBy: { totalAPY: 'desc' },
      take: 5,
    });
  }
}

export default new PoolService();
