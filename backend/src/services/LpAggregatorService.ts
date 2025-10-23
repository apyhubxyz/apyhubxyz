// backend/src/services/lpAggregator.service.ts
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import Bull from 'bull';
import { ethers } from 'ethers';
import { getEnvioHyperIndex } from './EnvioHyperIndex';
import { DEFI_API_CONFIG } from '../config/defi-apis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const lpQueue = new Bull('lp-aggregation', process.env.REDIS_URL || 'redis://localhost:6379');
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'
);
const envio = getEnvioHyperIndex(provider, {
  apiKey: DEFI_API_CONFIG.envio.apiKey,
  indexerUrl: DEFI_API_CONFIG.envio.hyperIndexUrl,
  networkId: DEFI_API_CONFIG.envio.networkId,
  cacheEnabled: true,
  cacheTTL: DEFI_API_CONFIG.envio.cacheTTL,
}, redis);

type Risk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface LPPosition {
  poolAddress: string;
  poolName: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  apy?: number;
  apr?: number;
  tvlUsd?: number;
  volume24h?: number;
  fees24h?: number;
  ilRisk?: number;
  auditScore?: number;
  riskLevel?: Risk;
  chainId: number | string;
  dexName?: string;
  farmRewards?: any[];
  isStable: boolean;
  extra?: Record<string, any>;
};


/* ------------------------------- Aggregator ------------------------------- */

export class LPAggregatorService {
  constructor() {
    this.setupQueue();
  }

  private setupQueue() {
    lpQueue.process(async () => this.aggregateAllPositions());
    // every 10 minutes (adjust as needed)
    lpQueue.add({}, { repeat: { every: 10 * 60 * 1000 } });
  }

  private async fetchAll(): Promise<LPPosition[]> {
    // Envio-only data path
    const protocols = [
      'aave', 'compound', 'yearn', 'beefy', 'pendle',
      'silo', 'curve', 'uniswap-v3', 'morpho'
    ];
    const pools = await envio.getIndexedPools(protocols, { limit: 300 });
    return pools.map(p => ({
      poolAddress: p.poolAddress,
      poolName: `${p.protocol.toUpperCase()} ${p.tokenA}/${p.tokenB}`,
      token0Symbol: p.tokenA,
      token1Symbol: p.tokenB,
      token0Address: p.poolAddress,
      token1Address: p.poolAddress,
      apy: p.apy,
      tvlUsd: Number(p.tvlUsd),
      volume24h: Number(p.volume24h),
      fees24h: Number(p.fees24h),
      chainId: DEFI_API_CONFIG.envio.networkId,
      dexName: p.protocol,
      riskLevel: 'MEDIUM',
      isStable: /USD|USDC|USDT|DAI/i.test(`${p.tokenA}${p.tokenB}`),
      extra: { blockNumber: p.blockNumber, timestamp: p.timestamp, tx: p.transactionHash }
    } as LPPosition));
  }

  async aggregateAllPositions() {
    const cacheKey = 'lp:positions:all';
    // cache hit
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const positions = await this.fetchAll();

    // upsert protocols first
    const names = [...new Set(positions.map(p => p.dexName).filter(Boolean))] as string[];
    for (const name of names) {
  await (prisma as any).protocol.upsert({
        where: { name },
        update: { updatedAt: new Date() },
        create: { name, slug: name.toLowerCase().replace(/\s+/g, '-'), chainId: 1, active: true }
      });
    }

    // map name->id
    const protos = await prisma.protocol.findMany({ where: { name: { in: names } } });
    const protoMap = new Map(protos.map(p => [p.name, p.id]));

    // batch upserts
    await Promise.all(positions.map(p => {
      const protocolId = protoMap.get(p.dexName || '');
      if (!protocolId) return Promise.resolve();
      return prisma.lpPosition.upsert({
        where: { protocolId_poolAddress: { protocolId, poolAddress: p.poolAddress } },
        update: {
          apy: p.apy ?? 0,
          apr: p.apr ?? undefined,
          tvlUsd: p.tvlUsd ?? 0,
          volume24h: p.volume24h ?? undefined,
          fees24h: p.fees24h ?? undefined,
          ilRisk: p.ilRisk, auditScore: p.auditScore, riskLevel: p.riskLevel,
          farmRewards: p.farmRewards, isStable: p.isStable, lastFetched: new Date(),
        },
        create: {
          protocolId,
          poolAddress: p.poolAddress,
          poolName: p.poolName,
          token0Symbol: p.token0Symbol,
          token1Symbol: p.token1Symbol,
          token0Address: p.token0Address,
          token1Address: p.token1Address,
          apy: p.apy ?? 0,
          apr: p.apr ?? undefined,
          tvlUsd: p.tvlUsd ?? 0,
          volume24h: p.volume24h ?? undefined,
          fees24h: p.fees24h ?? undefined,
          ilRisk: p.ilRisk, auditScore: p.auditScore, riskLevel: p.riskLevel,
          chainId: Number(p.chainId) || 1,
          dexName: p.dexName || '',
          farmRewards: p.farmRewards,
          isStable: p.isStable
        }
      });
    }));

    // cache for 10 minutes
    await redis.set(cacheKey, JSON.stringify(positions), 'EX', 600);
    return positions;
  }

  async getTopPositions(limitN = 100) {
    return prisma.lpPosition.findMany({
      orderBy: [{ apy: 'desc' }, { tvlUsd: 'desc' }],
      take: limitN,
      include: { protocol: true }
    });
  }
}

export const lpAggregator = new LPAggregatorService();