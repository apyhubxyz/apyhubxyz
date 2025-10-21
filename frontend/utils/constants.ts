// App constants - probably should move some of these to env vars
export const APP_NAME = 'Apyhub'
export const APP_DOMAIN = 'apyhub.xyz'

// API endpoints (using mock for now)
export const API_ENDPOINTS = {
  protocols: '/api/protocols',
  apy: '/api/apy',
  stats: '/api/stats',
  subscribe: '/api/subscribe',
}

// Refresh intervals in ms
export const REFRESH_INTERVALS = {
  APY_DATA: 30000, // 30 seconds
  STATS: 60000, // 1 minute
  PROTOCOLS: 300000, // 5 minutes
}

// Supported chains - expand this list as we add more
export const SUPPORTED_CHAINS = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
  },
  BSC: {
    id: 56,
    name: 'BSC',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
  },
}

// Social links
export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/apyhub',
  discord: 'https://discord.gg/apyhub',
  telegram: 'https://t.me/apyhub',
  github: 'https://github.com/apyhub',
  medium: 'https://medium.com/@apyhub',
}

// Meta tags for SEO
export const META_TAGS = {
  title: 'Apyhub - Maximize Your DeFi Yields',
  description: 'Discover the best APY rates across DeFi protocols. Real-time data, comprehensive analytics, and automated yield optimization.',
  keywords: 'DeFi, APY, yield farming, cryptocurrency, blockchain, staking, liquidity mining',
  ogImage: '/og-image.png', // need to add this image
}