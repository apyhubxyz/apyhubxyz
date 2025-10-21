// Aave Protocol Adapter - V3 Markets
import { ProtocolAdapter, PoolPosition, ChainId, normalizeChainId } from '../ProtocolAdapter';
import { gql } from 'graphql-request';
import { ethers } from 'ethers';
import Redis from 'ioredis';

const AAVE_V3_SUBGRAPH_URLS: Record<string, string> = {
  ethereum: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
  arbitrum: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-arbitrum',
  optimism: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-optimism',
  polygon: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-polygon',
  avalanche: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-avalanche',
  base: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-base',
};

const MARKETS_QUERY = gql`
  query GetMarkets {
    markets(first: 100, where: { isActive: true }) {
      id
      name
      isActive
      liquidityRate
      variableBorrowRate
      stableBorrowRate
      totalLiquidity
      totalATokenSupply
      totalCurrentVariableDebt
      utilizationRate
      liquidityIndex
      reserveFactor
      inputToken {
        id
        symbol
        name
        decimals
      }
      outputToken {
        id
        symbol
      }
      rates {
        rate
        type
      }
    }
  }
`;

export class AaveAdapter extends ProtocolAdapter {
  constructor(provider: ethers.Provider, redis?: Redis) {
    super(
      {
        id: 'aave',
        name: 'Aave',
        website: 'https://aave.com',
        chains: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base'],
        tvlUsd: 11500000000,
        audited: true,
        auditReports: ['https://github.com/aave/aave-v3-core/tree/master/audits'],
        riskScore: 92,
        categories: ['lending'],
      },
      provider,
      redis
    );
  }

  async fetchPools(): Promise<PoolPosition[]> {
    const cacheKey = 'aave:pools:all';
    const cached = await this.getCachedData<PoolPosition[]>(cacheKey);
    if (cached) return cached;

    const positions: PoolPosition[] = [];

    for (const [chain, subgraphUrl] of Object.entries(AAVE_V3_SUBGRAPH_URLS)) {
      const chainPools = await this.fetchChainPools(chain as ChainId, subgraphUrl);
      positions.push(...chainPools);
    }

    await this.setCachedData(cacheKey, positions, 300); // 5 min cache
    return positions;
  }

  private async fetchChainPools(chain: ChainId, subgraphUrl: string): Promise<PoolPosition[]> {
    const data = await this.querySubgraph<any>(subgraphUrl, MARKETS_QUERY);
    if (!data?.markets) return [];

    return data.markets.map((market: any) => {
      // Convert rates from Ray units (27 decimals) to percentage
      const liquidityAPY = this.rayToAPY(market.liquidityRate);
      const borrowAPY = this.rayToAPY(market.variableBorrowRate);
      
      return {
        protocolId: this.protocolInfo.id,
        poolAddress: market.id,
        poolName: `Aave ${market.inputToken.symbol} Market`,
        poolType: 'lending',
        chain,
        assets: [market.inputToken.symbol],
        underlyingTokens: [
          {
            symbol: market.inputToken.symbol,
            address: market.inputToken.id,
            decimals: market.inputToken.decimals,
          },
        ],
        apy: liquidityAPY,
        apr: liquidityAPY * 0.95, // Approximate APR
        baseApy: liquidityAPY,
        tvlUsd: parseFloat(market.totalLiquidity || '0'),
        utilizationRate: parseFloat(market.utilizationRate || '0') * 100,
        riskLevel: this.calculateRiskLevel(
          parseFloat(market.totalLiquidity || '0'),
          this.protocolInfo.riskScore,
          24, // Protocol age in months
          0 // No IL risk for lending
        ),
        isLoopable: true,
        maxLeverage: 4.5, // Typical for major assets on Aave
        collateralFactor: 0.8, // 80% LTV for major assets
        liquidationThreshold: 0.85,
        extra: {
          borrowAPY,
          totalDebt: parseFloat(market.totalCurrentVariableDebt || '0'),
          reserveFactor: parseFloat(market.reserveFactor || '0'),
        },
        lastUpdated: new Date(),
      } as PoolPosition;
    });
  }

  async fetchPoolDetails(poolAddress: string): Promise<PoolPosition | null> {
    // For detailed pool info, fetch from all chains
    const allPools = await this.fetchPools();
    return allPools.find(p => p.poolAddress === poolAddress) || null;
  }

  private rayToAPY(rayValue: string): number {
    // Convert from Ray (27 decimals) to percentage APY
    const ray = parseFloat(rayValue) / 1e27;
    // Convert to APY percentage
    return ray * 100;
  }
}