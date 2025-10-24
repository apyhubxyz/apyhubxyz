// DeFi Protocol API Configuration
export const DEFI_API_CONFIG = {
  // Envio (HyperIndex / HyperSync) - Updated for mainnet RPC fallback
  envio: {
    enabled: (process.env.ENVIO_ENABLED || 'true').toLowerCase() === 'true',
    hyperIndexUrl: process.env.ENVIO_HYPERINDEX_URL || 'https://eth-mainnet.g.alchemy.com/v2/Qb1HjrRk7epyN-yl1MjjcZRx1r3CmSHj',  // Using mainnet RPC (no HyperSync for mainnet yet)
    hyperSyncUrl: process.env.ENVIO_HYPERSYNC_URL || 'https://sepolia.hypersync.xyz/',  // Testnet fallback
    apiKey: process.env.ENVIO_API_KEY || process.env.ENVIO_HYPERSYNC_API_KEY || '',
    networkId: parseInt(process.env.ENVIO_NETWORK_ID || '1'),  // Ethereum mainnet
    cacheTTL: parseInt(process.env.ENVIO_CACHE_TTL || '300'),
  },
  
  // Rate limiting configuration
  rateLimit: {
    requestsPerMinute: parseInt(process.env.API_RATE_LIMIT || '60'),
    concurrentRequests: parseInt(process.env.API_CONCURRENT_REQUESTS || '3'),
  },
  
  // Timeout configuration
  timeout: parseInt(process.env.API_TIMEOUT || '10000'),
};
// Non-Envio protocol configs removed (Envio-only)
