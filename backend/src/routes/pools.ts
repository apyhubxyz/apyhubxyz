// backend/src/routes/pools.ts
import { Router, Request, Response, NextFunction } from 'express';
import PoolService from '../services/PoolService';

export const poolsRoutes = Router();

// Get all pools with filters
poolsRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      asset,
      poolType,
      isLoopable,
      protocolId,
      chain,
      minAPY,
      maxAPY,
      riskLevel,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const filters = {
      asset: asset as string,
      poolType: poolType as any,
      isLoopable: isLoopable === 'true' ? true : isLoopable === 'false' ? false : undefined,
      protocolId: protocolId as string,
      chain: chain as string,
      minAPY: minAPY ? parseFloat(minAPY as string) : undefined,
      maxAPY: maxAPY ? parseFloat(maxAPY as string) : undefined,
      riskLevel: riskLevel as any,
    };

    const sortOptions = {
      sortBy: (sortBy as any) || 'totalAPY',
      sortOrder: (sortOrder as any) || 'desc',
    };

    const paginationOptions = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    };

    const result = await PoolService.getPools(filters, sortOptions, paginationOptions);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// Get pool by ID
poolsRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const pool = await PoolService.getPoolById(id);

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
      });
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: pool,
    });
  } catch (error) {
    next(error);
  }
});

// Get top pools
poolsRoutes.get('/top/:limit?', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.params.limit || '10');
    const pools = await PoolService.getTopPools(limit);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: pools.length,
      data: pools,
    });
  } catch (error) {
    next(error);
  }
});

// Search pools
poolsRoutes.get('/search/:query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.params;
    const pools = await PoolService.searchPools(query);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: pools.length,
      data: pools,
    });
  } catch (error) {
    next(error);
  }
});

// Get pool statistics
poolsRoutes.get('/stats/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await PoolService.getPoolStats();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Get similar pools
poolsRoutes.get('/:id/similar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const pools = await PoolService.getSimilarPools(id);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: pools.length,
      data: pools,
    });
  } catch (error) {
    next(error);
  }
});
