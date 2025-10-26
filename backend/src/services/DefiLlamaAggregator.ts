// DefiLlama Aggregator - Fetch ALL DeFi yields from one free API
// No auth required, covers 1000+ protocols
import axios from 'axios';
import { createSilentRedis } from '../utils/redis';

const redis = createSilentRedis();

export interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  pool: string;  // Pool ID
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  utilization?: number;
  predictions?: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
}

export class DefiLlamaAggregator {
  private readonly API_BASE = 'https://yields.llama.fi';
  private readonly CACHE_TTL = 1800; // 30 minutes
  private memoryCache: Map<string, { data: any; expiry: number }> = new Map();
  
  /**
   * Fetch ALL pools from DefiLlama (1000+ protocols)
   */
  async fetchAllPools(): Promise<DefiLlamaPool[]> {
    const cacheKey = 'defillama-all-pools';
    
    // Check cache
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Returning ${cached.length} cached DeFiLlama pools`);
      return cached;
    }
    
    try {
      console.log('🌐 Fetching fresh data from DefiLlama (1000+ protocols)...');
      
      const response = await axios.get(`${this.API_BASE}/pools`, {
        timeout: 30000,
      });
      
      const pools: DefiLlamaPool[] = response.data.data || [];
      
      console.log(`✅ Fetched ${pools.length} pools from DefiLlama`);
      
      // Cache the results
      await this.saveToCache(cacheKey, pools);
      
      return pools;
    } catch (error: any) {
      console.error('DefiLlama fetch error:', error.message);
      return [];
    }
  }
  
  /**
   * Filter and rank pools by criteria
   */
  async getTopPools(filters: {
    minTVL?: number;
    minAPY?: number;
    chains?: string[];
    protocols?: string[];
    stablecoinOnly?: boolean;
    limit?: number;
  } = {}): Promise<DefiLlamaPool[]> {
    const allPools = await this.fetchAllPools();
    
    let filtered = allPools;
    
    // Apply filters
    if (filters.minTVL) {
      filtered = filtered.filter(p => p.tvlUsd >= filters.minTVL!);
    }
    
    if (filters.minAPY) {
      filtered = filtered.filter(p => p.apy >= filters.minAPY!);
    }
    
    if (filters.chains && filters.chains.length > 0) {
      filtered = filtered.filter(p => 
        filters.chains!.some(chain => 
          p.chain.toLowerCase() === chain.toLowerCase()
        )
      );
    }
    
    if (filters.protocols && filters.protocols.length > 0) {
      filtered = filtered.filter(p => 
        filters.protocols!.some(protocol => 
          p.project.toLowerCase().includes(protocol.toLowerCase())
        )
      );
    }
    
    if (filters.stablecoinOnly) {
      filtered = filtered.filter(p => p.stablecoin === true);
    }
    
    // Sort by APY descending
    filtered.sort((a, b) => b.apy - a.apy);
    
    // Limit results
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }
  
  /**
   * Get statistics across all pools
   */
  async getStats(): Promise<any> {
    const pools = await this.fetchAllPools();
    
    const stats = {
      totalPools: pools.length,
      totalTVL: pools.reduce((sum, p) => sum + (p.tvlUsd || 0), 0),
      avgAPY: pools.reduce((sum, p) => sum + (p.apy || 0), 0) / pools.length,
      medianAPY: this.calculateMedian(pools.map(p => p.apy)),
      topProtocols: this.getTopProtocols(pools),
      byChain: this.groupByChain(pools),
      highYield: pools.filter(p => p.apy > 20 && p.tvlUsd > 1000000).length,
      stablecoins: pools.filter(p => p.stablecoin).length,
    };
    
    return stats;
  }
  
  /**
   * Get top protocols by TVL
   */
  private getTopProtocols(pools: DefiLlamaPool[], limit: number = 10) {
    const byProtocol: Record<string, { tvl: number; pools: number; avgAPY: number }> = {};
    
    pools.forEach(p => {
      if (!byProtocol[p.project]) {
        byProtocol[p.project] = { tvl: 0, pools: 0, avgAPY: 0 };
      }
      byProtocol[p.project].tvl += p.tvlUsd;
      byProtocol[p.project].pools++;
      byProtocol[p.project].avgAPY += p.apy;
    });
    
    // Calculate averages
    Object.keys(byProtocol).forEach(protocol => {
      byProtocol[protocol].avgAPY /= byProtocol[protocol].pools;
    });
    
    // Sort by TVL and return top
    return Object.entries(byProtocol)
      .sort(([, a], [, b]) => b.tvl - a.tvl)
      .slice(0, limit)
      .map(([name, data]) => ({ name, ...data }));
  }
  
  /**
   * Group pools by chain
   */
  private groupByChain(pools: DefiLlamaPool[]) {
    const byChain: Record<string, { pools: number; tvl: number }> = {};
    
    pools.forEach(p => {
      if (!byChain[p.chain]) {
        byChain[p.chain] = { pools: 0, tvl: 0 };
      }
      byChain[p.chain].pools++;
      byChain[p.chain].tvl += p.tvlUsd;
    });
    
    return byChain;
  }
  
  /**
   * Calculate median
   */
  private calculateMedian(values: number[]): number {
    const sorted = values.filter(v => v > 0).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  /**
   * Cache helpers
   */
  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch {
      const memoryCached = this.memoryCache.get(key);
      if (memoryCached && memoryCached.expiry > Date.now()) {
        return memoryCached.data;
      }
    }
    return null;
  }
  
  private async saveToCache(key: string, data: any): Promise<void> {
    const stringData = JSON.stringify(data);
    
    try {
      await redis.setex(key, this.CACHE_TTL, stringData);
    } catch {
      this.memoryCache.set(key, {
        data,
        expiry: Date.now() + (this.CACHE_TTL * 1000),
      });
    }
  }
}

export const defiLlamaAggregator = new DefiLlamaAggregator();

