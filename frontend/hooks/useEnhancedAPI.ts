// frontend/hooks/useEnhancedAPI.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enhancedApiClient, EnhancedFilters, EnhancedPosition, YieldStrategy } from '@/lib/enhancedApi';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Enhanced Position Hooks
export function useEnhancedPositions(filters?: EnhancedFilters) {
  return useQuery({
    queryKey: ['enhanced-positions', filters],
    queryFn: () => enhancedApiClient.apy.getPositions(filters),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTopOpportunities(category?: string, minAPY: number = 10) {
  return useQuery({
    queryKey: ['opportunities', category, minAPY],
    queryFn: () => enhancedApiClient.apy.getOpportunities({ category, minAPY, limit: 20 }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLoopablePositions(chain?: string) {
  return useQuery({
    queryKey: ['loopable', chain],
    queryFn: () => enhancedApiClient.apy.getLoopable({ chain }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeltaNeutralStrategies() {
  return useQuery({
    queryKey: ['delta-neutral'],
    queryFn: () => enhancedApiClient.apy.getDeltaNeutral(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useProtocolStatistics() {
  return useQuery({
    queryKey: ['protocol-statistics'],
    queryFn: () => enhancedApiClient.apy.getStatistics(),
    staleTime: 5 * 60 * 1000,
  });
}

// AI Strategy Hooks
export function usePersonalizedStrategies(targetAPY?: number, riskTolerance: string = 'MEDIUM') {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['strategies', address, targetAPY, riskTolerance],
    queryFn: () => enhancedApiClient.apy.getStrategies(address!, { targetAPY, riskTolerance }),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAIRecommendations() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: {
      totalValue?: number;
      riskTolerance?: string;
      chains?: string[];
      query?: string;
    }) => enhancedApiClient.ai.recommend({
      walletAddress: address!,
      ...params
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-recommendation', address], data);
      toast.success('AI recommendation generated!');
    },
    onError: (error) => {
      toast.error('Failed to get AI recommendation');
    },
  });
}

export function useEnhancedAIChat(sessionId?: string) {
  const { address } = useAccount();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  
  const chatMutation = useMutation({
    mutationFn: (params: {
      message: string;
      chains?: string[];
      riskTolerance?: string;
    }) => enhancedApiClient.ai.chat({
      messages: [...messages, { role: 'user', content: params.message }],
      walletAddress: address,
      sessionId,
      chains: params.chains,
      riskTolerance: params.riskTolerance,
    }),
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: data.context?.lastMessage || '' },
        { role: 'assistant', content: data.response }
      ]);
    },
    onError: (error) => {
      toast.error('Failed to send message');
    },
  });
  
  return {
    messages,
    sendMessage: chatMutation.mutate,
    isLoading: chatMutation.isPending,
    error: chatMutation.error,
  };
}

export function useAIStrategies(filters?: { risk?: string; minAPY?: number; chain?: string }) {
  return useQuery({
    queryKey: ['ai-strategies', filters],
    queryFn: () => enhancedApiClient.ai.getStrategies(filters),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePortfolioAnalysis() {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['portfolio-analysis', address],
    queryFn: () => enhancedApiClient.ai.analyzePortfolio({
      walletAddress: address!,
      chains: ['ethereum', 'arbitrum', 'optimism', 'base']
    }),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}

// Bridge Hooks
export function useBridgeRoutes(params: {
  token: string;
  amount: number;
  fromChain: string;
  toChain: string;
}) {
  return useQuery({
    queryKey: ['bridge-routes', params],
    queryFn: () => enhancedApiClient.bridge.getRoutes(params),
    enabled: !!params.token && params.amount > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useExecuteBridge() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (route: any) => enhancedApiClient.bridge.executeBridge({
      route,
      walletAddress: address!
    }),
    onSuccess: (data) => {
      toast.success(`Bridge transaction submitted: ${data.txHash}`);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (error) => {
      toast.error('Bridge execution failed');
    },
  });
}

// WebSocket Hook for Real-time Updates
export function useWebSocket(channels: string[] = []) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  useEffect(() => {
    const websocket = enhancedApiClient.ws.connect((data) => {
      setLastMessage(data);
      
      // Handle different message types
      if (data.type === 'position_update') {
        // Invalidate position queries
        const queryClient = useQueryClient();
        queryClient.invalidateQueries({ queryKey: ['enhanced-positions'] });
      }
    });
    
    websocket.onopen = () => {
      setIsConnected(true);
      // Subscribe to channels
      channels.forEach(channel => {
        enhancedApiClient.ws.subscribe(websocket, channel);
      });
    };
    
    websocket.onclose = () => {
      setIsConnected(false);
    };
    
    setWs(websocket);
    
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        channels.forEach(channel => {
          enhancedApiClient.ws.unsubscribe(websocket, channel);
        });
        websocket.close();
      }
    };
  }, [channels.join(',')]);
  
  const subscribe = (channel: string) => {
    if (ws && isConnected) {
      enhancedApiClient.ws.subscribe(ws, channel);
    }
  };
  
  const unsubscribe = (channel: string) => {
    if (ws && isConnected) {
      enhancedApiClient.ws.unsubscribe(ws, channel);
    }
  };
  
  return {
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe,
  };
}

// Aggregated Data Hook
export function useAggregatedDeFiData(filters?: EnhancedFilters) {
  const positions = useEnhancedPositions(filters);
  const stats = useProtocolStatistics();
  const opportunities = useTopOpportunities();
  
  return {
    positions: positions.data || [],
    stats: stats.data,
    opportunities: opportunities.data || [],
    isLoading: positions.isLoading || stats.isLoading || opportunities.isLoading,
    error: positions.error || stats.error || opportunities.error,
  };
}

// Search Hook with Debouncing
export function useEnhancedSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  const searchResults = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => enhancedApiClient.apy.search({ 
      asset: debouncedQuery,
      minAPY: 0
    }),
    enabled: debouncedQuery.length > 2,
    staleTime: 60 * 1000,
  });
  
  return {
    query,
    setQuery,
    results: searchResults.data || [],
    isSearching: searchResults.isLoading,
    error: searchResults.error,
  };
}

export default {
  useEnhancedPositions,
  useTopOpportunities,
  useLoopablePositions,
  useDeltaNeutralStrategies,
  useProtocolStatistics,
  usePersonalizedStrategies,
  useAIRecommendations,
  useEnhancedAIChat,
  useAIStrategies,
  usePortfolioAnalysis,
  useBridgeRoutes,
  useExecuteBridge,
  useWebSocket,
  useAggregatedDeFiData,
  useEnhancedSearch,
};