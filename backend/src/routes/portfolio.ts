// backend/src/routes/portfolio.ts
import { Router, Request, Response, NextFunction } from 'express';
import PortfolioService from '../services/PortfolioService';
import { ethers } from 'ethers';

export function portfolioRoutes(provider: ethers.Provider) {
  const router = Router();
  const portfolioService = new PortfolioService(provider);

  // Get user portfolio by wallet address
  router.get('/:address', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;

      // Validate address
      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }

      const portfolio = await portfolioService.getUserPortfolio(address);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: portfolio,
      });
    } catch (error) {
      next(error);
    }
  });

  // Add position to portfolio
  router.post('/:address/positions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const { poolId, amount, amountUSD } = req.body;

      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }

      if (!poolId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'poolId and amount are required',
        });
      }

      const position = await portfolioService.addPosition(
        address,
        poolId,
        amount,
        amountUSD
      );

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: position,
      });
    } catch (error) {
      next(error);
    }
  });

  // Remove position from portfolio
  router.delete('/:address/positions/:poolId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address, poolId } = req.params;

      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }

      await portfolioService.removePosition(address, poolId);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Position removed successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  // Get user watchlist
  router.get('/:address/watchlist', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;

      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }

      const watchlist = await portfolioService.getWatchlist(address);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: watchlist.length,
        data: watchlist,
      });
    } catch (error) {
      next(error);
    }
  });

  // Add to watchlist
  router.post('/:address/watchlist', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const { poolId, notes } = req.body;

      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }

      if (!poolId) {
        return res.status(400).json({
          success: false,
          error: 'poolId is required',
        });
      }

      const item = await portfolioService.addToWatchlist(address, poolId, notes);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: item,
      });
    } catch (error) {
      next(error);
    }
  });

  // Remove from watchlist
  router.delete('/:address/watchlist/:poolId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address, poolId } = req.params;

      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }

      await portfolioService.removeFromWatchlist(address, poolId);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Removed from watchlist',
      });
    } catch (error) {
      next(error);
    }
  });

  // Get investment suggestions
  router.get('/:address/suggestions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const { riskTolerance = 'medium' } = req.query;

      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }

      const suggestions = await portfolioService.getSuggestions(
        address,
        riskTolerance as any
      );

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
