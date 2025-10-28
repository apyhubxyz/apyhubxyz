// frontend/lib/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ error?: string }>) => {
    // Handle errors
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Types
export interface Pool {
  id: string;
  name: string;
  asset: string;
  assetAddress?: string;
  poolAddress: string;
  poolType: string;
  isLoopable: boolean;
  supplyAPY: number;
  borrowAPY?: number;
  rewardAPY?: number;
  totalAPY: number;
  tvl: number;
  availableLiquidity?: number;
  utilizationRate?: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore?: number;
  minDeposit?: number;
  lockPeriod?: number;
  active: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  protocol?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    chain: string;
    audited: boolean;
    website?: string;
  };
  historicalData?: HistoricalAPY[];
}

export interface HistoricalAPY {
  id: string;
  supplyAPY: number;
  borrowAPY?: number;
  totalAPY: number;
  tvl: number;
  timestamp: string;
}

export interface Protocol {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo?: string;
  chain: string;
  audited: boolean;
  auditedBy?: string;
  tvl: number;
  active: boolean;
  pools?: Pool[];
}

export interface UserPosition {
  id: string;
  pool: {
    id: string;
    name: string;
    asset: string;
    poolAddress: string;
    protocol: {
      name: string;
      logo?: string;
      chain: string;
    };
  };
  amount: string;
  amountUSD: number;
  entryAPY: number;
  currentAPY: number;
  earnings: string;
  earningsUSD: number;
  startDate: string;
  lastUpdated: string;
}

export interface Portfolio {
  user: {
    walletAddress: string;
    ens?: string;
  };
  portfolio: {
    totalValue: number;
    totalEarnings: number;
    weightedAPY: number;
    positionCount: number;
  };
  positions: UserPosition[];
}

