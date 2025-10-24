// Dashboard Routes - User's personal positions after wallet connection
import { Router, Request, Response } from 'express';
import { realPositionFetcher } from '../services/RealPositionFetcher';
import { zapperGraphQLFetcher } from '../services/ZapperGraphQLFetcher';
import { deBankPositionFetcher } from '../services/DeBankPositionFetcher';

const router = Router();

/**
 * @route GET /api/dashboard/:address
 * @description Get user's ACTUAL positions from blockchain (for Dashboard page after wallet connect)
 * @param {string} address - User's wallet address
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address',
      });
    }

    console.log(`👤 [DASHBOARD] Fetching YOUR positions for ${address}...`);
    
    // Multi-tier fallback strategy:
    // 1. DeBank (free, comprehensive but rate-limited)
    // 2. Zapper (with API key, very comprehensive)
    // 3. Direct blockchain (Uniswap + Aave only)
    
    let positions: any[] = [];
    let dataSource = 'unknown';
    
    // Try DeBank first
    try {
      console.log('  → Trying DeBank API (free, 800+ protocols)...');
      positions = await deBankPositionFetcher.fetchAllPositions(address);
      
      if (positions.length > 0) {
        dataSource = 'DeBank';
        console.log(`✅ Using DeBank: Found ${positions.length} positions`);
      } else {
        throw new Error('DeBank empty');
      }
    } catch (debankError: any) {
      console.log(`  ✗ DeBank failed: ${debankError.message || 'unknown'}`);
      
      // Try Zapper GraphQL as fallback
      try {
        console.log('  → Trying Zapper GraphQL API (with key, 1000+ protocols)...');
        positions = await zapperGraphQLFetcher.fetchAllPositions(address);
        
        if (positions.length > 0) {
          dataSource = 'Zapper GraphQL';
          console.log(`✅ Using Zapper GraphQL: Found ${positions.length} positions`);
        } else {
          throw new Error('Zapper empty');
        }
      } catch (zapperError: any) {
        console.log(`  ✗ Zapper failed: ${zapperError.message || 'unknown'}`);
        
        // Final fallback: Direct blockchain
        console.log('  → Trying direct blockchain queries (Uniswap + Aave only)...');
        positions = await realPositionFetcher.fetchAllPositions(address);
        dataSource = 'Blockchain (limited)';
        console.log(`✅ Using direct blockchain: Found ${positions.length} positions`);
      }
    }
    
    // Calculate portfolio stats
    const totalValueUSD = positions.reduce((sum, p) => sum + p.totalValueUSD, 0);
    const avgAPY = positions.length > 0
      ? positions.reduce((sum, p) => sum + p.apy, 0) / positions.length
      : 0;
    const totalFees24h = positions.reduce((sum, p) => sum + p.fees24h, 0);
    const totalIL = positions.reduce((sum, p) => sum + p.impermanentLoss, 0);
    
    // Group by protocol
    const byProtocol = positions.reduce((acc, p) => {
      if (!acc[p.protocol]) {
        acc[p.protocol] = { count: 0, value: 0 };
      }
      acc[p.protocol].count++;
      acc[p.protocol].value += p.totalValueUSD;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);
    
    console.log(`✅ [DASHBOARD] Found ${positions.length} YOUR positions (Total: $${totalValueUSD.toFixed(2)}) via ${dataSource}\n`);

    res.json({
      success: true,
      data: {
        address,
        positions,
        stats: {
          totalPositions: positions.length,
          totalValueUSD,
          avgAPY,
          totalFees24h,
          totalImpermanentLoss: totalIL,
          byProtocol,
        },
        meta: {
          dataSource,  // Shows which API was used
          fetchedAt: new Date().toISOString(),
        },
      },
      message: `Your personal positions from ${dataSource}`
    });
  } catch (error: any) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch your positions'
    });
  }
});

/**
 * @route GET /api/dashboard/:address/summary
 * @description Get quick portfolio summary
 */
router.get('/:address/summary', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    const positions = await realPositionFetcher.fetchAllPositions(address);
    const totalValueUSD = positions.reduce((sum, p) => sum + p.totalValueUSD, 0);
    
    res.json({
      success: true,
      data: {
        totalPositions: positions.length,
        totalValueUSD,
        hasPositions: positions.length > 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

