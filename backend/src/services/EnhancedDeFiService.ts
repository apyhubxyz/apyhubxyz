// Enhanced DeFi Service - Unified Protocol Aggregation
import { ethers } from 'ethers';
import { createSilentRedis } from '../utils/redis';
import type Redis from 'ioredis';
import Bull from 'bull';
import pLimit from 'p-limit';
import PrismaService from './PrismaService';

const prisma = PrismaService.getInstance();
import { ProtocolRegistry } from './protocols/ProtocolRegistry';
import { ProtocolAdapter, PoolPosition, ChainId, RiskLevel } from './protocols/ProtocolAdapter';

export interface AggregatedPosition extends PoolPosition {
  protocolName: string;
  protocolLogo?: string;
  protocolWebsite: string;
  rank?: number;
  score?: number;
}

export interface FilterOptions {
  chains?: ChainId[];
  protocols?: string[];
  minAPY?: number;
  maxAPY?: number;
  minTVL?: number;
  riskLevels?: RiskLevel[];
  poolTypes?: string[];
  isLoopable?: boolean;
  assets?: string[];
  sortBy?: 'apy' | 'tvl' | 'risk' | 'volume';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface YieldStrategy {
  id: string;
  name: string;
  description: string;
  expectedAPY: number;
  riskLevel: RiskLevel;
  requiredCapital: number;
  steps: StrategyStep[];
  gasEstimate: number;
  ilRisk: number;
  backtestResults?: BacktestResult;
}

export interface StrategyStep {
  action: 'bridge' | 'swap' | 'deposit' | 'borrow' | 'stake' | 'loop';
  protocol: string;
  chain: ChainId;
  inputToken: string;
  outputToken: string;
  amount?: string;
  leverage?: number;
  extra?: Record<string, any>;
}

export interface BacktestResult {
  period: string;
  actualAPY: number;
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  success: boolean;
}

export class EnhancedDeFiService {
  private registry: ProtocolRegistry;
  private redis: Redis;
  private updateQueue: Bull.Queue;
  private rateLimiter: ReturnType<typeof pLimit>;
  private adapters: Map<string, ProtocolAdapter> = new Map();
  
  constructor(
    private provider: ethers.Provider,
    redisUrl?: string
  ) {
    this.redis = createSilentRedis(redisUrl);
    this.registry = new ProtocolRegistry(provider, this.redis);

    const bullRedisUrl = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    this.updateQueue = new Bull('defi-updates', bullRedisUrl, {
      redis: {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        enableOfflineQueue: false,
      }
    });

    // Suppress Bull Redis errors
    this.updateQueue.on('error', () => {
      // Silently ignore queue errors when Redis is unavailable
    });

    this.rateLimiter = pLimit(5); // 5 concurrent protocol fetches

    this.initializeAdapters();
    this.setupUpdateQueue();
  }
  
  private initializeAdapters(): void {
    // Envio-only path: no protocol-specific adapters
    this.adapters.clear();
    console.log(`✅ Initialized 0 protocol adapters (Envio-only)`);
  }
  