export interface PoolFilters {
  asset?: string;
  poolType?: 'single' | 'double' | 'lending' | 'staking';
  isLoopable?: boolean;
  protocolId?: string;
  chain?: string;
  minAPY?: number;
  maxAPY?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// API Client
export const apiClient = {
  // Protocols
  protocols: {
    list: async (params?: { chain?: string; active?: boolean }): Promise<Protocol[]> => {
      return api.get('/protocols', { params }) as Promise<Protocol[]>;
    },
    getBySlug: async (slug: string): Promise<Protocol> => {
      return api.get(`/protocols/${slug}`) as Promise<Protocol>;
    },
    getPools: async (slug: string): Promise<Pool[]> => {
      return api.get(`/protocols/${slug}/pools`) as Promise<Pool[]>;
    },
    getStats: async (slug: string): Promise<any> => {
      return api.get(`/protocols/${slug}/stats`);
    },
  },

  // Pools
  pools: {
    list: async (filters?: PoolFilters): Promise<{ pools: Pool[]; pagination: any }> => {
      return api.get('/pools', { params: filters }) as Promise<{ pools: Pool[]; pagination: any }>;
    },
    getById: async (id: string): Promise<Pool> => {
      const response: any = await api.get(`/pools/${id}`);
      return response.data || response;
    },
    getTop: async (limit: number = 10): Promise<Pool[]> => {
      const response: any = await api.get(`/pools/top/${limit}`);
      // Response interceptor already returns response.data, so check for nested data
      return response.data || response || [];
    },
    search: async (query: string): Promise<Pool[]> => {
      const response: any = await api.get(`/pools/search/${query}`);
      return response.data || response || [];
    },
    getStats: async (): Promise<any> => {
      return api.get('/pools/stats/overview');
    },
    getSimilar: async (id: string): Promise<Pool[]> => {
      return api.get(`/pools/${id}/similar`) as Promise<Pool[]>;
    },
  },

  // Portfolio
  portfolio: {
    get: async (address: string): Promise<Portfolio> => {
      return api.get(`/portfolio/${address}`) as Promise<Portfolio>;
    },
    addPosition: async (address: string, data: { poolId: string; amount: number; amountUSD?: number }): Promise<any> => {
      return api.post(`/portfolio/${address}/positions`, data);
    },
    removePosition: async (address: string, poolId: string): Promise<any> => {
      return api.delete(`/portfolio/${address}/positions/${poolId}`);
    },
    getWatchlist: async (address: string): Promise<any> => {
      return api.get(`/portfolio/${address}/watchlist`);
    },
    addToWatchlist: async (address: string, data: { poolId: string; notes?: string }): Promise<any> => {
      return api.post(`/portfolio/${address}/watchlist`, data);
    },
    removeFromWatchlist: async (address: string, poolId: string): Promise<any> => {
      return api.delete(`/portfolio/${address}/watchlist/${poolId}`);
    },
    getSuggestions: async (address: string, riskTolerance?: string): Promise<any> => {
      return api.get(`/portfolio/${address}/suggestions`, { params: { riskTolerance } });
    },
  },

  // AI Chat
  ai: {
    chat: async (data: {
      messages: Array<{ role: string; content: string }>;
      walletAddress?: string;
      sessionId?: string;
    }): Promise<any> => {
      return api.post('/ai/chat', data);
    },
    suggest: async (data: { walletAddress: string; assets?: string[] }): Promise<any> => {
      return api.post('/ai/suggest', data);
    },
    getHistory: async (sessionId: string): Promise<any> => {
      return api.get(`/ai/chat/history/${sessionId}`);
    },
  },

  // Bridge API
  bridge: {
    getRoutes: async (params: {
      fromChain: string;
      toChain: string;
      token: string;
      amount: string;
      recipient: string;
    }): Promise<any> => {
      return api.get('/bridge/routes', { params });
    },
    
    getQuote: async (data: {
      fromChain: string;
      toChain: string;
      token: string;
      amount: string;
      recipient: string;
    }): Promise<any> => {
      return api.post('/bridge/quote', data);
    },
    
    execute: async (data: {
      fromChain: number;
      toChain: number;
      token: string;
      amount: string;
      recipient: string;
      mode: 'bridge' | 'bridge-execute';
      executeAction?: 'swap' | 'deposit' | 'stake';
    }): Promise<any> => {
      return api.post('/bridge/execute', data);
    },
    
    getStatus: async (bridgeId: string): Promise<any> => {
      return api.get(`/bridge/status/${bridgeId}`);
    },
    
    getHistory: async (address: string): Promise<any> => {
      return api.get(`/bridge/history/${address}`);
    },
    
    getUnifiedBalance: async (address: string): Promise<any> => {
      return api.get(`/bridge/unified-balance/${address}`);
    },
    
    getAnalytics: async (): Promise<any> => {
      return api.get('/bridge/analytics');
    },
    
    optimize: async (data: {
      operations: any[];
      chain: string;
    }): Promise<any> => {
      return api.post('/bridge/optimize', data);
    },
  },

  // NEW: LP Opportunities (Pools Page - Discovery Mode)
  positions: {
    /**
     * Get ALL available LP opportunities across 1000+ protocols
     * Use this for Pools page (no wallet required)
     */
    getAllOpportunities: async (filters?: {
      protocol?: string;
      chainId?: number;
      minAPY?: number;
      minTVL?: number;
      search?: string;
      limit?: number;
    }): Promise<any> => {
      return api.get('/positions', { params: filters });
    },
    getStats: async (): Promise<any> => {
      return api.get('/positions/stats');
    },
  },

  // NEW: Dashboard (Personal Positions After Wallet Connect)
  dashboard: {
    /**
     * Get YOUR actual positions from blockchain
     * Use this for Dashboard/Portfolio page (requires wallet address)
     */
    getMyPositions: async (address: string): Promise<any> => {
      return api.get(`/dashboard/${address}`);
    },
    getSummary: async (address: string): Promise<any> => {
      return api.get(`/dashboard/${address}/summary`);
    },
  },

  // Health
  health: async (): Promise<any> => {
    return api.get('/health');
  },
};

export default apiClient;
