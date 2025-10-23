// backend/src/routes/protocols.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../services/PrismaService';
import PoolService from '../services/PoolService';

export const protocolsRoutes = Router();

// Get all protocols
protocolsRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chain, active } = req.query;

    const protocols: any[] = await (prisma as any).protocol.findMany({
      where: {
        ...(chain && { chain: chain as string }),
        ...(active !== undefined && { active: active === 'true' }),
      },
      include: {
        _count: {
          select: { pools: true },
        },
      },
      orderBy: { tvl: 'desc' },
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: protocols.length,
      data: protocols,
    });
  } catch (error) {
    next(error);
  }
});

// Get protocol by slug
protocolsRoutes.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const protocol: any = await (prisma as any).protocol.findUnique({
      where: { slug },
      include: {
        pools: {
          where: { active: true },
          orderBy: { totalAPY: 'desc' },
        },
      },
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocol not found',
      });
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: protocol,
    });
  } catch (error) {
    next(error);
  }
});

// Get protocol pools
protocolsRoutes.get('/:slug/pools', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

  const pools = await PoolService.getPoolsByProtocol(slug);

    if (pools === null) {
      return res.status(404).json({
        success: false,
        error: 'Protocol not found',
      });
    }

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

// Get protocol statistics
protocolsRoutes.get('/:slug/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const protocol: any = await (prisma as any).protocol.findUnique({
      where: { slug },
      include: {
        pools: {
          where: { active: true },
        },
      },
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocol not found',
      });
    }

    const totalPools = protocol.pools.length;
    const avgAPY = totalPools > 0
      ? protocol.pools.reduce((sum: number, pool: any) => sum + (pool.totalAPY as unknown as number), 0) / totalPools
      : 0;
    const highestAPY = totalPools > 0
      ? Math.max(...protocol.pools.map((p: any) => (p.totalAPY as unknown as number)))
      : 0;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        protocol: {
          name: protocol.name,
          slug: protocol.slug,
          chain: protocol.chain,
          audited: protocol.audited,
        },
        stats: {
          totalPools,
          tvl: protocol.tvl.toString(),
          avgAPY,
          highestAPY,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
