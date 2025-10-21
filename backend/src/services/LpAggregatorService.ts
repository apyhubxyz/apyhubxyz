// backend/src/services/lpAggregator.service.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import pLimit from 'p-limit';
import { request, gql } from 'graphql-request';
import Redis from 'ioredis';
import Bull from 'bull';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const lpQueue = new Bull('lp-aggregation', process.env.REDIS_URL || 'redis://localhost:6379');

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
}

const ax = axios.create({ timeout: 12_000 });
const limit = pLimit(4);

const safeNum = (x: any) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
};

const withFallback = async <T>(fn: () => Promise<T>, tag: string): Promise<T | null> => {
  try { return await fn(); } catch (e: any) { console.warn(`[skip:${tag}] ${e.message ?? e}`); return null; }
};

/* ------------------------- Public REST / GraphQL ------------------------- */

// Aave v2 (REST)
async function fetchAave(): Promise<LPPosition[]> {
  const url = 'https://aave-api-v2.aave.com/data/pools';
  const { data } = await ax.get(url);
  const arr = Array.isArray(data) ? data : [];
  return arr.map((p: any) => ({
    poolAddress: p.address,
    poolName: p.name || p.symbol,
    token0Symbol: p.symbol || p.name,
    token1Symbol: `a${p.symbol || 'TOKEN'}`,
    token0Address: p.address,
    token1Address: p.address,
    apy: safeNum(p.apy),
    tvlUsd: safeNum(p.liquidity?.usd ?? p.tvlUsd),
    chainId: p.network || p.chainId || 1,
    dexName: 'Aave',
    riskLevel: 'LOW',
    isStable: ['USDC','USDT','DAI'].includes((p.symbol || '').toUpperCase()),
    extra: { updatedAt: p.updatedAt }
  }));
}

// Compound v2 (REST)
async function fetchCompound(): Promise<LPPosition[]> {
  const url = 'https://api.compound.finance/api/v2/ctoken';
  const { data } = await ax.get(url);
  const tokens = data?.cToken ?? [];
  return tokens.map((t: any) => {
    const apyPct = t?.supply_rate?.value ? Number(t.supply_rate.value) * 100 : undefined;
    return {
      poolAddress: t.token_addr || t.underlying_address || t.symbol,
      poolName: `${t.underlying_symbol || t.symbol} Market`,
      token0Symbol: t.underlying_symbol || t.symbol,
      token1Symbol: `c${t.underlying_symbol || t.symbol}`,
      token0Address: t.underlying_address || '0x',
      token1Address: t.address || '0x',
      apy: safeNum(apyPct),
      tvlUsd: safeNum(t?.total_supply?.value),
      chainId: 1,
      dexName: 'Compound',
      riskLevel: 'LOW',
      isStable: ['USDC','USDT','DAI','TUSD'].includes((t.underlying_symbol || '').toUpperCase())
    } as LPPosition;
  });
}

// Yearn (ydaemon)
async function fetchYearn(): Promise<LPPosition[]> {
  const url = 'https://ydaemon.yearn.fi/v1/chains/1/vaults/all';
  const { data } = await ax.get(url);
  return (Array.isArray(data) ? data : [])
    .filter((v: any) => v.apy && v.apy.net_apy != null)
    .map((v: any) => ({
      poolAddress: v.address,
      poolName: v.name,
      token0Symbol: v.token?.display_name || v.token?.symbol || 'TOKEN',
      token1Symbol: `yv${v.token?.symbol || 'TOKEN'}`,
      token0Address: v.token?.address || '0x',
      token1Address: v.address,
      apy: safeNum(Number(v.apy.net_apy) * 100),
      tvlUsd: safeNum(v.tvl?.tvl),
      chainId: String(v.chainId ?? '1'),
      dexName: 'Yearn',
      riskLevel: 'LOW',
      isStable: /USD|USDC|USDT|DAI/i.test(v.token?.symbol || '')
    }));
}

// Beefy
async function fetchBeefy(): Promise<LPPosition[]> {
  const [vaults, apys, tvl] = await Promise.all([
    ax.get('https://api.beefy.finance/vaults'),
    ax.get('https://api.beefy.finance/apy'),
    ax.get('https://api.beefy.finance/tvl'),
  ]);
  const apyMap = apys.data || {};
  const tvlMap = tvl.data || {};
  return (vaults.data || [])
    .filter((v: any) => apyMap[v.id] != null)
    .map((v: any) => ({
      poolAddress: v.earnContractAddress,
      poolName: v.name,
      token0Symbol: v.token,
      token1Symbol: `moo${v.token}`,
      token0Address: v.tokenAddress,
      token1Address: v.earnContractAddress,
      apy: safeNum(Number(apyMap[v.id]) * 100),
      tvlUsd: safeNum(tvlMap[v.id]),
      chainId: v.chainId ?? v.chain ?? 'multi',
      dexName: 'Beefy',
      riskLevel: 'MEDIUM',
      isStable: (v.assets || []).some((s: string) => /USD/i.test(s))
    }));
}

