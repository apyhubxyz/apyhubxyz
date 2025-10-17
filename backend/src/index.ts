// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { apyRoutes } from './routes/apy';
import { DeFiService } from './services/DeFiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

// Initialize provider
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'
);

// Initialize DeFi service
const defiService = new DeFiService(provider);

// Root route - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'APY Hub API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      apy: {
        all: '/api/apy/all',
        byProtocol: '/api/apy/protocol/:protocol (compound, aave-v3, euler)',
        byToken: '/api/apy/token/:token (USDC, ETH, WETH, DAI)',
        compare: '/api/apy/compare/:token',
        historical: '/api/apy/historical/:protocol/:token?days=7'
      }
    },
    documentation: 'Visit the endpoints above to get DeFi APY data'
  });
});

// Routes
app.use('/api/apy', apyRoutes(defiService));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 APY Hub backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - GET /api/health`);
  console.log(`   - GET /api/apy/all`);
  console.log(`   - GET /api/apy/protocol/:protocol`);
  console.log(`   - GET /api/apy/token/:token`);
});