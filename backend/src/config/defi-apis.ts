// DeFi Protocol API Configuration
export const DEFI_API_CONFIG = {
  // Envio (HyperIndex / HyperSync)
  envio: {
    enabled: (process.env.ENVIO_ENABLED || 'true').toLowerCase() === 'true',
    hyperIndexUrl: process.env.ENVIO_HYPERINDEX_URL || 'https://api.envio.dev/v1',
    hyperSyncUrl: process.env.ENVIO_HYPERSYNC_URL || '',
  apiKey: process.env.ENVIO_API_KEY || process.env.ENVIO_HYPERSYNC_API_KEY || '',
    networkId: parseInt(process.env.ENVIO_NETWORK_ID || '1'),
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
