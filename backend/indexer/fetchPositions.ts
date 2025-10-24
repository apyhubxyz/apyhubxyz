/**
 * Envio HyperSync Position Fetcher
 * Queries and processes LP positions from multiple chains
 */

import { GraphQLClient } from 'graphql-request';
import { ethers } from 'ethers';
import Redis from 'ioredis';
import ENVIO_CONFIG from './envio.config';

// Initialize Redis with fallback to in-memory cache
class CacheManager {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { data: any; expiry: number }> = new Map();
  private connected = false;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryStrategy: (times) => {
          if (times > 3) {
            console.log('⚠️ Redis unavailable, using in-memory cache');
            this.connected = false;
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected for caching');
        this.connected = true;
      });

      this.redis.on('error', (err: any) => {
        if (err.code === 'ECONNREFUSED') {
          // Silently fallback to memory cache
          this.connected = false;
        }
      });

      // Try to connect
      this.redis.connect().catch(() => {
        this.connected = false;
      });
    } catch (error) {
      console.log('📝 Using in-memory cache (Redis not available)');
      this.connected = false;
    }
  }

  async get(key: string): Promise<any> {
    if (this.connected && this.redis) {
      try {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } catch {
        // Fallback to memory
      }
    }
    
    // Check memory cache
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  }

  async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    const stringValue = JSON.stringify(value);
    
    if (this.connected && this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, stringValue);
        return;
      } catch {
        // Fallback to memory
      }
    }
    
    // Store in memory cache
    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + (ttlSeconds * 1000),
    });
  }
}

// Initialize cache manager
const cache = new CacheManager();

// GraphQL client for Envio
const graphqlClient = new GraphQLClient(ENVIO_CONFIG.hyperIndexUrl, {
  headers: {
    'Authorization': `Bearer ${ENVIO_CONFIG.apiKey}`,
  },
});

// Position interface
export interface LPPosition {
  id: string;
  userAddress: string;
  poolAddress: string;
  poolName: string;
  protocol: string;
  chain: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Amount: string;
  token1Amount: string;
  totalValueUSD: number;
  apy: number;
  apyBreakdown: {
    base: number;
    rewards: number;
    fees: number;
  };
  fees24h: number;
  fees7d: number;
  feesTotal: number;
  impermanentLoss: number;
  impermanentLossUSD: number;
  healthFactor?: number;
  positionType: 'LP' | 'LENDING' | 'BORROWING' | 'STAKING';
  nftTokenId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Fetch positions query
const FETCH_POSITIONS_QUERY = `
  query FetchPositions($userAddress: String!, $chainId: Int, $protocol: String) {
    positions(userAddress: $userAddress, chainId: $chainId, protocol: $protocol) {
      id
      userAddress
      positionType
      token0Symbol
      token0Amount
      token0ValueUSD
      token1Symbol
      token1Amount
      token1ValueUSD
      totalValueUSD
      apy
      apyBreakdown {
        base
        rewards
        fees
        total
      }
      fees24h
      fees7d
      feesTotal
      impermanentLoss
      impermanentLossUSD
      healthFactor
      nftTokenId
      createdAt
      updatedAt
      pool {
        id
        poolAddress
        poolName
        chain
        protocol {
          name
          slug
        }
        tvlUSD
        apy
        isLoopable
      }
    }
  }
`;

// Fetch pools query
const FETCH_POOLS_QUERY = `
  query FetchPools($limit: Int, $offset: Int, $chainId: Int, $orderBy: PoolOrderBy) {
    pools(limit: $limit, offset: $offset, chainId: $chainId, orderBy: $orderBy) {
      id
      poolAddress
      poolName
      chain
      tvlUSD
      volume24h
      volume7d
      apy
      apyBreakdown {
        base
        rewards
        fees
        total
      }
      swapFee
      isLoopable
      hasRewards
      protocol {
        name
        slug
        category
        riskScore
      }
      token0 {
        symbol
        name
        address
        priceUSD
      }
      token1 {
        symbol
        name
        address
        priceUSD
      }
    }
  }
`;

// Main position fetcher
export class PositionFetcher {
  private providers: Map<string, ethers.Provider> = new Map();

  constructor() {
    // Initialize providers for each network
    ENVIO_CONFIG.networks.forEach(network => {
      this.providers.set(
        network.name,
        new ethers.JsonRpcProvider(network.rpcUrl)
      );
    });
  }

  /**
   * Fetch user positions across all chains
   */
  async fetchUserPositions(
    userAddress: string,
    chainId?: number,
    protocol?: string
  ): Promise<LPPosition[]> {
    const cacheKey = `positions:${userAddress}:${chainId || 'all'}:${protocol || 'all'}`;
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('📦 Returning cached positions');
      return cached;
    }

