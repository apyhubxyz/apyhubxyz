// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
// import { apyRoutes } from './routes/apy';
import { poolsRoutes } from './routes/pools';
import { protocolsRoutes } from './routes/protocols';
import { portfolioRoutes } from './routes/portfolio';
import { aiRoutes } from './routes/ai';
import { envioRoutes } from './routes/envio';
import positionsRoutes from './routes/positions';
// import { DeFiService } from './services/DeFiService';
import PrismaService from './services/PrismaService';
// import { enhancedApyRoutes } from './routes/enhanced-apy';
// import { enhancedAIRoutes, initializeEnhancedAI } from './routes/enhanced-ai';
// import { getEnhancedDeFiService } from './services/EnhancedDeFiService';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket support
const server = createServer(app);

// Initialize WebSocket server for real-time updates
const wss = new WebSocketServer({
  server,
  path: '/ws'
});

// Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize provider
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'
);

// Legacy DeFi service removed (Envio-only data path)

// Initialize Enhanced DeFi Service (disabled temporarily due to module issues)
// const enhancedDeFi = getEnhancedDeFiService(provider);
// const aiService = initializeEnhancedAI(enhancedDeFi);

// WebSocket connections for real-time updates
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle subscriptions
      if (data.type === 'subscribe') {
        // Subscribe to position updates
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: data.channel
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Root route - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Apyhub API',
    version: '2.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    description: 'DeFi APY Aggregator API - Discover the best yield opportunities',
    endpoints: {
    health: 'GET /api/health',
    positions: {
      list: 'GET /api/positions?protocol=Aave&chainId=1&sortBy=tvl',
      stats: 'GET /api/positions/stats',
      protocols: 'GET /api/positions/protocols',
      chains: 'GET /api/positions/chains',
      sync: 'POST /api/positions/sync',
      websocket: 'GET /api/positions/ws',
    },
    protocols: {
      list: 'GET /api/protocols',
      details: 'GET /api/protocols/:slug',
      pools: 'GET /api/protocols/:slug/pools',
      stats: 'GET /api/protocols/:slug/stats',
    },
      pools: {
        list: 'GET /api/pools?asset=USDC&poolType=lending&isLoopable=true',
        details: 'GET /api/pools/:id',
        top: 'GET /api/pools/top/:limit',
        search: 'GET /api/pools/search/:query',
        stats: 'GET /api/pools/stats/overview',
        similar: 'GET /api/pools/:id/similar',
      },
      portfolio: {
        get: 'GET /api/portfolio/:address',
        addPosition: 'POST /api/portfolio/:address/positions',
        removePosition: 'DELETE /api/portfolio/:address/positions/:poolId',
        watchlist: 'GET /api/portfolio/:address/watchlist',
        addToWatchlist: 'POST /api/portfolio/:address/watchlist',
        removeFromWatchlist: 'DELETE /api/portfolio/:address/watchlist/:poolId',
        suggestions: 'GET /api/portfolio/:address/suggestions',
      },
      ai: {
        chat: 'POST /api/ai/chat',
        suggest: 'POST /api/ai/suggest',
        history: 'GET /api/ai/chat/history/:sessionId',
      },
      enhancedV2: {
        apy: {
          positions: 'GET /api/v2/apy/positions?chains=ethereum,arbitrum&minAPY=10&sortBy=apy',
          strategies: 'GET /api/v2/apy/strategies/:address?targetAPY=20&riskTolerance=MEDIUM',
          opportunities: 'GET /api/v2/apy/opportunities?category=stable&minAPY=10',
          loopable: 'GET /api/v2/apy/loopable',
          deltaNeutral: 'GET /api/v2/apy/delta-neutral',
          search: 'GET /api/v2/apy/search?asset=USDC&minAPY=5',
          statistics: 'GET /api/v2/apy/statistics',
        },
        ai: {
          chat: 'POST /api/v2/ai/chat',
          recommend: 'POST /api/v2/ai/recommend',
          strategies: 'GET /api/v2/ai/strategies',
          session: 'GET /api/v2/ai/session/:sessionId',
          analyzePortfolio: 'POST /api/v2/ai/analyze-portfolio'
        }
      },
      // legacy: removed (Envio-only)
    },
    documentation: 'https://docs.apyhub.xyz',
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await PrismaService.getInstance().$queryRaw`SELECT 1`;

    // Get enhanced stats
    // const stats = enhancedDeFi.getStatistics();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        api: 'operational',
        database: 'operational',
        blockchain: 'operational',
        websocket: 'operational',
      },
      // statistics: {
      //   protocols: stats.totalProtocols,
      //   totalTVL: stats.totalTVL,
      //   auditedProtocols: stats.auditedProtocols,
      // },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        api: 'operational',
        database: 'error',
        blockchain: 'unknown',
      },
    });
  }
});

// API Routes
// Pools/Protocols enabled (schema aligned)
app.use('/api/protocols', protocolsRoutes);
app.use('/api/pools', poolsRoutes);
app.use('/api/portfolio', portfolioRoutes(provider));
app.use('/api/ai', aiRoutes(provider));
app.use('/api/envio', envioRoutes());
app.use('/api/positions', positionsRoutes);

// Enhanced V2 routes - 50+ protocol support (disabled temporarily)
// app.use('/api/v2/apy', enhancedApyRoutes);
// app.use('/api/v2/ai', enhancedAIRoutes);

// Legacy APY routes removed (Envio-only)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
    path: req.path,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      timestamp: new Date().toISOString(),
    });
  }

  if (err.code?.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      timestamp: new Date().toISOString(),
    });
  }

  // Generic error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await PrismaService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await PrismaService.disconnect();
  process.exit(0);
});

// Start server with WebSocket support
server.listen(PORT, () => {
  // const stats = enhancedDeFi.getStatistics();
  console.log(`\n🚀 Apyhub Backend API v2.0`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}/`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📁 Endpoints:`);
  console.log(`   📊 LP Positions: /api/positions (Envio HyperSync)`);
  console.log(`   🔹 Protocols: /api/protocols`);
  console.log(`   🔹 Pools: /api/pools`);
  console.log(`   🔹 Portfolio: /api/portfolio/:address`);
  console.log(`   🔹 AI Chat: /api/ai/chat`);
  console.log(`   ⚡ Enhanced APY V2: /api/v2/apy/* (preparing)`);
  console.log(`   🤖 Enhanced AI V2: /api/v2/ai/* (preparing)`);
  // console.log(`   🔹 Legacy APY: /api/apy`);
  // console.log(`\n📈 Statistics:`);
  // console.log(`   📊 Total Protocols: ${stats.totalProtocols}`);
  // console.log(`   💰 Total TVL: $${(stats.totalTVL / 1e9).toFixed(2)}B`);
  // console.log(`   ✅ Audited Protocols: ${stats.auditedProtocols}`);
  console.log(`\n✨ Ready to accept requests!\n`);
});
