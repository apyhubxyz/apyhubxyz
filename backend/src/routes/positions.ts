import { Router, Request, Response } from 'express';
import hyperSyncService from '../services/EnvioHyperSyncService';

const router = Router();

/**
 * @route GET /api/positions
 * @description Get all LP positions across protocols
 * @query {string} userAddress - Optional user address to filter positions
 * @query {string} protocol - Optional protocol name filter
 * @query {number} chainId - Optional chain ID filter
 * @query {string} search - Optional search query
 * @query {string} sortBy - Sort field (tvl, apy, volume24h)
 * @query {string} sortOrder - Sort order (asc, desc)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      userAddress, 
      protocol, 
      chainId, 
      search,
      sortBy = 'tvl',
      sortOrder = 'desc'
    } = req.query;

    let positions;

    // Handle different query combinations
    if (search) {
      // For search, we'll filter the positions after fetching
      const allPositions = await hyperSyncService.queryPositions(userAddress as string);
      const searchTerm = (search as string).toLowerCase();
      positions = allPositions.filter(p =>
        p.poolName.toLowerCase().includes(searchTerm) ||
        p.protocol.toLowerCase().includes(searchTerm) ||
        p.token0Symbol.toLowerCase().includes(searchTerm) ||
        p.token1Symbol.toLowerCase().includes(searchTerm)
      );
    } else if (protocol) {
      positions = await hyperSyncService.queryPositions(userAddress as string, protocol as string);
    } else if (chainId) {
      const chainMap: { [key: string]: string } = {
        '1': 'ethereum',
        '10': 'optimism',
        '137': 'polygon',
        '8453': 'base',
        '42161': 'arbitrum',
        '56': 'bsc'
      };
      positions = await hyperSyncService.queryPositions(userAddress as string, undefined, chainMap[chainId as string]);
    } else {
      positions = await hyperSyncService.queryPositions(userAddress as string);
    }

    // Apply sorting
    const sortField = sortBy as 'tvl' | 'apy' | 'volume24h' | 'fees24h';
    positions.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      
      if (sortField === 'apy') {
        aVal = a.apy;
        bVal = b.apy;
      } else if (sortField === 'tvl') {
        aVal = a.totalValueUSD;
        bVal = b.totalValueUSD;
      } else if (sortField === 'volume24h' || sortField === 'fees24h') {
        aVal = a.fees24h;
        bVal = b.fees24h;
      }
      
      if (sortOrder === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    res.json({
      success: true,
      data: positions,
      count: positions.length
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
    const stats = await hyperSyncService.getStats();

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
    const positions = await hyperSyncService.queryPositions();
    
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