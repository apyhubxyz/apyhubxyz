// backend/src/services/PoolService.ts
import { prisma } from './PrismaService';
import { Prisma } from '@prisma/client';
import { ethers } from 'ethers';
import Redis from 'ioredis';
import { getEnvioHyperIndex } from './EnvioHyperIndex';
import { DEFI_API_CONFIG } from '../config/defi-apis';

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
// Envio client setup
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'
);
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const envio = getEnvioHyperIndex(provider, {
  apiKey: DEFI_API_CONFIG.envio.apiKey,
  indexerUrl: DEFI_API_CONFIG.envio.hyperIndexUrl,
  networkId: DEFI_API_CONFIG.envio.networkId,
  cacheEnabled: true,
  cacheTTL: DEFI_API_CONFIG.envio.cacheTTL,
}, redis);

// Default protocol set covering common platforms supported by Envio index
const DEFAULT_PROTOCOLS = [
  'aave','compound','curve','balancer','uniswap-v3','sushiswap','yearn','beefy',
  'pendle','silo','morpho','radiant','stargate','aerodrome','rocketpool','lido'
];

type UINormalizedPool = {
  id: string;
  name: string;
  asset: string;
  assetAddress?: string;
  poolAddress: string;
  poolType: 'single' | 'double' | 'lending' | 'staking';
  isLoopable: boolean;
  supplyAPY: number;
  borrowAPY?: number;
  rewardAPY?: number;
  totalAPY: number;
  tvl: number;
  availableLiquidity?: number;
  utilizationRate?: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore?: number;
  minDeposit?: number;
  lockPeriod?: number;
  active: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  protocol?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    chain: string;
    audited: boolean;
    website?: string;
  };
  historicalData?: Array<{
    id: string;
    supplyAPY: number;
    borrowAPY?: number;
    totalAPY: number;
    tvl: number;
    timestamp: string;
  }>;
};

