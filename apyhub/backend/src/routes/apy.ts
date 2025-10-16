// backend/src/routes/apy.ts
import { Router, Request, Response, NextFunction } from 'express';
import { DeFiService } from '../services/DeFiService';

export function apyRoutes(defiService: DeFiService) {
  const router = Router();

  // Get all APY data across all protocols
  router.get('/all', async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Fetching all APY data...');
      const data = await defiService.getAllAPYs();
      
      // Add metadata
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        count: data.length,
        data: data
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get APY data for a specific protocol
  router.get('/protocol/:protocol', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { protocol } = req.params;
      console.log(`Fetching APY data for protocol: ${protocol}`);
      
      const data = await defiService.getProtocolAPYs(protocol);
      
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No data found for protocol: ${protocol}`,
          availableProtocols: ['compound', 'aave-v3', 'euler']
        });
      }
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        protocol: protocol,
        count: data.length,
        data: data
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get APY data for a specific token across all protocols
  router.get('/token/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      console.log(`Fetching APY data for token: ${token}`);
      
      const data = await defiService.getTokenAPYs(token);
      
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No data found for token: ${token}`,
          availableTokens: ['USDC', 'ETH', 'WETH', 'DAI']
        });
      }
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        token: token,
        count: data.length,
        data: data,
        // Calculate best rates
        bestSupplyAPY: Math.max(...data.map(d => d.supplyAPY)),
        bestBorrowAPY: Math.min(...data.filter(d => d.borrowAPY).map(d => d.borrowAPY!))
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get comparison between protocols for a specific token
  router.get('/compare/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      console.log(`Comparing rates for token: ${token}`);
      
      const data = await defiService.getTokenAPYs(token);
      
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No data found for token: ${token}`
        });
      }
      
      // Sort by supply APY (highest first)
      const sortedBySupply = [...data].sort((a, b) => b.supplyAPY - a.supplyAPY);
      
      // Sort by borrow APY (lowest first) 
      const sortedByBorrow = [...data]
        .filter(d => d.borrowAPY !== undefined)
        .sort((a, b) => a.borrowAPY! - b.borrowAPY!);
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        token: token,
        comparison: {
          bestSupply: {
            protocol: sortedBySupply[0].protocol,
            apy: sortedBySupply[0].supplyAPY,
            difference: sortedBySupply.length > 1 
              ? sortedBySupply[0].supplyAPY - sortedBySupply[sortedBySupply.length - 1].supplyAPY
              : 0
          },
          bestBorrow: sortedByBorrow.length > 0 ? {
            protocol: sortedByBorrow[0].protocol,
            apy: sortedByBorrow[0].borrowAPY,
            difference: sortedByBorrow.length > 1 
              ? sortedByBorrow[sortedByBorrow.length - 1].borrowAPY! - sortedByBorrow[0].borrowAPY!
              : 0
          } : null,
          allProtocols: data
        }
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get historical data (mock for now)
  router.get('/historical/:protocol/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { protocol, token } = req.params;
      const { days = 7 } = req.query;
      
      console.log(`Fetching ${days} days of historical data for ${protocol} ${token}`);
      
      // Mock historical data
      const historicalData = [];
      const baseAPY = 4.5;
      
      for (let i = Number(days); i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        historicalData.push({
          date: date.toISOString().split('T')[0],
          supplyAPY: baseAPY + (Math.random() * 2 - 1),
          borrowAPY: baseAPY + 2 + (Math.random() * 2 - 1),
          totalLiquidity: (100000000 + Math.random() * 50000000).toFixed(0)
        });
      }
      
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        protocol: protocol,
        token: token,
        days: Number(days),
        data: historicalData
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}