    try {
      // If API key is not configured, return demo data
      if (!ENVIO_CONFIG.apiKey || ENVIO_CONFIG.apiKey === '') {
        console.log('🔍 Demo Mode: Returning sample positions');
        return this.getDemoPositions(userAddress);
      }

      // Query Envio HyperSync
      const response = await graphqlClient.request(FETCH_POSITIONS_QUERY, {
        userAddress,
        chainId,
        protocol,
      });

      // Transform response to LPPosition format
      const positions = this.transformPositions(response.positions);

      // Cache the result
      await cache.set(cacheKey, positions, ENVIO_CONFIG.indexing.cacheTTL);

      return positions;
    } catch (error) {
      console.error('Error fetching positions from Envio:', error);
      // Return demo data as fallback
      return this.getDemoPositions(userAddress);
    }
  }

  /**
   * Fetch pools with optional filters
   */
  async fetchPools(
    limit: number = 100,
    offset: number = 0,
    chainId?: number,
    orderBy: string = 'TVL_DESC'
  ): Promise<any[]> {
    const cacheKey = `pools:${limit}:${offset}:${chainId || 'all'}:${orderBy}`;
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('📦 Returning cached pools');
      return cached;
    }

    try {
      // If API key is not configured, return demo data
      if (!ENVIO_CONFIG.apiKey || ENVIO_CONFIG.apiKey === '') {
        console.log('🔍 Demo Mode: Returning sample pools');
        return this.getDemoPools();
      }

      const response = await graphqlClient.request(FETCH_POOLS_QUERY, {
        limit,
        offset,
        chainId,
        orderBy,
      });

      const pools = response.pools;

      // Cache the result
      await cache.set(cacheKey, pools, ENVIO_CONFIG.indexing.cacheTTL);

      return pools;
    } catch (error) {
      console.error('Error fetching pools from Envio:', error);
      return this.getDemoPools();
    }
  }

  /**
   * Transform raw Envio response to LPPosition format
   */
  private transformPositions(rawPositions: any[]): LPPosition[] {
    return rawPositions.map(pos => ({
      id: pos.id,
      userAddress: pos.userAddress,
      poolAddress: pos.pool.poolAddress,
      poolName: pos.pool.poolName,
      protocol: pos.pool.protocol.name,
      chain: pos.pool.chain,
      token0Symbol: pos.token0Symbol,
      token1Symbol: pos.token1Symbol || '',
      token0Amount: pos.token0Amount,
      token1Amount: pos.token1Amount || '0',
      totalValueUSD: pos.totalValueUSD,
      apy: pos.apy,
      apyBreakdown: {
        base: pos.apyBreakdown.base,
        rewards: pos.apyBreakdown.rewards,
        fees: pos.apyBreakdown.fees,
      },
      fees24h: pos.fees24h,
      fees7d: pos.fees7d,
      feesTotal: pos.feesTotal,
      impermanentLoss: pos.impermanentLoss,
      impermanentLossUSD: pos.impermanentLossUSD,
      healthFactor: pos.healthFactor,
      positionType: pos.positionType,
      nftTokenId: pos.nftTokenId,
      createdAt: new Date(pos.createdAt),
      updatedAt: new Date(pos.updatedAt),
    }));
  }

  /**
   * Get demo positions for development/testing
   */
  private getDemoPositions(userAddress: string): LPPosition[] {
    return [
      {
        id: 'demo-pos-1',
        userAddress,
        poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        poolName: 'WETH/USDC 0.05%',
        protocol: 'Uniswap V3',
        chain: 'ethereum',
        token0Symbol: 'WETH',
        token1Symbol: 'USDC',
        token0Amount: '10.5',
        token1Amount: '25000',
        totalValueUSD: 52500,
        apy: 24.5,
        apyBreakdown: {
          base: 18.5,
          rewards: 4.0,
          fees: 2.0,
        },
        fees24h: 35.42,
        fees7d: 248.12,
        feesTotal: 1842.33,
        impermanentLoss: 2.3,
        impermanentLossUSD: 1207.50,
        healthFactor: undefined,
        positionType: 'LP',
        nftTokenId: '123456',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
      },
      {
        id: 'demo-pos-2',
        userAddress,
        poolAddress: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
        poolName: 'Aave V3 WETH',
        protocol: 'Aave V3',
        chain: 'ethereum',
        token0Symbol: 'aWETH',
        token1Symbol: '',
        token0Amount: '15.75',
        token1Amount: '0',
        totalValueUSD: 31500,
        apy: 3.8,
        apyBreakdown: {
          base: 3.2,
          rewards: 0.6,
          fees: 0,
        },
        fees24h: 3.28,
        fees7d: 22.96,
        feesTotal: 456.78,
        impermanentLoss: 0,
        impermanentLossUSD: 0,
        healthFactor: 2.45,
        positionType: 'LENDING',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date(),
      },
      {
        id: 'demo-pos-3',
        userAddress,
        poolAddress: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
        poolName: 'ARB/ETH 0.3%',
        protocol: 'Uniswap V3',
        chain: 'arbitrum',
        token0Symbol: 'ARB',
        token1Symbol: 'ETH',
        token0Amount: '10000',
        token1Amount: '5.2',
        totalValueUSD: 21000,
        apy: 35.2,
        apyBreakdown: {
          base: 25.0,
          rewards: 8.2,
          fees: 2.0,
        },
        fees24h: 20.19,
        fees7d: 141.33,
        feesTotal: 892.45,
        impermanentLoss: 5.2,
        impermanentLossUSD: 1092,
        healthFactor: undefined,
        positionType: 'LP',
        nftTokenId: '789012',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Get demo pools for development/testing
   */
  private getDemoPools(): any[] {
    return [
      {
        id: 'pool-1',
        poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        poolName: 'WETH/USDC 0.05%',
        chain: 'ETHEREUM',
        tvlUSD: 285000000,
        volume24h: 125000000,
        volume7d: 875000000,
        apy: 24.5,
        apyBreakdown: {
          base: 18.5,
          rewards: 4.0,
          fees: 2.0,
          total: 24.5,
        },
        swapFee: 0.05,
        isLoopable: false,
        hasRewards: true,
        protocol: {
          name: 'Uniswap V3',
          slug: 'uniswap-v3',
          category: 'AMM',
          riskScore: 9.5,
        },
        token0: {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          priceUSD: 2100,
        },
        token1: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          priceUSD: 1,
        },
      },
      {
        id: 'pool-2',
        poolAddress: '0x794a61358d6845594f94dc1db02a252b5b4814ad',
        poolName: 'Aave V3 WETH',
        chain: 'ARBITRUM',
        tvlUSD: 450000000,
        volume24h: 50000000,
        volume7d: 350000000,
        apy: 8.2,
        apyBreakdown: {
          base: 5.5,
          rewards: 2.7,
          fees: 0,
          total: 8.2,
        },
        swapFee: 0,
        isLoopable: true,
        hasRewards: true,
        protocol: {
          name: 'Aave V3',
          slug: 'aave-v3',
          category: 'Lending',
          riskScore: 9.8,
        },
        token0: {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
          priceUSD: 2100,
        },
        token1: null,
      },
      {
        id: 'pool-3',
        poolAddress: '0x24179CD81c9e782A4096035f7eC97fB8B783e007',
        poolName: 'BOLD Stability Pool',
        chain: 'ETHEREUM',
        tvlUSD: 180000000,
        volume24h: 20000000,
        volume7d: 140000000,
        apy: 21.0,
        apyBreakdown: {
          base: 15.0,
          rewards: 6.0,
          fees: 0,
          total: 21.0,
        },
        swapFee: 0,
        isLoopable: false,
        hasRewards: true,
        protocol: {
          name: 'Liquity V2',
          slug: 'liquity-v2',
          category: 'CDP',
          riskScore: 8.5,
        },
        token0: {
          symbol: 'BOLD',
          name: 'BOLD Stablecoin',
          address: '0x0000000000000000000000000000000000000000',
          priceUSD: 1,
        },
        token1: null,
      },
    ];
  }

  /**
   * Calculate portfolio statistics
   */
  async calculatePortfolioStats(userAddress: string): Promise<any> {
    const positions = await this.fetchUserPositions(userAddress);
    
    const totalValueUSD = positions.reduce((sum, p) => sum + p.totalValueUSD, 0);
    const totalFees24h = positions.reduce((sum, p) => sum + p.fees24h, 0);
    const totalFeesTotal = positions.reduce((sum, p) => sum + p.feesTotal, 0);
    
    // Calculate weighted APY
    const weightedAPY = positions.reduce((sum, p) => {
      const weight = p.totalValueUSD / totalValueUSD;
      return sum + (p.apy * weight);
    }, 0);
    
    // Calculate total IL
    const totalILUSD = positions.reduce((sum, p) => sum + p.impermanentLossUSD, 0);
    
    // Group by chain
    const byChain = positions.reduce((acc, p) => {
      if (!acc[p.chain]) {
        acc[p.chain] = {
          count: 0,
          valueUSD: 0,
        };
      }
      acc[p.chain].count++;
      acc[p.chain].valueUSD += p.totalValueUSD;
      return acc;
    }, {} as Record<string, any>);
    
    // Group by protocol
    const byProtocol = positions.reduce((acc, p) => {
      if (!acc[p.protocol]) {
        acc[p.protocol] = {
          count: 0,
          valueUSD: 0,
        };
      }
      acc[p.protocol].count++;
      acc[p.protocol].valueUSD += p.totalValueUSD;
      return acc;
    }, {} as Record<string, any>);
    
    return {
      userAddress,
      totalPositions: positions.length,
      totalValueUSD,
      weightedAPY,
      totalFees24h,
      totalFeesTotal,
      totalILUSD,
      byChain,
      byProtocol,
      positions,
    };
  }
}

// Export singleton instance
export const positionFetcher = new PositionFetcher();
export default positionFetcher;

// Add main for testing
if (require.main === module) {
  (async () => {
    const positions = await positionFetcher.fetchUserPositions('0x1234567890123456789012345678901234567890');
    console.log('Fetched Positions:', positions);
  })();
}