function mapEnvioToUIPool(p: any): UINormalizedPool {
  const tokenA = p.tokenA || 'TOKEN0';
  const tokenB = p.tokenB || 'TOKEN1';
  const slug = (p.protocol || 'unknown').toLowerCase();
  const chain = DEFI_API_CONFIG.envio.networkId === 1 ? 'ethereum' : `chain-${DEFI_API_CONFIG.envio.networkId}`;
  const isStable = /USD|USDC|USDT|DAI|PYUSD/i.test(`${tokenA}${tokenB}`);
  return {
    id: p.poolAddress,
    name: `${(p.protocol || 'Protocol').toUpperCase()} ${tokenA}/${tokenB}`,
    asset: `${tokenA}-${tokenB}`,
    poolAddress: p.poolAddress,
    poolType: 'double',
    isLoopable: false,
    supplyAPY: Number(p.apy) || 0,
    totalAPY: Number(p.apy) || 0,
    tvl: Number(p.tvlUsd) || 0,
    availableLiquidity: Number(p.tvlUsd) || 0,
    riskLevel: isStable ? 'low' : 'medium',
    active: true,
    verified: false,
    createdAt: new Date(p.timestamp || Date.now()).toISOString(),
    updatedAt: new Date().toISOString(),
    protocol: {
      id: slug,
      name: (p.protocol || 'Protocol').toUpperCase(),
      slug,
      chain,
      audited: false,
    },
  };
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

    // Resolve protocol slug if a protocolId (DB id) is provided
    let protocols: string[] = DEFAULT_PROTOCOLS;
    if (protocolId) {
      try {
        const proto = await (prisma as any).protocol.findUnique({ where: { id: protocolId } });
        if (proto?.slug) {
          protocols = [proto.slug];
        }
      } catch { /* ignore */ }
    }

    // Fetch from Envio or fallback to demo data
    let raw: any[] = [];
    try {
      raw = await envio.getIndexedPools(protocols, { limit: 500, offset: 0 });
    } catch (error) {
      console.log('Envio fetch failed, using demo pools');
      // Return demo pools for development
      raw = this.getDemoPools();
    }
    let mapped: UINormalizedPool[] = raw.map(mapEnvioToUIPool);

    // Apply filters
    mapped = mapped.filter(pool => {
      if (active !== undefined && pool.active !== active) return false;
      if (asset && !pool.asset.toLowerCase().includes(asset.toLowerCase())) return false;
      if (poolType && pool.poolType !== poolType) return false;
      if (isLoopable !== undefined && pool.isLoopable !== (isLoopable as boolean)) return false;
      if (riskLevel && pool.riskLevel !== riskLevel) return false;
      if (minAPY !== undefined && pool.totalAPY < minAPY) return false;
      if (maxAPY !== undefined && pool.totalAPY > maxAPY) return false;
      if (chain && pool.protocol?.chain && !pool.protocol.chain.toLowerCase().includes(chain.toLowerCase())) return false;
      return true;
    });

    // Sort
    mapped.sort((a: any, b: any) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    // Paginate
    const skip = (page - 1) * limit;
    const pageItems = mapped.slice(skip, skip + limit);

    return {
      pools: pageItems,
      pagination: {
        total: mapped.length,
        page,
        limit,
        totalPages: Math.ceil(mapped.length / limit),
      },
    };
  }

  /**
   * Get a single pool by ID with all details
   */
  async getPoolById(id: string) {
    // Treat id as poolAddress for Envio-backed pools
    const raw = await envio.getIndexedPools(DEFAULT_PROTOCOLS, { limit: 1000, offset: 0 });
    const found = raw.find((p: any) => (p.poolAddress || '').toLowerCase() === id.toLowerCase());
    if (!found) return null;
    return mapEnvioToUIPool(found);
  }

  /**
   * Get pool by address
   */
  async getPoolByAddress(address: string) {
    const raw = await envio.getIndexedPools(DEFAULT_PROTOCOLS, { limit: 1000, offset: 0 });
    const found = raw.find((p: any) => (p.poolAddress || '').toLowerCase() === address.toLowerCase());
    return found ? mapEnvioToUIPool(found) : null;
  }

  /**
   * Get top pools by APY
   */
  async getTopPools(limit: number = 10) {
    const raw = await envio.getIndexedPools(DEFAULT_PROTOCOLS, { limit: 500, offset: 0 });
    return raw
      .map(mapEnvioToUIPool)
      .sort((a, b) => b.totalAPY - a.totalAPY)
      .slice(0, limit);
  }

  /**
   * Get pools by protocol
   */
  async getPoolsByProtocol(protocolSlug: string) {
    const raw = await envio.getIndexedPools([protocolSlug], { limit: 500, offset: 0 });
    const mapped = raw.map(mapEnvioToUIPool).filter(p => p.active);
    return mapped.sort((a, b) => b.totalAPY - a.totalAPY);
  }

  /**
   * Search pools by name or asset
   */
  async searchPools(query: string) {
    const raw = await envio.getIndexedPools(DEFAULT_PROTOCOLS, { limit: 500, offset: 0 });
    const searchTerm = query.toLowerCase();
    return raw
      .map(mapEnvioToUIPool)
      .filter(p => p.name.toLowerCase().includes(searchTerm) || p.asset.toLowerCase().includes(searchTerm))
      .slice(0, 20);
  }

  /**
   * Get pool statistics
   */
  async getPoolStats() {
    const raw = await envio.getIndexedPools(DEFAULT_PROTOCOLS, { limit: 500, offset: 0 });
    const mapped = raw.map(mapEnvioToUIPool);
    const activePools = mapped.filter(p => p.active);
    const totalTVL = activePools.reduce((sum, p) => sum + (p.tvl || 0), 0);
    const avgAPY = activePools.length > 0 ? activePools.reduce((sum, p) => sum + (p.totalAPY || 0), 0) / activePools.length : 0;
    return { totalPools: mapped.length, activePools: activePools.length, totalTVL, avgAPY };
  }

  /**
   * Get demo pools for development/testing
   */
  getDemoPools() {
    return [
      {
        poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        protocol: 'Uniswap V3',
        tokenA: 'WETH',
        tokenB: 'USDC',
        apy: 18.5,
        tvlUsd: 285000000,
        timestamp: Date.now(),
      },
      {
        poolAddress: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
        protocol: 'Aave V3',
        tokenA: 'WETH',
        tokenB: '',
        apy: 3.2,
        tvlUsd: 450000000,
        timestamp: Date.now(),
      },
      {
        poolAddress: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
        protocol: 'Curve',
        tokenA: '3CRV',
        tokenB: '',
        apy: 5.8,
        tvlUsd: 180000000,
        timestamp: Date.now(),
      },
    ];
  }

  /**
   * Get similar pools (same asset, different protocols)
   */
  async getSimilarPools(poolId: string) {
    const raw = await envio.getIndexedPools(DEFAULT_PROTOCOLS, { limit: 500, offset: 0 });
    const mapped = raw.map(mapEnvioToUIPool);
    const base = mapped.find(p => p.id.toLowerCase() === poolId.toLowerCase());
    if (!base) return [];
    return mapped
      .filter(p => p.asset === base.asset && p.id.toLowerCase() !== poolId.toLowerCase() && p.active)
      .sort((a, b) => b.totalAPY - a.totalAPY)
      .slice(0, 5);
  }
}

export default new PoolService();
