// DeFi Protocol API Configuration
export const DEFI_API_CONFIG = {
  aave: {
    subgraphUrl: process.env.AAVE_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
    apiKey: process.env.AAVE_API_KEY,
  },
  compound: {
    apiUrl: process.env.COMPOUND_API_URL || 'https://api.compound.finance/api/v2',
    apiKey: process.env.COMPOUND_API_KEY,
  },
  yearn: {
    apiUrl: process.env.YEARN_API_URL || 'https://api.yearn.fi/v1/chains/1/vaults/all',
    apiKey: process.env.YEARN_API_KEY,
  },
  curve: {
    apiUrl: process.env.CURVE_API_URL || 'https://api.curve.fi/api/getPools/ethereum/main',
    apiKey: process.env.CURVE_API_KEY,
  },
  pendle: {
    apiUrl: process.env.PENDLE_API_URL || 'https://api-v2.pendle.finance/core/v1',
    apiKey: process.env.PENDLE_API_KEY,
  },
  beefy: {
    vaultsUrl: process.env.BEEFY_VAULTS_URL || 'https://api.beefy.finance/vaults',
    apyUrl: process.env.BEEFY_APY_URL || 'https://api.beefy.finance/apy',
    apiKey: process.env.BEEFY_API_KEY,
  },
  silo: {
    apiUrl: process.env.SILO_API_URL || 'https://api.silo.finance/v1/markets',
    apiKey: process.env.SILO_API_KEY,
  },
  euler: {
    subgraphUrl: process.env.EULER_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/euler-xyz/euler-mainnet',
    apiKey: process.env.EULER_API_KEY,
  },
  morpho: {
    subgraphUrl: process.env.MORPHO_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/morpho-labs/morpho-v1',
    apiKey: process.env.MORPHO_API_KEY,
  },
  fluid: {
    apiUrl: process.env.FLUID_API_URL || 'https://api.fluid.io/v1/pools',
    apiKey: process.env.FLUID_API_KEY,
  },
  
  // Rate limiting configuration
  rateLimit: {
    requestsPerMinute: parseInt(process.env.API_RATE_LIMIT || '60'),
    concurrentRequests: parseInt(process.env.API_CONCURRENT_REQUESTS || '3'),
  },
  
  // Timeout configuration
  timeout: parseInt(process.env.API_TIMEOUT || '10000'),
};

// Helper function to get headers with API key
export function getApiHeaders(protocol: keyof typeof DEFI_API_CONFIG): Record<string, string> {
  const config = DEFI_API_CONFIG[protocol as keyof typeof DEFI_API_CONFIG];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (config && typeof config === 'object' && 'apiKey' in config && config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    // Some APIs use different header names
    headers['X-API-Key'] = config.apiKey;
    headers['api-key'] = config.apiKey;
  }
  
  return headers;
}
