import { Router, Request, Response } from 'express';
import { getHyperSyncService } from '../services/EnvioHyperSyncService';
import { realPositionFetcher } from '../services/RealPositionFetcher';
import { multiPlatformAggregator } from '../services/MultiPlatformAggregator';
import { defiLlamaAggregator } from '../services/DefiLlamaAggregator';

const router = Router();

/**
 * @route GET /api/positions
 * @description Get ALL available LP opportunities for discovery (Pools page)
 * NOTE: For user's personal positions, use GET /api/dashboard/:address instead
 * @query {string} protocol - Filter by protocol name
 * @query {number} chainId - Filter by chain ID
 * @query {string} search - Search query
 * @query {string} sortBy - Sort field (apy, tvl)
 * @query {number} minAPY - Minimum APY filter
 * @query {number} minTVL - Minimum TVL filter
 * @query {number} limit - Results limit (default 50)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      protocol, 
      chainId, 
      search,
      sortBy = 'apy',
      sortOrder = 'desc',
      minAPY,
      minTVL,
      limit,
    } = req.query;

    // DISCOVERY MODE: Fetch ALL available LP opportunities from DefiLlama (1000+ protocols)
    console.log(`🌐 [POOLS PAGE] Fetching ALL DeFi opportunities...`);
    
    const chainMap: Record<string, string> = {
      '1': 'Ethereum',
      '10': 'Optimism',
      '137': 'Polygon',
      '42161': 'Arbitrum',
      '8453': 'Base',
    };
    
    const pools = await defiLlamaAggregator.getTopPools({
      minAPY: minAPY ? parseFloat(minAPY as string) : 5,
      minTVL: minTVL ? parseFloat(minTVL as string) : 1000000,
      chains: chainId ? [chainMap[chainId as string]] : ['Ethereum'],
      protocols: protocol ? [protocol as string] : undefined,
      limit: limit ? parseInt(limit as string) : 50,
    });
    
    // Convert DefiLlama format to our position format
    let positions = pools.map(p => ({
      id: p.pool,
      poolAddress: p.pool,
      poolName: `${p.project} - ${p.symbol}`,
      protocol: p.project,
      chain: p.chain.toLowerCase(),
      token0Symbol: p.symbol.split('-')[0] || p.symbol,
      token1Symbol: p.symbol.split('-')[1] || '',
      totalValueUSD: p.tvlUsd,
      apy: p.apy,
      apyBase: p.apyBase || 0,
      apyReward: p.apyReward || 0,
      fees24h: (p.tvlUsd * (p.apy / 100)) / 365,
      impermanentLoss: p.ilRisk === 'yes' ? 10 : 0,
      stablecoin: p.stablecoin,
      exposure: p.exposure,
      positionType: 'LP' as const,
      lastUpdated: new Date(),
    }));
    
    // Apply search filter
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      positions = positions.filter(p =>
        p.poolName.toLowerCase().includes(searchTerm) ||
        p.protocol.toLowerCase().includes(searchTerm) ||
        p.token0Symbol.toLowerCase().includes(searchTerm) ||
        p.token1Symbol.toLowerCase().includes(searchTerm)
      );
    }
    
    console.log(`✅ [POOLS PAGE] Found ${positions.length} opportunities`)

    // Sorting already done by DefiLlama (by APY desc)
    // But apply custom sort if requested
    if (sortBy === 'tvl') {
      positions.sort((a, b) => 
        sortOrder === 'asc' ? a.totalValueUSD - b.totalValueUSD : b.totalValueUSD - a.totalValueUSD
      );
    }

    res.json({
      success: true,
      data: positions,
      count: positions.length,
      message: 'All available LP opportunities for discovery'
    });
  } catch (error: any) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch positions'
    });
  }
});

/**
 * @route GET /api/positions/stats
 * @description Get position statistics
 * @query {string} userAddress - Optional user address for personalized stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.query;
  const stats = await getHyperSyncService().getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching position stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch position statistics'
    });
  }
});

/**
 * @route GET /api/positions/protocols
 * @description Get list of available protocols
 */
router.get('/protocols', async (req: Request, res: Response) => {
  try {
    const protocols = [
      { name: 'Aave', logo: '/logos/aave.svg', tvl: '5.2B', chains: [1, 10, 42161, 137] },
      { name: 'Uniswap V3', logo: '/logos/uniswap.svg', tvl: '3.8B', chains: [1, 10, 42161, 137] },
      { name: 'Compound', logo: '/logos/compound.svg', tvl: '2.1B', chains: [1, 137] },
      { name: 'Euler', logo: '/logos/euler.svg', tvl: '450M', chains: [1] },
      { name: 'Morpho', logo: '/logos/morpho.svg', tvl: '890M', chains: [1, 8453] },
      { name: 'Silo', logo: '/logos/silo.svg', tvl: '120M', chains: [1, 42161] },
      { name: 'Yearn', logo: '/logos/yearn.svg', tvl: '340M', chains: [1, 10] },
      { name: 'Curve', logo: '/logos/curve.svg', tvl: '4.5B', chains: [1, 10, 137] },
      { name: 'Balancer', logo: '/logos/balancer.svg', tvl: '1.2B', chains: [1, 137, 42161] },
      { name: 'Pendle', logo: '/logos/pendle.svg', tvl: '680M', chains: [1, 42161] },
    ];

    res.json({
      success: true,
      data: protocols
    });
  } catch (error: any) {
    console.error('Error fetching protocols:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch protocols'
    });
  }
});

/**
 * @route GET /api/positions/chains
 * @description Get list of supported chains
 */
router.get('/chains', async (req: Request, res: Response) => {
  try {
    const chains = [
      { id: 1, name: 'Ethereum', logo: '/logos/ethereum.svg' },
      { id: 10, name: 'Optimism', logo: '/logos/optimism.svg' },
      { id: 137, name: 'Polygon', logo: '/logos/polygon.svg' },
      { id: 8453, name: 'Base', logo: '/logos/base.svg' },
      { id: 42161, name: 'Arbitrum', logo: '/logos/arbitrum.svg' },
      { id: 56, name: 'BSC', logo: '/logos/bsc.svg' },
    ];

    res.json({
      success: true,
      data: chains
    });
  } catch (error: any) {
    console.error('Error fetching chains:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch chains'
    });
  }
});

/**
 * @route POST /api/positions/sync
 * @description Trigger position synchronization with database
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    // Since we don't have database yet, just refresh data
  const positions = await getHyperSyncService().queryPositions();
    
    res.json({
      success: true,
      message: 'Position synchronization completed',
      count: positions.length
    });
  } catch (error: any) {
    console.error('Error syncing positions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync positions'
    });
  }
});

/**
 * @route GET /api/positions/ws
 * @description WebSocket endpoint for real-time position updates
 */
router.get('/ws', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'WebSocket connections should be made to ws://[host]/positions',
    endpoint: 'ws://localhost:3001/positions'
  });
});

export default router;