  private setupUpdateQueue(): void {
    // Process updates every 5 minutes
    this.updateQueue.add('update-all', {}, {
      repeat: { every: 5 * 60 * 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    
    this.updateQueue.process('update-all', async (job) => {
      console.log('🔄 Starting protocol data update...');
      await this.updateAllProtocols();
      console.log('✅ Protocol data update complete');
    });
  }
  
  // Fetch all positions from all protocols
  async fetchAllPositions(filters?: FilterOptions): Promise<AggregatedPosition[]> {
    const cacheKey = `positions:${JSON.stringify(filters || {})}`;
    const cached = await this.getCached<AggregatedPosition[]>(cacheKey);
    if (cached) return cached;
    
    // Fetch from protocol adapters
    const adapterPromises = Array.from(this.adapters.entries()).map(([id, adapter]) =>
      this.rateLimiter(() => this.fetchProtocolPositions(id, adapter))
    );
    
    // Combine all positions
    const allPositions: AggregatedPosition[] = [];
    const adapterResults = await Promise.allSettled(adapterPromises);
    
    for (const result of adapterResults) {
      if (result.status === 'fulfilled' && result.value) {
        allPositions.push(...result.value);
      }
    }
    
    // Envio-only: skip legacy LP aggregator conversion
    
    // Apply filters and sorting
    let filtered = this.applyFilters(allPositions, filters);
    
    // Calculate scores and rank
    filtered = this.rankPositions(filtered);
    
    // Cache for 1 minute
    await this.setCached(cacheKey, filtered, 60);
    
    return filtered;
  }
  
  private async fetchProtocolPositions(
    protocolId: string,
    adapter: ProtocolAdapter
  ): Promise<AggregatedPosition[]> {
    try {
      const positions = await adapter.fetchPools();
      const protocolInfo = this.registry.getProtocolInfo(protocolId);
      
      if (!protocolInfo) return [];
      
      return positions.map(pos => ({
        ...pos,
        protocolName: protocolInfo.name,
        protocolLogo: protocolInfo.logo,
        protocolWebsite: protocolInfo.website,
      }));
    } catch (error) {
      console.error(`Error fetching ${protocolId} positions:`, error);
      return [];
    }
  }
  
  private applyFilters(
    positions: AggregatedPosition[],
    filters?: FilterOptions
  ): AggregatedPosition[] {
    if (!filters) return positions;
    
    let filtered = positions;
    
    if (filters.chains?.length) {
      filtered = filtered.filter(p => filters.chains!.includes(p.chain));
    }
    
    if (filters.protocols?.length) {
      filtered = filtered.filter(p => filters.protocols!.includes(p.protocolId));
    }
    
    if (filters.minAPY !== undefined) {
      filtered = filtered.filter(p => p.apy >= filters.minAPY!);
    }
    
    if (filters.maxAPY !== undefined) {
      filtered = filtered.filter(p => p.apy <= filters.maxAPY!);
    }
    
    if (filters.minTVL !== undefined) {
      filtered = filtered.filter(p => p.tvlUsd >= filters.minTVL!);
    }
    
    if (filters.riskLevels?.length) {
      filtered = filtered.filter(p => filters.riskLevels!.includes(p.riskLevel));
    }
    
    if (filters.poolTypes?.length) {
      filtered = filtered.filter(p => filters.poolTypes!.includes(p.poolType));
    }
    
    if (filters.isLoopable !== undefined) {
      filtered = filtered.filter(p => p.isLoopable === filters.isLoopable);
    }
    
    if (filters.assets?.length) {
      filtered = filtered.filter(p => 
        p.assets.some(asset => filters.assets!.includes(asset))
      );
    }
    
    // Sort
    const sortBy = filters.sortBy || 'apy';
    const sortOrder = filters.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      let aVal: number, bVal: number;
      
      switch (sortBy) {
        case 'apy':
          aVal = a.apy;
          bVal = b.apy;
          break;
        case 'tvl':
          aVal = a.tvlUsd;
          bVal = b.tvlUsd;
          break;
        case 'risk':
          const riskMap: Record<RiskLevel, number> = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'VERY_HIGH': 4 };
          aVal = riskMap[a.riskLevel];
          bVal = riskMap[b.riskLevel];
          break;
        case 'volume':
          aVal = a.volume24h || 0;
          bVal = b.volume24h || 0;
          break;
        default:
          aVal = a.apy;
          bVal = b.apy;
      }
      
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    // Apply pagination
    if (filters.limit) {
      const offset = filters.offset || 0;
      filtered = filtered.slice(offset, offset + filters.limit);
    }
    
    return filtered;
  }
  
  private rankPositions(positions: AggregatedPosition[]): AggregatedPosition[] {
    // Calculate score for each position
    // Score = APY * (1 - risk) * log(TVL) / volatility
    
    return positions.map((pos, index) => {
      const riskMultiplier = {
        'LOW': 0.9,
        'MEDIUM': 0.7,
        'HIGH': 0.5,
        'VERY_HIGH': 0.3,
      }[pos.riskLevel];
      
      const tvlScore = Math.log10(Math.max(pos.tvlUsd, 1000)) / 10;
      const apyScore = Math.min(pos.apy / 100, 2); // Cap at 200% APY
      
      const score = apyScore * riskMultiplier * tvlScore;
      
      return {
        ...pos,
        rank: index + 1,
        score,
      };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  
  // Generate yield strategies based on user portfolio
  async generateStrategies(
    userAddress: string,
    targetAPY?: number,
    riskTolerance: RiskLevel = 'MEDIUM'
  ): Promise<YieldStrategy[]> {
    const strategies: YieldStrategy[] = [];
    
    // Get top positions
    const positions = await this.fetchAllPositions({
      minAPY: targetAPY || 10,
      riskLevels: this.getRiskLevelsForTolerance(riskTolerance),
      limit: 20,
    });
    
    // Strategy 1: Simple high-yield deposit
    if (positions.length > 0) {
      const topPosition = positions[0];
      strategies.push({
        id: 'simple-deposit',
        name: `High Yield ${topPosition.assets[0]} Deposit`,
        description: `Deposit ${topPosition.assets[0]} into ${topPosition.protocolName} for ${topPosition.apy.toFixed(2)}% APY`,
        expectedAPY: topPosition.apy,
        riskLevel: topPosition.riskLevel,
        requiredCapital: 1000,
        steps: [
          {
            action: 'deposit',
            protocol: topPosition.protocolId,
            chain: topPosition.chain,
            inputToken: topPosition.assets[0],
            outputToken: `${topPosition.protocolId}-receipt`,
          },
        ],
        gasEstimate: 0.01,
        ilRisk: topPosition.ilRisk || 0,
      });
    }
    
    // Strategy 2: Leveraged looping
    const loopablePositions = positions.filter(p => p.isLoopable);
    if (loopablePositions.length > 0) {
      const loopPosition = loopablePositions[0];
      const leveragedAPY = loopPosition.apy * (loopPosition.maxLeverage || 2);
      
      strategies.push({
        id: 'leveraged-loop',
        name: `Leveraged ${loopPosition.assets[0]} Loop`,
        description: `Loop ${loopPosition.assets[0]} in ${loopPosition.protocolName} with ${loopPosition.maxLeverage}x leverage`,
        expectedAPY: leveragedAPY,
        riskLevel: 'HIGH' as RiskLevel,
        requiredCapital: 5000,
        steps: [
          {
            action: 'deposit',
            protocol: loopPosition.protocolId,
            chain: loopPosition.chain,
            inputToken: loopPosition.assets[0],
            outputToken: `a${loopPosition.assets[0]}`,
          },
          {
            action: 'borrow',
            protocol: loopPosition.protocolId,
            chain: loopPosition.chain,
            inputToken: `a${loopPosition.assets[0]}`,
            outputToken: loopPosition.assets[0],
            leverage: loopPosition.maxLeverage,
          },
          {
            action: 'loop',
            protocol: loopPosition.protocolId,
            chain: loopPosition.chain,
            inputToken: loopPosition.assets[0],
            outputToken: `a${loopPosition.assets[0]}`,
            leverage: loopPosition.maxLeverage,
          },
        ],
        gasEstimate: 0.05,
        ilRisk: 0,
      });
    }
    
    // Strategy 3: Delta-neutral basis trade
    const stablePositions = positions.filter(p => 
      p.poolType === 'stable' || p.strategyType === 'stable-stable'
    );
    
    if (stablePositions.length >= 2) {
      strategies.push({
        id: 'delta-neutral',
        name: 'Delta Neutral Stable Farming',
        description: 'Earn yield on stables while maintaining USD exposure',
        expectedAPY: stablePositions[0].apy * 0.8,
        riskLevel: 'LOW' as RiskLevel,
        requiredCapital: 10000,
        steps: [
          {
            action: 'deposit',
            protocol: stablePositions[0].protocolId,
            chain: stablePositions[0].chain,
            inputToken: 'USDC',
            outputToken: 'aUSDC',
          },
          {
            action: 'borrow',
            protocol: stablePositions[0].protocolId,
            chain: stablePositions[0].chain,
            inputToken: 'aUSDC',
            outputToken: 'USDT',
          },
          {
            action: 'deposit',
            protocol: stablePositions[1].protocolId,
            chain: stablePositions[1].chain,
            inputToken: 'USDT',
            outputToken: 'cUSDT',
          },
        ],
        gasEstimate: 0.03,
        ilRisk: 5,
      });
    }
    
    return strategies;
  }
  
  private getRiskLevelsForTolerance(tolerance: RiskLevel): RiskLevel[] {
    const levels: Record<RiskLevel, RiskLevel[]> = {
      'LOW': ['LOW'],
      'MEDIUM': ['LOW', 'MEDIUM'],
      'HIGH': ['LOW', 'MEDIUM', 'HIGH'],
      'VERY_HIGH': ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
    };
    
    return levels[tolerance];
  }
  
  // Update all protocol data
  async updateAllProtocols(): Promise<void> {
    const positions = await this.fetchAllPositions();
    
    // Save to database
    for (const pos of positions) {
      await this.savePosition(pos);
    }
    
    console.log(`📊 Updated ${positions.length} positions across all protocols`);
  }
  
  private async savePosition(position: AggregatedPosition): Promise<void> {
    try {
      // Get or create protocol
  await (prisma as any).protocol.upsert({
        where: { slug: position.protocolId },
        update: {
          name: position.protocolName,
          updatedAt: new Date(),
        },
        create: {
          name: position.protocolName,
          slug: position.protocolId,
          chainId: 1, // Default to Ethereum
          active: true,
        },
      });
      
      // Save position (simplified - you may want to expand this)
      // This would integrate with your existing database schema
    } catch (error) {
      console.error(`Error saving position ${position.poolAddress}:`, error);
    }
  }
  
  // Cache helpers
  private async getCached<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  
  private async setCached(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch {
      // Ignore cache errors
    }
  }
  
  // Get protocol statistics
  getStatistics() {
    return this.registry.getStatistics();
  }
}

// Export singleton instance
let instance: EnhancedDeFiService;

export function getEnhancedDeFiService(provider: ethers.Provider): EnhancedDeFiService {
  if (!instance) {
    instance = new EnhancedDeFiService(provider);
  }
  return instance;
}