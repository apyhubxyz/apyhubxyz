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
    
    // Convert DefiLlama format to Pool-compatible format for frontend
    // Add hardcoded website mappings for major protocols
    const protocolWebsites: Record<string, string> = {
      'uniswap-v3': 'https://app.uniswap.org',
      'uniswap-v2': 'https://app.uniswap.org',
      'sushiswap': 'https://app.sushi.com',
      'pancakeswap': 'https://pancakeswap.finance',
      'curve-dex': 'https://curve.fi',
      'convex-finance': 'https://www.convexfinance.com',
      'yearn-finance': 'https://yearn.fi',
      'compound': 'https://app.compound.finance',
      'aave': 'https://app.aave.com',
      'makerdao': 'https://oasis.app',
      'lido': 'https://stake.lido.fi',
      'rocket-pool': 'https://rocketpool.net',
      'fraxlend': 'https://app.frax.finance',
      'pendle': 'https://app.pendle.finance',
      'balancer': 'https://app.balancer.fi',
      '1inch': 'https://app.1inch.io',
      'paraswap': 'https://paraswap.io',
      '0x': 'https://0x.org',
      'dydx': 'https://trade.dydx.exchange',
      'synthetix': 'https://staking.synthetix.io',
      'chainlink': 'https://chain.link',
      'the-graph': 'https://thegraph.com',
      'polygon': 'https://polygon.technology',
      'arbitrum': 'https://arbitrum.io',
      'optimism': 'https://optimism.io',
      'base': 'https://base.org',
      // Add more protocols as needed
      'morpho-v1': 'https://app.morpho.org',
      'radiant': 'https://app.radiant.capital',
      'stargate': 'https://stargate.finance',
      'aerodrome': 'https://aerodrome.finance',
      'beefy': 'https://app.beefy.com',
      'silo': 'https://app.silo.finance',
      'midas-rwa': 'https://midas.app',
      'wildcat-protocol': 'https://app.wildcat.finance',
      'lagoon': 'https://lagoon.finance',
    };

    let positions = pools.map(p => {
      const website = protocolWebsites[p.project.toLowerCase()] || undefined;

      return {
        id: p.pool,
        name: `${p.project} ${p.symbol}`,
        asset: p.symbol.split('-')[0] || p.symbol,
        assetAddress: undefined,
        poolAddress: p.pool,
        poolType: 'double' as const,
        isLoopable: false,
        supplyAPY: p.apyBase || p.apy,
        borrowAPY: undefined,
        rewardAPY: p.apyReward || 0,
        totalAPY: p.apy,
        tvl: p.tvlUsd,
        availableLiquidity: p.tvlUsd * (1 - (p.utilization || 0) / 100),
        utilizationRate: p.utilization,
        riskLevel: p.stablecoin ? 'low' as const : (p.ilRisk === 'yes' ? 'high' as const : 'medium' as const),
        riskScore: p.ilRisk === 'yes' ? 70 : (p.stablecoin ? 20 : 40),
        minDeposit: undefined,
        lockPeriod: undefined,
        active: true,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        protocol: {
          id: p.project.toLowerCase().replace(/\s+/g, '-'),
          name: p.project,
          slug: p.project.toLowerCase().replace(/\s+/g, '-'),
          logo: undefined,
          chain: p.chain,
          audited: false,
          website: website,
        },
        // Keep original fields for backward compatibility
        poolName: `${p.project} - ${p.symbol}`,
        token0Symbol: p.symbol.split('-')[0] || p.symbol,
        token1Symbol: p.symbol.split('-')[1] || '',
        fees24h: (p.tvlUsd * (p.apy / 100)) / 365,
        impermanentLoss: p.ilRisk === 'yes' ? 10 : 0,
        stablecoin: p.stablecoin,
        exposure: p.exposure,
      };
    });
    
    // Apply search filter
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      positions = positions.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.asset.toLowerCase().includes(searchTerm) ||
        p.protocol.name.toLowerCase().includes(searchTerm) ||
        p.token0Symbol.toLowerCase().includes(searchTerm) ||
        p.token1Symbol.toLowerCase().includes(searchTerm)
      );
    }
    
    console.log(`✅ [POOLS PAGE] Found ${positions.length} opportunities`)

    // Sorting already done by DefiLlama (by APY desc)
    // But apply custom sort if requested
    if (sortBy === 'tvl') {
      positions.sort((a, b) =>
        sortOrder === 'asc' ? a.tvl - b.tvl : b.tvl - a.tvl
      );
    } else if (sortBy === 'apy') {
      positions.sort((a, b) =>
        sortOrder === 'asc' ? a.totalAPY - b.totalAPY : b.totalAPY - a.totalAPY
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
 * @description Get list of available protocols from DefiLlama (1000+ protocols)
 */
router.get('/protocols', async (req: Request, res: Response) => {
  try {
    // Fetch pools from DefiLlama to extract unique protocols
    const pools = await defiLlamaAggregator.getTopPools({
      minAPY: 0,
      minTVL: 100000, // $100k minimum for quality protocols
      chains: ['Ethereum', 'Optimism', 'Arbitrum', 'Polygon', 'Base'],
      limit: 500, // Fetch more to get diverse protocols
    });
    
    // Extract unique protocols with their data
    const protocolMap = new Map();
    pools.forEach(pool => {
      if (!protocolMap.has(pool.project)) {
        protocolMap.set(pool.project, {
          id: pool.project.toLowerCase().replace(/\s+/g, '-'),
          name: pool.project,
          slug: pool.project.toLowerCase().replace(/\s+/g, '-'),
          logo: undefined,
          tvl: pool.tvlUsd,
          chain: pool.chain,
          audited: false,
          poolCount: 1,
        });
      } else {
        // Update TVL and pool count
        const existing = protocolMap.get(pool.project);
        existing.tvl += pool.tvlUsd;
        existing.poolCount += 1;
      }
    });
    
    // Convert to array and sort by TVL
    const protocols = Array.from(protocolMap.values())
      .sort((a, b) => b.tvl - a.tvl)
      .map(p => ({
        ...p,
        tvl: `$${(p.tvl / 1e9).toFixed(2)}B`,
      }));

    console.log(`✅ Found ${protocols.length} unique protocols from DefiLlama`);

    res.json({
      success: true,
      data: protocols,
      count: protocols.length,
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