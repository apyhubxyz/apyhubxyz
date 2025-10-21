// Envio HyperIndex Integration - 2000x Faster Queries
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ethers } from 'ethers';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';

// Extend AxiosRequestConfig to include metadata
interface AxiosRequestConfigWithMetadata extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

export interface HyperIndexConfig {
  apiKey?: string;
  networkId: number;
  indexerUrl?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export interface IndexedPool {
  id: string;
  protocol: string;
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  tvlUsd: bigint;
  volume24h: bigint;
  fees24h: bigint;
  apy: number;
  blockNumber: number;
  timestamp: number;
  transactionHash: string;
}

export interface IndexedTransaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  input: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: bigint;
  gasPrice: bigint;
  status: boolean;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  where?: Record<string, any>;
  select?: string[];
  includeMetadata?: boolean;
}

export class EnvioHyperIndex extends EventEmitter {
  private axios: AxiosInstance;
  private redis?: Redis;
  private config: HyperIndexConfig;
  private provider: ethers.Provider;
  private queryCache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Performance metrics
  private metrics = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgQueryTime: 0,
    totalDataProcessed: 0,
  };
  
  constructor(
    provider: ethers.Provider,
    config: HyperIndexConfig,
    redis?: Redis
  ) {
    super();
    this.provider = provider;
    this.config = config;
    this.redis = redis;
    
    // Initialize Axios with Envio endpoint
    this.axios = axios.create({
      baseURL: config.indexerUrl || 'https://api.envio.dev/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey || '',
        'X-Network-ID': config.networkId.toString(),
      },
    });
    
    // Set up request/response interceptors for metrics
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        (config as AxiosRequestConfigWithMetadata).metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const startTime = (response.config as AxiosRequestConfigWithMetadata).metadata?.startTime || endTime;
        const queryTime = endTime - startTime;
        
        // Update metrics
        this.metrics.totalQueries++;
        this.metrics.avgQueryTime = 
          (this.metrics.avgQueryTime * (this.metrics.totalQueries - 1) + queryTime) / 
          this.metrics.totalQueries;
        
        // Emit performance event
        this.emit('query', {
          endpoint: response.config.url,
          queryTime,
          dataSize: JSON.stringify(response.data).length,
        });
        
        return response;
      },
      (error) => {
        this.emit('error', error);
        return Promise.reject(error);
      }
    );
  }
  
  // Core HyperIndex query method - 2000x faster than RPC
  async hyperQuery<T = any>(
    query: string,
    variables?: Record<string, any>,
    options?: QueryOptions
  ): Promise<T> {
    const cacheKey = `hyperindex:${query}:${JSON.stringify(variables)}`;
    
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = await this.getCached<T>(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return cached;
      }
      this.metrics.cacheMisses++;
    }
    
    try {
      // Execute HyperIndex query
      const response = await this.axios.post('/query', {
        query,
        variables,
        options: {
          ...options,
          // Enable HyperIndex optimizations
          useIndexer: true,
          enableParallelization: true,
          compressionEnabled: true,
        },
      });
      
      const data = response.data.data;
      
      // Cache result
      if (this.config.cacheEnabled) {
        await this.setCached(cacheKey, data, this.config.cacheTTL || 60);
      }
      
      this.metrics.totalDataProcessed += JSON.stringify(data).length;
      
      return data;
    } catch (error) {
      console.error('HyperIndex query error:', error);
      throw error;
    }
  }
  
  // Get all pools with HyperIndex optimization
  async getIndexedPools(
    protocolFilter?: string[],
    options?: QueryOptions
  ): Promise<IndexedPool[]> {
    const query = `
      query GetIndexedPools($protocols: [String!], $limit: Int, $offset: Int) {
        pools(
          where: { protocol_in: $protocols }
          first: $limit
          skip: $offset
          orderBy: tvlUsd
          orderDirection: desc
        ) {
          id
          protocol
          poolAddress
          tokenA
          tokenB
          tvlUsd
          volume24h
          fees24h
          apy
          blockNumber
          timestamp
          transactionHash
        }
      }
    `;
    
    const variables = {
      protocols: protocolFilter,
      limit: options?.limit || 100,
      offset: options?.offset || 0,
    };
    
    const result = await this.hyperQuery<{ pools: IndexedPool[] }>(
      query,
      variables,
      options
    );
    
    return result.pools;
  }
  
  // Get historical data with time-series optimization
  async getHistoricalData(
    poolAddress: string,
    startTime: number,
    endTime: number,
    interval: 'hour' | 'day' | 'week' = 'day'
  ): Promise<any[]> {
    const query = `
      query GetHistoricalData($poolAddress: String!, $startTime: Int!, $endTime: Int!, $interval: String!) {
        poolSnapshots(
          where: { 
            pool: $poolAddress,
            timestamp_gte: $startTime,
            timestamp_lte: $endTime
          }
          orderBy: timestamp
          interval: $interval
        ) {
          timestamp
          tvlUsd
          volume
          fees
          apy
          utilizationRate
          liquidityRate
          borrowRate
        }
      }
    `;
    
    const result = await this.hyperQuery<{ poolSnapshots: any[] }>(
      query,
      { poolAddress, startTime, endTime, interval }
    );
    
    return result.poolSnapshots;
  }
  
  // Real-time event streaming via HyperIndex
  async subscribeToPoolEvents(
    poolAddresses: string[],
    callback: (event: any) => void
  ): Promise<() => void> {
    const subscription = `
      subscription PoolEvents($pools: [String!]) {
        poolEvents(where: { pool_in: $pools }) {
          id
          pool
          event
          args
          blockNumber
          timestamp
          transactionHash
        }
      }
    `;
    
    // Create WebSocket connection for real-time updates
    const ws = new WebSocket(
      this.config.indexerUrl?.replace('https://', 'wss://') || 'wss://api.envio.dev/v1/ws'
    );
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'subscription',
        query: subscription,
        variables: { pools: poolAddresses },
      }));
    });
    
    ws.on('message', (data: Buffer) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'data') {
        callback(message.payload);
        this.emit('poolEvent', message.payload);
      }
    });
    
    // Return unsubscribe function
    return () => {
      ws.close();
    };
  }
  
  // Batch query multiple pools - optimized for speed
  async batchQueryPools(
    poolAddresses: string[]
  ): Promise<Map<string, IndexedPool>> {
    const query = `
      query BatchQueryPools($addresses: [String!]) {
        pools(where: { poolAddress_in: $addresses }) {
          id
          protocol
          poolAddress
          tokenA
          tokenB
          tvlUsd
          volume24h
          fees24h
          apy
          blockNumber
          timestamp
        }
      }
    `;
    
    const result = await this.hyperQuery<{ pools: IndexedPool[] }>(
      query,
      { addresses: poolAddresses }
    );
    
    const poolMap = new Map<string, IndexedPool>();
    for (const pool of result.pools) {
      poolMap.set(pool.poolAddress, pool);
    }
    
    return poolMap;
  }
  
  // Get cross-chain aggregated data
  async getCrossChainData(
    protocols: string[],
    chains: number[]
  ): Promise<any> {
    const promises = chains.map(chainId => {
      const indexer = new EnvioHyperIndex(
        this.provider,
        { ...this.config, networkId: chainId },
        this.redis
      );
      return indexer.getIndexedPools(protocols);
    });
    
    const results = await Promise.all(promises);
    
    // Aggregate results
    const aggregated = {
      totalPools: 0,
      totalTVL: BigInt(0),
      totalVolume24h: BigInt(0),
      poolsByChain: {} as Record<number, IndexedPool[]>,
    };
    
    chains.forEach((chainId, index) => {
      const pools = results[index];
      aggregated.poolsByChain[chainId] = pools;
      aggregated.totalPools += pools.length;
      
      for (const pool of pools) {
        aggregated.totalTVL += pool.tvlUsd;
        aggregated.totalVolume24h += pool.volume24h;
      }
    });
    
    return aggregated;
  }
  
  // Advanced analytics query
  async getAnalytics(
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<any> {
    const query = `
      query GetAnalytics($timeframe: String!) {
        analytics(timeframe: $timeframe) {
          totalValueLocked
          totalVolume
          totalFees
          uniqueUsers
          totalTransactions
          topPools {
            poolAddress
            tvlUsd
            apy
          }
          topProtocols {
            protocol
            tvlUsd
            poolCount
          }
          trends {
            timestamp
            tvl
            volume
            fees
          }
        }
      }
    `;
    
    return await this.hyperQuery(query, { timeframe });
  }
  
  // Cache helpers
  private async getCached<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memCached = this.queryCache.get(key);
    if (memCached && Date.now() - memCached.timestamp < 10000) {
      return memCached.data;
    }
    
    // Check Redis cache
    if (this.redis) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          // Update memory cache
          this.queryCache.set(key, { data, timestamp: Date.now() });
          return data;
        }
      } catch (error) {
        console.error('Cache read error:', error);
      }
    }
    
    return null;
  }
  
  private async setCached(key: string, data: any, ttl: number): Promise<void> {
    // Update memory cache
    this.queryCache.set(key, { data, timestamp: Date.now() });
    
    // Cleanup old entries if cache is too large
    if (this.queryCache.size > 1000) {
      const entries = Array.from(this.queryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 200 entries
      for (let i = 0; i < 200; i++) {
        this.queryCache.delete(entries[i][0]);
      }
    }
    
    // Update Redis cache
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
      } catch (error) {
        console.error('Cache write error:', error);
      }
    }
  }
  
  // Get performance metrics
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      avgQueryTimeMs: this.metrics.avgQueryTime,
      totalDataProcessedMB: this.metrics.totalDataProcessed / (1024 * 1024),
    };
  }
  
  // Clear all caches
  async clearCache(): Promise<void> {
    this.queryCache.clear();
    if (this.redis) {
      const keys = await this.redis.keys('hyperindex:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
}

// Export singleton factory
let instance: EnvioHyperIndex;

export function getEnvioHyperIndex(
  provider: ethers.Provider,
  config: HyperIndexConfig,
  redis?: Redis
): EnvioHyperIndex {
  if (!instance) {
    instance = new EnvioHyperIndex(provider, config, redis);
  }
  return instance;
}

export default EnvioHyperIndex;