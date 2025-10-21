// backend/src/routes/ai.ts
import { Router, Request, Response, NextFunction } from 'express';
import AIService, { ChatMessage } from '../services/AIService';
import { ethers } from 'ethers';

export function aiRoutes(provider: ethers.Provider) {
  const router = Router();
  const aiService = new AIService(provider);

  // Chat endpoint
  router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages, walletAddress, sessionId } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: 'messages array is required',
        });
      }

      // Validate messages format
      const validMessages = messages.every(
        (msg: any) =>
          msg.role && msg.content && ['user', 'assistant', 'system'].includes(msg.role)
      );

      if (!validMessages) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message format. Each message must have role and content',
        });
      }

      // Validate wallet address if provided
      if (walletAddress && !ethers.isAddress(walletAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }

      const response = await aiService.getChatResponse(
        messages as ChatMessage[],
        walletAddress,
        sessionId
      );

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          message: response,
          sessionId: sessionId || null,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Simple suggestions endpoint (no chat history)
  router.post('/suggest', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress, assets } = req.body;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'walletAddress is required',
        });
      }

      if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
      }

      const suggestions = await aiService.getSimpleSuggestions(
        walletAddress,
        assets
      );

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          suggestions,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Get chat history
  router.get('/chat/history/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId is required',
        });
      }

      const history = await aiService.getChatHistory(sessionId);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: history.length,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
