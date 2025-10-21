// frontend/lib/enhancedApi.ts
import axios, { AxiosInstance } from 'axios';

// Enhanced API Configuration for V2 endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance for V2 API
const enhancedApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
enhancedApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Enhanced API Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced Types
export interface EnhancedPosition {
  poolAddress: string;
  protocolId: string;
  protocolName: string;
  poolName: string;
  poolType: string;
  chain: string;
  assets: string[];
  apy: number;
  tvlUsd: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  riskScore: number;
  isLoopable?: boolean;
  maxLeverage?: number;
  ilRisk?: number;
  volume24h?: number;
  fees24h?: number;
  lastUpdated: Date;
  rank?: number;
  score?: number;
}

export interface YieldStrategy {
  id: string;
  name: string;
  description: string;
  expectedAPY: number;
  riskLevel: string;
  requiredCapital: number;
  steps: any[];
  gasEstimate: number;
  ilRisk: number;
}

export interface BridgeRoute {
  bridge: string;
  sourceChain: string;
  targetChain: string;
  token: string;
  amount: number;
  estimatedTime: number;
  estimatedGas: number;
  estimatedFees: number;
  route: any[];
}

export interface AIRecommendation {
  strategy: string;
  description: string;
  expectedAPY: number;
  risk: string;
  protocols: string[];
  steps: string[];
  bridgeRoute?: BridgeRoute;
  gasEstimate?: number;
}

export interface EnhancedFilters {
  chains?: string[];
  protocols?: string[];
  minAPY?: number;
  maxAPY?: number;
  minTVL?: number;
  riskLevels?: string[];
  poolTypes?: string[];
  isLoopable?: boolean;
  assets?: string[];
  sortBy?: 'apy' | 'tvl' | 'risk' | 'volume';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Enhanced API Client
export const enhancedApiClient = {
  // V2 APY Endpoints
  apy: {
    // Get aggregated positions from 50+ protocols
    getPositions: async (filters?: EnhancedFilters): Promise<EnhancedPosition[]> => {
      return enhancedApi.get('/v2/apy/positions', { params: filters });
    },
    
    // Get personalized yield strategies
    getStrategies: async (address: string, params?: {
      targetAPY?: number;
      riskTolerance?: string;
    }): Promise<YieldStrategy[]> => {
      return enhancedApi.get(`/v2/apy/strategies/${address}`, { params });
    },
    
    // Get top opportunities
    getOpportunities: async (params?: {
      category?: string;
      minAPY?: number;
      limit?: number;
    }): Promise<EnhancedPosition[]> => {
      return enhancedApi.get('/v2/apy/opportunities', { params });
    },
    
    // Get loopable positions
    getLoopable: async (params?: {
      minLeverage?: number;
      chain?: string;
    }): Promise<EnhancedPosition[]> => {
      return enhancedApi.get('/v2/apy/loopable', { params });
    },
    
    // Get delta-neutral strategies
    getDeltaNeutral: async (): Promise<YieldStrategy[]> => {
      return enhancedApi.get('/v2/apy/delta-neutral');
    },
    
    // Search across all protocols
    search: async (params: {
      asset?: string;
      minAPY?: number;
      protocol?: string;
    }): Promise<EnhancedPosition[]> => {
      return enhancedApi.get('/v2/apy/search', { params });
    },
    
    // Get aggregated statistics
    getStatistics: async (): Promise<{
      totalProtocols: number;
      totalTVL: number;
      averageAPY: number;
      topProtocols: any[];
      chainDistribution: any;
    }> => {
      return enhancedApi.get('/v2/apy/statistics');
    }
  },
  
  // V2 AI Endpoints
  ai: {
    // Enhanced chat with Grok and RAG
    chat: async (data: {
      messages: Array<{ role: string; content: string }>;
      walletAddress?: string;
      sessionId?: string;
      chains?: string[];
      riskTolerance?: string;
    }): Promise<{
      response: string;
      sessionId: string;
      context?: any;
    }> => {
      return enhancedApi.post('/v2/ai/chat', data);
    },
    
    // Get personalized recommendations
    recommend: async (data: {
      walletAddress: string;
      totalValue?: number;
      riskTolerance?: string;
      chains?: string[];
      query?: string;
    }): Promise<{
      recommendation: AIRecommendation;
      userContext: any;
    }> => {
      return enhancedApi.post('/v2/ai/recommend', data);
    },
    
    // Get available strategies
    getStrategies: async (params?: {
      risk?: string;
      minAPY?: number;
      chain?: string;
    }): Promise<{
      strategies: Array<{
        id: string;
        name: string;
        description: string;
        expectedAPY: string;
        risk: string;
        minimumCapital: number;
        protocols: string[];
        chains: string[];
      }>;
      total: number;
    }> => {
      return enhancedApi.get('/v2/ai/strategies', { params });
    },
    
    // Analyze portfolio
    analyzePortfolio: async (data: {
      walletAddress: string;
      chains?: string[];
    }): Promise<{
      analysis: {
        totalValue: number;
        currentAPY: number;
        riskScore: number;
        diversificationScore: number;
        positions: any[];
        recommendations: any[];
        optimizedAPY: number;
        additionalYearlyEarnings: number;
      };
    }> => {
      return enhancedApi.post('/v2/ai/analyze-portfolio', data);
    },
    
    // Get session history
    getSession: async (sessionId: string): Promise<{
      session: {
        messages: any[];
        walletAddress?: string;
        timestamp: number;
      };
    }> => {
      return enhancedApi.get(`/v2/ai/session/${sessionId}`);
    }
  },
  
  // Bridge endpoints
  bridge: {
    // Get best bridge routes
    getRoutes: async (params: {
      token: string;
      amount: number;
      fromChain: string;
      toChain: string;
    }): Promise<BridgeRoute[]> => {
      return enhancedApi.get('/v2/bridge/routes', { params });
    },
    
    // Execute bridge transaction
    executeBridge: async (data: {
      route: BridgeRoute;
      walletAddress: string;
    }): Promise<{
      txHash: string;
      status: string;
    }> => {
      return enhancedApi.post('/v2/bridge/execute', data);
    }
  },
  
  // WebSocket connection for real-time updates
  ws: {
    connect: (onMessage: (data: any) => void): WebSocket => {
      const ws = new WebSocket('ws://localhost:3001/ws');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      return ws;
    },
    
    subscribe: (ws: WebSocket, channel: string, params?: any) => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel,
        params
      }));
    },
    
    unsubscribe: (ws: WebSocket, channel: string) => {
      ws.send(JSON.stringify({
        type: 'unsubscribe',
        channel
      }));
    }
  }
};

export default enhancedApiClient;