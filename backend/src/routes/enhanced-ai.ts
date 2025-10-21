// backend/src/routes/enhanced-ai.ts
import { Router } from 'express';
import { EnhancedAIService } from '../services/EnhancedAIService';
import { EnhancedDeFiService } from '../services/EnhancedDeFiService';
import PrismaService from '../services/PrismaService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Initialize services (services are singleton instances managed at app level)
let aiService: EnhancedAIService | null = null;

// Function to initialize AI service with DeFi service
export function initializeEnhancedAI(defiService: EnhancedDeFiService) {
  aiService = new EnhancedAIService(defiService);
  return aiService;
}

// Store user sessions
const sessions = new Map<string, any>();

/**
 * POST /api/v2/ai/chat
 * Enhanced AI chat with RAG and Grok integration
 */
router.post('/chat', async (req, res) => {
  try {
    const { 
      messages, 
      walletAddress, 
      sessionId = uuidv4(),
      chains = ['ethereum', 'arbitrum', 'optimism', 'base'],
      riskTolerance = 'medium'
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    // Build user context
    const userContext = walletAddress ? {
      walletAddress,
      totalValue: 10000, // Mock value for demo
      positions: [],
      riskTolerance,
      chains
    } : undefined;

    // Get AI response
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI service not initialized'
      });
    }

    const response = await aiService.getChatResponse(
      messages,
      userContext
    );

    // Store session
    sessions.set(sessionId, {
      messages: [...messages, { role: 'assistant', content: response }],
      walletAddress,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      response,
      sessionId,
      context: userContext
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI response',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * POST /api/v2/ai/recommend
 * Get personalized strategy recommendations
 */
router.post('/recommend', async (req, res) => {
  try {
    const {
      walletAddress,
      totalValue = 10000,
      riskTolerance = 'medium',
      chains = ['ethereum', 'arbitrum'],
      query = 'recommend best yield strategy'
    } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    // Build user context
    const userContext = {
      walletAddress,
      totalValue,
      positions: [], // Would fetch from blockchain in production
      riskTolerance,
      chains
    };

    // Get personalized recommendation
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI service not initialized'
      });
    }

    const recommendation = await aiService.getPersonalizedRecommendation(
      userContext,
      query
    );

    res.json({
      success: true,
      recommendation,
      userContext
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendation',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * GET /api/v2/ai/strategies
 * List available yield strategies
 */
router.get('/strategies', (req, res) => {
  const strategies = [
    {
      id: 'eth_super_basis',
      name: 'ETH Super-Basis Trade',
      description: 'Leverage wstETH for enhanced yields through BOLD borrowing',
      expectedAPY: '18-25%',
      risk: 'medium',
      minimumCapital: 5000,
      protocols: ['Liquity V2', 'Maple', 'Drift'],
      chains: ['ethereum', 'solana']
    },
    {
      id: 'bold_gold_loop',
      name: 'BOLD Gold Loop',
      description: 'Tokenized gold collateral with BOLD leveraged farming',
      expectedAPY: '20-30%',
      risk: 'medium-high',
      minimumCapital: 10000,
      protocols: ['Liquity V2', 'Yearn', 'Fluid'],
      chains: ['ethereum']
    },
    {
      id: 'market_neutral_lusd',
      name: 'Market-Neutral LUSD',
      description: 'Delta-neutral position using LUSD stablecoin',
      expectedAPY: '10-15%',
      risk: 'low',
      minimumCapital: 1000,
      protocols: ['Liquity', 'Sonne', 'Velodrome'],
      chains: ['optimism']
    },
    {
      id: 'stablecoin_pt',
      name: 'Stablecoin PT Strategy',
      description: 'Fixed yield through principal tokens',
      expectedAPY: '10-20%',
      risk: 'low',
      minimumCapital: 500,
      protocols: ['Pendle', 'InfiniFi'],
      chains: ['arbitrum']
    },
    {
      id: 'btc_leveraged_loop',
      name: 'BTC Leveraged Loop',
      description: 'Recursive borrowing with cbBTC at 95% LLTV',
      expectedAPY: '18-25%',
      risk: 'high',
      minimumCapital: 5000,
      protocols: ['Fluid', 'Coinbase'],
      chains: ['base']
    },
    {
      id: 'pyusd_institutional',
      name: 'PYUSD Institutional Yield',
      description: 'PayPal USD yield farming for institutional investors',
      expectedAPY: '8-12%',
      risk: 'low',
      minimumCapital: 50000,
      protocols: ['PayPal', 'Aave', 'Compound'],
      chains: ['ethereum']
    }
  ];

  const { risk, minAPY, chain } = req.query;
  
  let filtered = strategies;
  
  if (risk) {
    filtered = filtered.filter(s => s.risk.includes(risk as string));
  }
  
  if (minAPY) {
    filtered = filtered.filter(s => {
      const apy = parseFloat(s.expectedAPY.split('-')[0]);
      return apy >= parseFloat(minAPY as string);
    });
  }
  
  if (chain) {
    filtered = filtered.filter(s => s.chains.includes(chain as string));
  }

  res.json({
    success: true,
    strategies: filtered,
    total: filtered.length
  });
});

/**
 * GET /api/v2/ai/session/:sessionId
 * Retrieve session history
 */
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    session
  });
});

/**
 * POST /api/v2/ai/analyze-portfolio
 * Analyze portfolio and suggest optimizations
 */
router.post('/analyze-portfolio', async (req, res) => {
  try {
    const { walletAddress, chains = ['ethereum'] } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    // Mock portfolio analysis for demo
    const analysis = {
      totalValue: 50000,
      currentAPY: 8.5,
      riskScore: 45,
      diversificationScore: 65,
      positions: [
        {
          protocol: 'Aave V3',
          asset: 'USDC',
          value: 20000,
          apy: 7.5,
          risk: 'low'
        },
        {
          protocol: 'Compound V3',
          asset: 'ETH',
          value: 15000,
          apy: 5.2,
          risk: 'low'
        },
        {
          protocol: 'Pendle',
          asset: 'PT-USDC',
          value: 15000,
          apy: 12.8,
          risk: 'medium'
        }
      ],
      recommendations: [
        {
          action: 'rebalance',
          from: 'Compound V3 ETH',
          to: 'Liquity V2 BOLD Loop',
          reason: 'Increase yield by 15% with similar risk profile',
          expectedGain: 2250
        },
        {
          action: 'add',
          protocol: 'Fluid cbBTC',
          amount: 5000,
          reason: 'Diversify with BTC exposure at 18% APY',
          expectedGain: 900
        },
        {
          action: 'bridge',
          from: 'Ethereum',
          to: 'Arbitrum',
          via: 'Avail Nexus',
          reason: 'Access higher yields on L2 with 60% lower gas',
          expectedSaving: 150
        }
      ],
      optimizedAPY: 11.3,
      additionalYearlyEarnings: 1400
    };

    res.json({
      success: true,
      analysis,
      walletAddress,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Portfolio analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze portfolio'
    });
  }
});

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [id, session] of sessions.entries()) {
    if (now - session.timestamp > oneHour) {
      sessions.delete(id);
    }
  }
}, 15 * 60 * 1000); // Every 15 minutes

export const enhancedAIRoutes = router;