// Pendle (GraphQL)
async function fetchPendle(): Promise<LPPosition[]> {
  const endpoint = 'https://api-v2.pendle.finance/core/graphql';
  const q = gql`{ markets(first: 100) { id chain name tvlUsd apy pt { symbol address } yt { symbol address } } }`;
  const res: any = await request(endpoint, q);
  return (res?.markets ?? []).map((m: any) => ({
    poolAddress: m.id,
    poolName: m.name || m.id,
    token0Symbol: m.pt?.symbol || 'PT',
    token1Symbol: m.yt?.symbol || 'YT',
    token0Address: m.pt?.address || '0x',
    token1Address: m.yt?.address || '0x',
    apy: safeNum(m.apy),
    tvlUsd: safeNum(m.tvlUsd),
    chainId: m.chain || 'evm',
    dexName: 'Pendle',
    riskLevel: 'MEDIUM',
    isStable: false
  }));
}

// Generic subgraph helper (for EtherFi / Renzo / Origin / Gearbox / Silo / Dolomite / Mantle)
const POOLS_Q = gql`
  { pools(first: 50, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id name symbol totalValueLockedUSD apy
    }
  }
`;

const SG = {
  etherfi: 'https://api.thegraph.com/subgraphs/name/etherfi/etherfi',
  renzo:   'https://api.thegraph.com/subgraphs/name/renzo-network/mainnet',
  origin:  'https://api.thegraph.com/subgraphs/name/originprotocol/oeth',
  gearbox: 'https://api.thegraph.com/subgraphs/name/gearbox-protocol/gearbox-protocol',
  silo:    'https://api.silo.finance/subgraphs/name/silo-finance/silo',
  dolomite:'https://api.thegraph.com/subgraphs/name/dolomite-exchange/dolomite',
  mantle:  'https://api.thegraph.com/subgraphs/name/mantlenetwork/mantle-lst'
};

async function fetchFromSubgraph(name: keyof typeof SG, label: string, chainId: string | number): Promise<LPPosition[]> {
  const r: any = await request(SG[name], POOLS_Q);
  return (r?.pools ?? []).map((p: any) => ({
    poolAddress: p.id,
    poolName: p.name || p.symbol || p.id,
    token0Symbol: p.symbol || 'LP',
    token1Symbol: 'LP',
    token0Address: p.id,
    token1Address: p.id,
    apy: safeNum(p.apy),
    tvlUsd: safeNum(p.totalValueLockedUSD),
    chainId,
    dexName: label,
    riskLevel: 'MEDIUM',
    isStable: /USD|USDC|USDT|DAI/i.test(p.symbol || '')
  }));
}

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
    const tasks = [
      () => withFallback(fetchAave, 'aave'),
      () => withFallback(fetchCompound, 'compound'),
      () => withFallback(fetchYearn, 'yearn'),
      () => withFallback(fetchBeefy, 'beefy'),
      () => withFallback(fetchPendle, 'pendle'),
      () => withFallback(() => fetchFromSubgraph('etherfi', 'EtherFi', 1), 'etherfi'),
      () => withFallback(() => fetchFromSubgraph('renzo', 'Renzo', 1), 'renzo'),
      () => withFallback(() => fetchFromSubgraph('origin', 'Origin (OETH)', 1), 'origin'),
      () => withFallback(() => fetchFromSubgraph('gearbox', 'Gearbox', 1), 'gearbox'),
      () => withFallback(() => fetchFromSubgraph('silo', 'Silo', 1), 'silo'),
      () => withFallback(() => fetchFromSubgraph('dolomite', 'Dolomite', 42161), 'dolomite'),
      () => withFallback(() => fetchFromSubgraph('mantle', 'Mantle LST', 'mantle'), 'mantle'),
    ];
    const settled = await Promise.all(tasks.map(t => limit(t)));
    return settled.flat().filter(Boolean) as LPPosition[];
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
      await prisma.protocol.upsert({
        where: { name },
        update: { updatedAt: new Date() },
        create: { name, slug: name.toLowerCase().replace(/\s+/g, '-'), chainId: 1, isActive: true }
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
          apy: p.apy, apr: p.apr, tvlUsd: p.tvlUsd, volume24h: p.volume24h, fees24h: p.fees24h,
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
          apy: p.apy, apr: p.apr, tvlUsd: p.tvlUsd, volume24h: p.volume24h, fees24h: p.fees24h,
          ilRisk: p.ilRisk, auditScore: p.auditScore, riskLevel: p.riskLevel,
          chainId: String(p.chainId),
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