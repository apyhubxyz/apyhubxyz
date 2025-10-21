// Enhanced APY Routes - Using new protocol aggregation
import { Router, Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { getEnhancedDeFiService, FilterOptions } from '../services/EnhancedDeFiService';

export function enhancedApyRoutes(provider: ethers.Provider) {
  const router = Router();
  const defiService = getEnhancedDeFiService(provider);
  
  // Get all positions with advanced filtering
  router.get('/positions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: FilterOptions = {
        chains: req.query.chains ? (req.query.chains as string).split(',') as any : undefined,
        protocols: req.query.protocols ? (req.query.protocols as string).split(',') : undefined,
        minAPY: req.query.minAPY ? parseFloat(req.query.minAPY as string) : undefined,
        maxAPY: req.query.maxAPY ? parseFloat(req.query.maxAPY as string) : undefined,
        minTVL: req.query.minTVL ? parseFloat(req.query.minTVL as string) : undefined,
        riskLevels: req.query.riskLevels ? (req.query.riskLevels as string).split(',') as any : undefined,
        poolTypes: req.query.poolTypes ? (req.query.poolTypes as string).split(',') : undefined,
        isLoopable: req.query.isLoopable ? req.query.isLoopable === 'true' : undefined,
        assets: req.query.assets ? (req.query.assets as string).split(',') : undefined,
        sortBy: req.query.sortBy as any || 'apy',
        sortOrder: req.query.sortOrder as any || 'desc',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      
      const positions = await defiService.fetchAllPositions(filters);
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: positions.length,
        data: positions,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get yield strategies for a user
  router.get('/strategies/:address', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const { targetAPY, riskTolerance } = req.query;
      
      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }
      
      const strategies = await defiService.generateStrategies(
        address,
        targetAPY ? parseFloat(targetAPY as string) : undefined,
        riskTolerance as any || 'MEDIUM'
      );
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: strategies.length,
        data: strategies,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get protocol statistics
  router.get('/statistics', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = defiService.getStatistics();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get top opportunities
  router.get('/opportunities', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, chain, minAPY = 10 } = req.query;
      
      const filters: FilterOptions = {
        chains: chain ? [chain as any] : undefined,
        poolTypes: category ? [category as string] : undefined,
        minAPY: parseFloat(minAPY as string),
        sortBy: 'apy',
        sortOrder: 'desc',
        limit: 20,
      };
      
      const positions = await defiService.fetchAllPositions(filters);
      
      // Group by strategy type
      const opportunities = {
        stable: positions.filter(p => p.poolType === 'stable' || p.strategyType === 'stable-stable'),
        leveraged: positions.filter(p => p.isLoopable || p.poolType === 'leveraged'),
        staking: positions.filter(p => p.poolType === 'staking'),
        liquidity: positions.filter(p => p.poolType === 'liquidity'),
        derivative: positions.filter(p => p.poolType === 'derivative' || p.strategyType === 'derivative'),
      };
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: opportunities,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get loopable positions
  router.get('/loopable', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const positions = await defiService.fetchAllPositions({
        isLoopable: true,
        sortBy: 'apy',
        sortOrder: 'desc',
        limit: 50,
      });
      
      // Calculate leveraged APY for each
      const loopableWithLeverage = positions.map(pos => ({
        ...pos,
        leveragedAPY: pos.apy * (pos.maxLeverage || 2),
        estimatedGas: 0.05, // ETH
        liquidationRisk: pos.liquidationRisk || (100 - (pos.collateralFactor || 0.8) * 100),
      }));
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: loopableWithLeverage.length,
        data: loopableWithLeverage,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get delta-neutral opportunities
  router.get('/delta-neutral', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Find stable-stable pairs and basis trade opportunities
      const stablePools = await defiService.fetchAllPositions({
        poolTypes: ['stable'],
        minAPY: 5,
        sortBy: 'apy',
        sortOrder: 'desc',
      });
      
      const deltaNeutralStrategies = stablePools.map(pool => ({
        pool,
        strategy: 'stable-farming',
        expectedAPY: pool.apy * 0.9, // Account for fees
        requiredCapital: 10000,
        riskLevel: 'LOW',
        steps: [
          `Deposit ${pool.assets[0]} to ${pool.protocolName}`,
          `Earn ${pool.apy.toFixed(2)}% APY with minimal IL risk`,
        ],
      }));
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: deltaNeutralStrategies.length,
        data: deltaNeutralStrategies,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Search positions by asset
  router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { asset, minAPY = 0 } = req.query;
      
      if (!asset) {
        return res.status(400).json({
          success: false,
          error: 'Asset parameter is required',
        });
      }
      
      const positions = await defiService.fetchAllPositions({
        assets: [(asset as string).toUpperCase()],
        minAPY: parseFloat(minAPY as string),
        sortBy: 'apy',
        sortOrder: 'desc',
        limit: 50,
      });
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        query: asset,
        count: positions.length,
        data: positions,
      });
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}