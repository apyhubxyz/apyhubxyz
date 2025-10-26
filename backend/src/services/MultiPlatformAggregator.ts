// Multi-Platform Aggregator - Fetches from ALL DeFi platforms
import { PlatformPosition } from './platforms/BasePlatformAdapter';
import { PendleAdapter } from './platforms/PendleAdapter';
import { BeefyAdapter } from './platforms/BeefyAdapter';
import { YearnAdapter } from './platforms/YearnAdapter';
import { createSilentRedis } from '../utils/redis';

// Initialize Redis for caching
const redis = createSilentRedis();

export class MultiPlatformAggregator {
  private adapters = [
    new PendleAdapter(),
    new BeefyAdapter(),
    new YearnAdapter(),
    // Add more as needed: new AaveAdapter(), new CompoundAdapter(), etc.
  ];
  
  private memoryCache: Map<string, { data: PlatformPosition[]; expiry: number }> = new Map();
  private readonly CACHE_TTL = 1800; // 30 minutes (as per your requirement: 15-60min)
  
  /**
   * Fetch positions from ALL platforms and aggregate
   */
  async fetchAllPlatforms(): Promise<PlatformPosition[]> {
    const cacheKey = 'all-platforms-positions';
    
    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Returning ${cached.length} cached positions from all platforms`);
      return cached;
    }
    
    console.log('\n🔄 Fetching fresh data from ALL platforms...\n');
    
    // Fetch from all adapters in parallel
    const results = await Promise.allSettled(
      this.adapters.map(adapter => adapter.fetchPositions())
    );
    
    // Combine successful results
    const allPositions: PlatformPosition[] = results
      .filter((r): r is PromiseFulfilledResult<PlatformPosition[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);
    
    console.log(`\n✅ Aggregated ${allPositions.length} positions from ${this.adapters.length} platforms\n`);
    
    // Cache the results
    await this.saveToCache(cacheKey, allPositions);
    
    return allPositions;
  }
  
  /**
   * Rank positions by APY, TVL, and risk
   * Formula: Score = APY × (1 - riskScore/100) × log(TVL + 1)
   */
  rankPositions(
    positions: PlatformPosition[],
    filters?: {
      minAPY?: number;
      minTVL?: number;
      maxRisk?: number;
      chains?: string[];
      platforms?: string[];
    }
  ): PlatformPosition[] {
    let filtered = positions;
    
    // Apply filters
    if (filters) {
      if (filters.minAPY) filtered = filtered.filter(p => p.apy >= filters.minAPY!);
      if (filters.minTVL) filtered = filtered.filter(p => p.tvl >= filters.minTVL!);
      if (filters.maxRisk) filtered = filtered.filter(p => p.risk.score <= filters.maxRisk!);
      if (filters.chains) filtered = filtered.filter(p => filters.chains!.includes(p.chain));
      if (filters.platforms) filtered = filtered.filter(p => filters.platforms!.includes(p.platform));
    }
    
    // Rank by score
    return filtered
      .map(p => ({
        ...p,
        rankScore: this.calculateRankScore(p),
      }))
      .sort((a, b) => (b as any).rankScore - (a as any).rankScore);
  }
  
  /**
   * Calculate ranking score for a position
   */
  private calculateRankScore(position: PlatformPosition): number {
    const apyWeight = 0.5;
    const tvlWeight = 0.3;
    const riskWeight = 0.2;
    
    // Normalize values (0-1 range)
    const apyScore = Math.min(position.apy / 100, 1);  // Cap at 100% APY
    const tvlScore = Math.log10(position.tvl + 1) / 10;  // Log scale for TVL
    const riskScore = 1 - (position.risk.score / 100);  // Lower risk = higher score
    
    return (
      apyScore * apyWeight +
      tvlScore * tvlWeight +
      riskScore * riskWeight
    ) * 100;
  }
  
  /**
   * Get from cache (Redis or memory fallback)
   */
  private async getFromCache(key: string): Promise<PlatformPosition[] | null> {
    try {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch {
      // Fallback to memory cache
      const memoryCached = this.memoryCache.get(key);
      if (memoryCached && memoryCached.expiry > Date.now()) {
        return memoryCached.data;
      }
    }
    return null;
  }
  
  /**
   * Save to cache (Redis + memory backup)
   */
  private async saveToCache(key: string, data: PlatformPosition[]): Promise<void> {
    const stringData = JSON.stringify(data);
    
    try {
      await redis.setex(key, this.CACHE_TTL, stringData);
    } catch {
      // Fallback to memory cache
      this.memoryCache.set(key, {
        data,
        expiry: Date.now() + (this.CACHE_TTL * 1000),
      });
    }
  }
  
  /**
   * Get platform statistics
   */
  async getPlatformStats(): Promise<any> {
    const positions = await this.fetchAllPlatforms();
    
    const stats = {
      totalPlatforms: this.adapters.length,
      totalPositions: positions.length,
      totalTVL: positions.reduce((sum, p) => sum + p.tvl, 0),
      avgAPY: positions.reduce((sum, p) => sum + p.apy, 0) / positions.length,
      byPlatform: {} as Record<string, any>,
      topAPY: positions.sort((a, b) => b.apy - a.apy).slice(0, 5),
      topTVL: positions.sort((a, b) => b.tvl - a.tvl).slice(0, 5),
      lowestRisk: positions.sort((a, b) => a.risk.score - b.risk.score).slice(0, 5),
    };
    
    // Group by platform
    positions.forEach(p => {
      if (!stats.byPlatform[p.platform]) {
        stats.byPlatform[p.platform] = {
          count: 0,
          totalTVL: 0,
          avgAPY: 0,
        };
      }
      stats.byPlatform[p.platform].count++;
      stats.byPlatform[p.platform].totalTVL += p.tvl;
    });
    
    // Calculate averages
    Object.keys(stats.byPlatform).forEach(platform => {
      const platformPositions = positions.filter(p => p.platform === platform);
      stats.byPlatform[platform].avgAPY =
        platformPositions.reduce((sum, p) => sum + p.apy, 0) / platformPositions.length;
    });
    
    return stats;
  }
}

export const multiPlatformAggregator = new MultiPlatformAggregator();

