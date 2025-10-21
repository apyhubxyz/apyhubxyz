// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { apyRoutes } from './routes/apy';
import { poolsRoutes } from './routes/pools';
import { protocolsRoutes } from './routes/protocols';
import { portfolioRoutes } from './routes/portfolio';
import { aiRoutes } from './routes/ai';
import { DeFiService } from './services/DeFiService';
import PrismaService from './services/PrismaService';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

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

// Initialize DeFi service (legacy - for backward compatibility)
const defiService = new DeFiService(provider);

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
      legacy: {
        apy: {
          all: 'GET /api/apy/all',
          byProtocol: 'GET /api/apy/protocol/:protocol',
          byToken: 'GET /api/apy/token/:token',
          compare: 'GET /api/apy/compare/:token',
          historical: 'GET /api/apy/historical/:protocol/:token?days=7',
        },
      },
    },
    documentation: 'https://docs.apyhub.xyz',
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await PrismaService.getInstance().$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        api: 'operational',
        database: 'operational',
        blockchain: 'operational',
      },
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
app.use('/api/protocols', protocolsRoutes);
app.use('/api/pools', poolsRoutes);
app.use('/api/portfolio', portfolioRoutes(provider));
app.use('/api/ai', aiRoutes(provider));

// Legacy routes (for backward compatibility)
app.use('/api/apy', apyRoutes(defiService));

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

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Apyhub Backend API`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}/`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📁 Endpoints:`);
  console.log(`   🔹 Protocols: /api/protocols`);
  console.log(`   🔹 Pools: /api/pools`);
  console.log(`   🔹 Portfolio: /api/portfolio/:address`);
  console.log(`   🔹 AI Chat: /api/ai/chat`);
  console.log(`   🔹 Legacy APY: /api/apy`);
  console.log(`\n✨ Ready to accept requests!\n`);
});
