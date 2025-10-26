import { Router } from 'express';
import { ethers } from 'ethers';
import { getEnvioHyperIndex } from '../services/EnvioHyperIndex';
import { DEFI_API_CONFIG } from '../config/defi-apis';
import Redis from 'ioredis';

export function envioRoutes() {
  const router = Router();

  if (!process.env.RPC_URL && !process.env.ALCHEMY_RPC_URL) {
    throw new Error('RPC_URL or ALCHEMY_RPC_URL environment variable is required');
  }
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || process.env.ALCHEMY_RPC_URL
  );
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const envio = getEnvioHyperIndex(provider, {
    apiKey: DEFI_API_CONFIG.envio.apiKey,
    indexerUrl: DEFI_API_CONFIG.envio.hyperIndexUrl,
    networkId: DEFI_API_CONFIG.envio.networkId,
    cacheEnabled: true,
    cacheTTL: DEFI_API_CONFIG.envio.cacheTTL,
  }, redis);

  // Default protocol set covering common platforms supported by Envio index
  const DEFAULT_PROTOCOLS = [
    'aave','compound','curve','balancer','uniswap-v3','sushiswap','yearn','beefy',
    'pendle','silo','morpho','radiant','stargate','aerodrome','rocketpool','lido'
  ];

  // GET /api/envio/pools?protocols=aave,compound&limit=100
  router.get('/pools', async (req, res) => {
    try {
      const protoParam = (req.query.protocols as string | undefined)?.split(',').map(s => s.trim()).filter(Boolean);
      const protocols = (protoParam && protoParam.length > 0) ? protoParam : DEFAULT_PROTOCOLS;
      const limit = parseInt((req.query.limit as string) || '100');
      const offset = parseInt((req.query.offset as string) || '0');
      const pools = await envio.getIndexedPools(protocols, { limit, offset });
      res.json({ success: true, count: pools.length, data: pools });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Envio pools error' });
    }
  });

  // GET /api/envio/positions?protocols=aave,pendle&limit=100
  // Maps HyperIndex pools to a normalized LP position shape for the app
  router.get('/positions', async (req, res) => {
    try {
      const protoParam = (req.query.protocols as string | undefined)?.split(',').map(s => s.trim()).filter(Boolean);
      const protocols = (protoParam && protoParam.length > 0) ? protoParam : DEFAULT_PROTOCOLS;
      const limit = parseInt((req.query.limit as string) || '100');
      const offset = parseInt((req.query.offset as string) || '0');
      const pools = await envio.getIndexedPools(protocols, { limit, offset });

      const positions = pools.map(p => ({
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
      }));

      res.json({ success: true, count: positions.length, data: positions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Envio positions error' });
    }
  });

  // GET /api/envio/analytics?timeframe=week
  router.get('/analytics', async (req, res) => {
    try {
      const timeframe = (req.query.timeframe as 'day'|'week'|'month') || 'week';
      const data = await envio.getAnalytics(timeframe);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Envio analytics error' });
    }
  });

  return router;
}

export default envioRoutes;
