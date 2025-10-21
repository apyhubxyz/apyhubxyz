// Protocol Adapter Interface and Base Implementation
import axios, { AxiosInstance } from 'axios';
import { request, gql } from 'graphql-request';
import { ethers } from 'ethers';
import pLimit from 'p-limit';
import Redis from 'ioredis';

export type ChainId = 'ethereum' | 'arbitrum' | 'optimism' | 'base' | 'polygon' | 'avalanche' | 'bsc' | 'fantom' | 'solana' | 'mantle';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type PoolType = 'lending' | 'liquidity' | 'staking' | 'vault' | 'leveraged' | 'stable' | 'derivative';

export interface PoolPosition {
  // Core identifiers
  protocolId: string;
  poolAddress: string;
  poolName: string;
  poolType: PoolType;
  chain: ChainId;
  
  // Asset information
  assets: string[];
  underlyingTokens: {
    symbol: string;
    address: string;
    decimals: number;
  }[];
  
  // Yield metrics
  apy: number;
  apr?: number;
  baseApy?: number;
  rewardApy?: number;
  netApy?: number; // After fees
  
  // TVL and volume
  tvlUsd: number;
  volume24h?: number;
  fees24h?: number;
  utilizationRate?: number;
  
  // Risk metrics
  riskLevel: RiskLevel;
  ilRisk?: number; // 0-100 impermanent loss risk
  liquidationRisk?: number; // 0-100
  protocolRisk?: number; // 0-100 based on audits, time live, TVL
  smartContractRisk?: number; // 0-100
  
  // Leverage/Loop info
  isLoopable?: boolean;
  maxLeverage?: number;
  collateralFactor?: number;
  liquidationThreshold?: number;
  
  // Rewards and incentives
  rewards?: {
    token: string;
    apy: number;
    price: number;
  }[];
  
  // Strategy specific
  strategyType?: 'delta-neutral' | 'basis-trade' | 'stable-stable' | 'volatile-pair' | 'single-sided' | 'derivative' | 'fixed-yield' | 'variable-yield';
  
  // Additional metadata
  extra?: Record<string, any>;
  lastUpdated: Date;
}

export interface ProtocolInfo {
  id: string;
  name: string;
  website: string;
  logo?: string;
  chains: ChainId[];
  tvlUsd: number;
  audited: boolean;
  auditReports?: string[];
  riskScore: number; // 0-100 (100 = safest)
  foundedDate?: Date;
  categories: PoolType[];
}

export abstract class ProtocolAdapter {
  protected axios: AxiosInstance;
  protected redis: Redis | null;
  protected rateLimiter: ReturnType<typeof pLimit>;
  protected provider: ethers.Provider;
  
  constructor(
    protected protocolInfo: ProtocolInfo,
    provider: ethers.Provider,
    redis?: Redis
  ) {
    this.axios = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'ApyHub/1.0',
      },
    });
    this.redis = redis || null;
    this.rateLimiter = pLimit(3); // 3 concurrent requests per protocol
    this.provider = provider;
  }
  
  // Abstract methods to be implemented by each protocol
  abstract fetchPools(): Promise<PoolPosition[]>;
  abstract fetchPoolDetails(poolAddress: string): Promise<PoolPosition | null>;
  
  // Common helper methods
  protected async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Cache read error for ${key}:`, error);
      return null;
    }
  }
  
  protected async setCachedData(key: string, data: any, ttl: number = 300): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      console.error(`Cache write error for ${key}:`, error);
    }
  }
  
  protected calculateRiskLevel(
    tvlUsd: number,
    auditScore: number,
    protocolAge: number,
    ilRisk: number = 0
  ): RiskLevel {
    // Risk scoring algorithm
    let score = 0;
    
    // TVL factor (higher TVL = lower risk)
    if (tvlUsd > 1e9) score += 30;
    else if (tvlUsd > 1e8) score += 20;
    else if (tvlUsd > 1e7) score += 10;
    else score += 5;
    
    // Audit factor
    score += auditScore * 0.3;
    
    // Protocol age (months)
    if (protocolAge > 24) score += 20;
    else if (protocolAge > 12) score += 15;
    else if (protocolAge > 6) score += 10;
    else score += 5;
    
    // IL risk factor
    score -= ilRisk * 0.2;
    
    // Determine risk level
    if (score >= 70) return 'LOW';
    if (score >= 50) return 'MEDIUM';
    if (score >= 30) return 'HIGH';
    return 'VERY_HIGH';
  }
  
  protected async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetchFn();
      } catch (error) {
        console.error(`Attempt ${i + 1} failed for ${this.protocolInfo.name}:`, error);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    return null;
  }
  
  // GraphQL helper
  protected async querySubgraph<T>(
    endpoint: string,
    query: string,
    variables?: Record<string, any>
  ): Promise<T | null> {
    try {
      const result = await request<T>(endpoint, query, variables);
      return result;
    } catch (error) {
      console.error(`GraphQL error for ${this.protocolInfo.name}:`, error);
      return null;
    }
  }
  
  // Calculate impermanent loss risk
  protected calculateILRisk(
    token0Volatility: number,
    token1Volatility: number,
    correlation: number,
    isStablePair: boolean
  ): number {
    if (isStablePair) return 5; // Low IL for stable pairs
    
    const avgVolatility = (token0Volatility + token1Volatility) / 2;
    const divergence = Math.abs(token0Volatility - token1Volatility);
    
    // Higher volatility and divergence = higher IL risk
    let risk = (avgVolatility * 50) + (divergence * 30) - (correlation * 20);
    
    return Math.max(0, Math.min(100, risk));
  }
}

// Export utility functions
export const normalizeChainId = (chain: string): ChainId => {
  const chainMap: Record<string, ChainId> = {
    '1': 'ethereum',
    'eth': 'ethereum',
    'ethereum': 'ethereum',
    'mainnet': 'ethereum',
    '42161': 'arbitrum',
    'arb': 'arbitrum',
    'arbitrum': 'arbitrum',
    '10': 'optimism',
    'op': 'optimism',
    'optimism': 'optimism',
    '8453': 'base',
    'base': 'base',
    '137': 'polygon',
    'polygon': 'polygon',
    'matic': 'polygon',
    '43114': 'avalanche',
    'avax': 'avalanche',
    '56': 'bsc',
    'bsc': 'bsc',
    'binance': 'bsc',
    '250': 'fantom',
    'ftm': 'fantom',
    'solana': 'solana',
    'sol': 'solana',
    '5000': 'mantle',
    'mantle': 'mantle',
  };
  
  const normalized = chain.toLowerCase();
  return chainMap[normalized] || 'ethereum';
};

export const calculateNetAPY = (
  grossAPY: number,
  protocolFee: number = 0,
  performanceFee: number = 0
): number => {
  const totalFees = protocolFee + performanceFee;
  return grossAPY * (1 - totalFees / 100);
};