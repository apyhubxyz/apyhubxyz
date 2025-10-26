// backend/src/routes/strategy-ai.ts
import { Router, Request, Response } from 'express';
import StrategyAIService from '../services/StrategyAIService';

const router = Router();
const strategyAI = new StrategyAIService();

/**
 * POST /api/strategy-ai/recommend
 * Get advanced DeFi strategy recommendations using RAG
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { query, portfolio, riskTolerance = 'medium' } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string'
      });
    }

    const strategy = await strategyAI.getAdvancedStrategy(
      query,
      portfolio,
      riskTolerance as 'low' | 'medium' | 'high'
    );

    res.json({
      success: true,
      data: strategy,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Strategy recommendation error:', error);
    res.status(500).json({
      error: 'Failed to generate strategy recommendation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/strategy-ai/chat
 * Chat with AI using RAG-enhanced context
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, portfolio } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Messages array is required'
      });
    }

    const response = await strategyAI.chat(messages, portfolio);

    res.json({
      success: true,
      data: {
        message: response
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/strategy-ai/search
 * Search for strategies by criteria
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      asset,
      minAPY,
      maxRisk,
      protocols
    } = req.query;

    const criteria: any = {};
    
    if (asset) criteria.asset = asset as string;
    if (minAPY) criteria.minAPY = parseFloat(minAPY as string);
    if (maxRisk) criteria.maxRisk = maxRisk as string;
    if (protocols) {
      criteria.protocols = typeof protocols === 'string' 
        ? protocols.split(',')
        : protocols;
    }

    const strategies = await strategyAI.searchStrategies(criteria);

    res.json({
      success: true,
      data: strategies,
      count: strategies.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Strategy search error:', error);
    res.status(500).json({
      error: 'Failed to search strategies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/strategy-ai/all
 * Get all available strategies from training data
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const strategies = await strategyAI.getAllStrategies();

    res.json({
      success: true,
      data: strategies,
      count: strategies.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get all strategies error:', error);
    res.status(500).json({
      error: 'Failed to fetch strategies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/strategy-ai/stats
 * Get RAG system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await strategyAI.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/strategy-ai/analyze
 * Analyze a specific strategy in detail
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { strategyName } = req.body;

    if (!strategyName) {
      return res.status(400).json({
        error: 'Strategy name is required'
      });
    }

    // This would use RAG to fetch detailed strategy info
    // For now, return a simple response
    res.json({
      success: true,
      data: {
        name: strategyName,
        analysis: 'Detailed analysis using RAG coming soon',
        relevantKnowledge: []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Strategy analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze strategy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;