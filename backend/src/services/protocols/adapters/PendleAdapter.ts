// Pendle Finance Adapter - PT/YT Markets
import { ProtocolAdapter, PoolPosition, ChainId } from '../ProtocolAdapter';
import { ethers } from 'ethers';
import Redis from 'ioredis';

interface PendleMarket {
  address: string;
  chainId: number;
  pt: {
    symbol: string;
    address: string;
    price: number;
  };
  yt: {
    symbol: string;
    address: string;
    price: number;
    impliedAPY: number;
  };
  underlying: {
    symbol: string;
    address: string;
  };
  maturity: number;
  liquidity: {
    usd: number;
    underlying: number;
  };
  volume24h: number;
  fees24h: number;
  tradingAPY: number;
  underlyingAPY: number;
  impliedAPY: number;
  longYieldAPY: number;
  fixedAPY: number;
}

export class PendleAdapter extends ProtocolAdapter {
  private readonly PENDLE_API_BASE = 'https://api-v2.pendle.finance/core/v1';
  
  constructor(provider: ethers.Provider, redis?: Redis) {
    super(
      {
        id: 'pendle',
        name: 'Pendle Finance',
        website: 'https://pendle.finance',
        chains: ['ethereum', 'arbitrum'],
        tvlUsd: 2500000000,
        audited: true,
        auditReports: ['https://github.com/pendle-finance/pendle-core-v2/tree/main/audits'],
        riskScore: 83,
        categories: ['derivative', 'vault'],
      },
      provider,
      redis
    );
  }

  async fetchPools(): Promise<PoolPosition[]> {
    const cacheKey = 'pendle:pools:all';
    const cached = await this.getCachedData<PoolPosition[]>(cacheKey);
    if (cached) return cached;

    const positions: PoolPosition[] = [];

    // Fetch markets from Pendle API
    const markets = await this.fetchMarkets();
    
    for (const market of markets) {
      positions.push(this.marketToPosition(market));
      
      // Add separate PT and YT positions
      positions.push(this.createPTPosition(market));
      positions.push(this.createYTPosition(market));
    }

    await this.setCachedData(cacheKey, positions, 300);
    return positions;
  }

  private async fetchMarkets(): Promise<PendleMarket[]> {
    try {
      const [ethMarkets, arbMarkets] = await Promise.all([
        this.fetchChainMarkets('1'),
        this.fetchChainMarkets('42161'),
      ]);
      
      return [...ethMarkets, ...arbMarkets];
    } catch (error) {
      console.error('Failed to fetch Pendle markets:', error);
      return [];
    }
  }

  private async fetchChainMarkets(chainId: string): Promise<PendleMarket[]> {
    const { data } = await this.axios.get(`${this.PENDLE_API_BASE}/${chainId}/markets`);
    return data?.results || [];
  }

  private marketToPosition(market: PendleMarket): PoolPosition {
    const chain = market.chainId === 1 ? 'ethereum' : 'arbitrum';
    const maturityDate = new Date(market.maturity * 1000);
    const isExpired = maturityDate < new Date();
    
    return {
      protocolId: this.protocolInfo.id,
      poolAddress: market.address,
      poolName: `Pendle ${market.underlying.symbol} Pool (${maturityDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`,
      poolType: 'derivative',
      chain: chain as ChainId,
      assets: [market.underlying.symbol],
      underlyingTokens: [
        {
          symbol: market.underlying.symbol,
          address: market.underlying.address,
          decimals: 18,
        },
      ],
      apy: market.impliedAPY + market.tradingAPY,
      apr: market.impliedAPY,
      baseApy: market.underlyingAPY,
      rewardApy: market.tradingAPY,
      netApy: (market.impliedAPY + market.tradingAPY) * 0.97, // 3% fees
      tvlUsd: market.liquidity.usd,
      volume24h: market.volume24h,
      fees24h: market.fees24h,
      riskLevel: this.calculateRiskLevel(
        market.liquidity.usd,
        this.protocolInfo.riskScore,
        18,
        20 // Moderate IL risk for derivative markets
      ),
      strategyType: 'derivative',
      extra: {
        maturity: market.maturity,
        isExpired,
        ptAddress: market.pt.address,
        ytAddress: market.yt.address,
        fixedAPY: market.fixedAPY,
        longYieldAPY: market.longYieldAPY,
      },
      lastUpdated: new Date(),
    };
  }

  private createPTPosition(market: PendleMarket): PoolPosition {
    const chain = market.chainId === 1 ? 'ethereum' : 'arbitrum';
    const maturityDate = new Date(market.maturity * 1000);
    
    return {
      protocolId: this.protocolInfo.id,
      poolAddress: market.pt.address,
      poolName: `PT-${market.underlying.symbol} (Fixed ${market.fixedAPY.toFixed(2)}%)`,
      poolType: 'derivative',
      chain: chain as ChainId,
      assets: [`PT-${market.underlying.symbol}`],
      underlyingTokens: [
        {
          symbol: market.pt.symbol,
          address: market.pt.address,
          decimals: 18,
        },
      ],
      apy: market.fixedAPY,
      apr: market.fixedAPY,
      baseApy: market.fixedAPY,
      tvlUsd: market.liquidity.usd * 0.5, // Approximate PT share
      riskLevel: 'LOW', // Fixed yield = lower risk
      strategyType: 'derivative',
      extra: {
        maturity: market.maturity,
        maturityDate: maturityDate.toISOString(),
        isFixed: true,
        price: market.pt.price,
        marketAddress: market.address,
      },
      lastUpdated: new Date(),
    };
  }

  private createYTPosition(market: PendleMarket): PoolPosition {
    const chain = market.chainId === 1 ? 'ethereum' : 'arbitrum';
    const maturityDate = new Date(market.maturity * 1000);
    
    return {
      protocolId: this.protocolInfo.id,
      poolAddress: market.yt.address,
      poolName: `YT-${market.underlying.symbol} (Variable ${market.longYieldAPY.toFixed(2)}%)`,
      poolType: 'derivative',
      chain: chain as ChainId,
      assets: [`YT-${market.underlying.symbol}`],
      underlyingTokens: [
        {
          symbol: market.yt.symbol,
          address: market.yt.address,
          decimals: 18,
        },
      ],
      apy: market.longYieldAPY,
      apr: market.yt.impliedAPY,
      baseApy: market.underlyingAPY,
      rewardApy: market.longYieldAPY - market.underlyingAPY,
      tvlUsd: market.liquidity.usd * 0.5, // Approximate YT share
      riskLevel: 'MEDIUM', // Variable yield = higher risk
      strategyType: 'derivative',
      extra: {
        maturity: market.maturity,
        maturityDate: maturityDate.toISOString(),
        isVariable: true,
        price: market.yt.price,
        impliedAPY: market.yt.impliedAPY,
        marketAddress: market.address,
      },
      lastUpdated: new Date(),
    };
  }

  async fetchPoolDetails(poolAddress: string): Promise<PoolPosition | null> {
    const allPools = await this.fetchPools();
    return allPools.find(p => p.poolAddress === poolAddress) || null;
  }
}