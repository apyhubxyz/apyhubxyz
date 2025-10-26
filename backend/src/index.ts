// backend/src/index.ts
// IMPORTANT: Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory BEFORE importing any services
// Use path relative to this file: backend/src -> go up 2 levels to reach project root
const envPath = path.resolve(__dirname, '..', '..', '.env');
const envResult = dotenv.config({ path: envPath });

// Log environment for debugging
console.log('📁 Loading .env from:', envPath);
if (envResult.error) {
  console.warn('⚠️  Warning: Could not load .env file:', envResult.error.message);
} else {
  console.log('✅ .env file loaded successfully');
}
console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('🔑 Zapper API Key:', process.env.ZAPPER_API_KEY && process.env.ZAPPER_API_KEY !== 'your_zapper_api_key_here' ? '✅ Loaded' : '❌ Missing');
console.log('🔑 Alchemy RPC URL:', process.env.ALCHEMY_RPC_URL && !process.env.ALCHEMY_RPC_URL.includes('YOUR_ALCHEMY_API_KEY') ? '✅ Loaded' : '❌ Missing');

// Now import everything else AFTER environment is loaded
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';
// import { apyRoutes } from './routes/apy';
import { poolsRoutes } from './routes/pools';
import { protocolsRoutes } from './routes/protocols';
import { portfolioRoutes } from './routes/portfolio';
import { aiRoutes } from './routes/ai';
import { envioRoutes } from './routes/envio';
import positionsRoutes from './routes/positions';
import dashboardRoutes from './routes/dashboard';
import bridgeRoutes from './routes/bridge';
import strategyAIRoutes from './routes/strategy-ai';
// import { DeFiService } from './services/DeFiService';
import PrismaService from './services/PrismaService';
// import { enhancedApyRoutes } from './routes/enhanced-apy';
// import { enhancedAIRoutes, initializeEnhancedAI } from './routes/enhanced-ai';
// import { getEnhancedDeFiService } from './services/EnhancedDeFiService';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket support
const server = createServer(app);

// Initialize WebSocket server for real-time updates
const wss = new WebSocketServer({
  server,
  path: '/ws'
});

// CORS - MUST be first to handle preflight requests
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

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
      list: 'GET /api/positions?protocol=Aave&minAPY=10 (ALL opportunities - Pools page)',
      stats: 'GET /api/positions/stats',
      protocols: 'GET /api/positions/protocols',
      chains: 'GET /api/positions/chains',
    },
    dashboard: {
      myPositions: 'GET /api/dashboard/:address (YOUR positions - Dashboard)',
      summary: 'GET /api/dashboard/:address/summary (Quick stats)',
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
      strategyAI: {
        recommend: 'POST /api/strategy-ai/recommend',
        chat: 'POST /api/strategy-ai/chat',
        search: 'GET /api/strategy-ai/search?asset=ETH&minAPY=10',
        all: 'GET /api/strategy-ai/all',
        stats: 'GET /api/strategy-ai/stats',
        analyze: 'POST /api/strategy-ai/analyze',
      },
      bridge: {
        routes: 'GET /api/bridge/routes?fromChain=ethereum&toChain=arbitrum&token=0x...&amount=1000000000000000000&recipient=0x...',
        quote: 'POST /api/bridge/quote',
        execute: 'POST /api/bridge/execute',
        status: 'GET /api/bridge/status/:bridgeId',
        history: 'GET /api/bridge/history/:address',
        analytics: 'GET /api/bridge/analytics',
        optimize: 'POST /api/bridge/optimize',
        unifiedBalance: 'GET /api/unified-balance/:address'
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
app.use('/api/positions', positionsRoutes);  // For Pools page (discovery)
app.use('/api/dashboard', dashboardRoutes);  // For Dashboard (personal positions)
app.use('/api/bridge', bridgeRoutes);  // Avail Nexus Bridge integration
app.use('/api', bridgeRoutes); // Also mount unified-balance at /api level
app.use('/api/strategy-ai', strategyAIRoutes);  // RAG-based strategy recommendations

// Enhanced V2 routes - 50+ protocol support (COMING SOON)
// Note: These routes require EnhancedDeFiService which is currently being optimized
// ETA: Available in next major release
// app.use('/api/v2/apy', enhancedApyRoutes(provider));
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
  console.log(`   🌉 Bridge: /api/bridge/* (Avail Nexus)`);
  console.log(`   💰 Unified Balance: /api/unified-balance/:address`);
  console.log(`   🧠 Strategy AI (RAG): /api/strategy-ai/* (NEW!)`);
  console.log(`   ⚡ Enhanced APY V2: /api/v2/apy/* (preparing)`);
  console.log(`   🤖 Enhanced AI V2: /api/v2/ai/* (preparing)`);
  // console.log(`   🔹 Legacy APY: /api/apy`);
  // console.log(`\n📈 Statistics:`);
  // console.log(`   📊 Total Protocols: ${stats.totalProtocols}`);
  // console.log(`   💰 Total TVL: $${(stats.totalTVL / 1e9).toFixed(2)}B`);
  // console.log(`   ✅ Audited Protocols: ${stats.auditedProtocols}`);
  console.log(`\n✨ Ready to accept requests!\n`);
});
