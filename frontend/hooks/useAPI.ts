// frontend/hooks/useAPI.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, PoolFilters } from '@/lib/api'
import toast from 'react-hot-toast'

// Pools
export function usePools(filters?: PoolFilters) {
  return useQuery({
    queryKey: ['pools', filters],
    queryFn: () => apiClient.pools.list(filters),
  })
}

export function usePool(id: string) {
  return useQuery({
    queryKey: ['pool', id],
    queryFn: () => apiClient.pools.getById(id),
    enabled: !!id,
  })
}

export function useTopPools(limit: number = 10) {
  return useQuery({
    queryKey: ['pools', 'top', limit],
    queryFn: () => apiClient.pools.getTop(limit),
  })
}

export function usePoolSearch(query: string) {
  return useQuery({
    queryKey: ['pools', 'search', query],
    queryFn: () => apiClient.pools.search(query),
    enabled: query.length > 2,
  })
}

export function usePoolStats() {
  return useQuery({
    queryKey: ['pools', 'stats'],
    queryFn: () => apiClient.pools.getStats(),
  })
}

// Protocols
export function useProtocols(params?: { chain?: string; active?: boolean }) {
  return useQuery({
    queryKey: ['protocols', params],
    queryFn: () => apiClient.protocols.list(params),
  })
}

export function useProtocol(slug: string) {
  return useQuery({
    queryKey: ['protocol', slug],
    queryFn: () => apiClient.protocols.getBySlug(slug),
    enabled: !!slug,
  })
}

// Portfolio
export function usePortfolio(address?: string) {
  return useQuery({
    queryKey: ['portfolio', address],
    queryFn: () => apiClient.portfolio.get(address!),
    enabled: !!address,
  })
}

export function useWatchlist(address?: string) {
  return useQuery({
    queryKey: ['watchlist', address],
    queryFn: () => apiClient.portfolio.getWatchlist(address!),
    enabled: !!address,
  })
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ address, poolId, notes }: { address: string; poolId: string; notes?: string }) =>
      apiClient.portfolio.addToWatchlist(address, { poolId, notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', variables.address] })
      toast.success('Added to watchlist!')
    },
    onError: () => {
      toast.error('Failed to add to watchlist')
    },
  })
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ address, poolId }: { address: string; poolId: string }) =>
      apiClient.portfolio.removeFromWatchlist(address, poolId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', variables.address] })
      toast.success('Removed from watchlist')
    },
    onError: () => {
      toast.error('Failed to remove from watchlist')
    },
  })
}

export function useAddPosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      address,
      poolId,
      amount,
      amountUSD,
    }: {
      address: string
      poolId: string
      amount: number
      amountUSD?: number
    }) => apiClient.portfolio.addPosition(address, { poolId, amount, amountUSD }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', variables.address] })
      toast.success('Position added!')
    },
    onError: () => {
      toast.error('Failed to add position')
    },
  })
}

export function useRemovePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ address, poolId }: { address: string; poolId: string }) =>
      apiClient.portfolio.removePosition(address, poolId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', variables.address] })
      toast.success('Position removed')
    },
    onError: () => {
      toast.error('Failed to remove position')
    },
  })
}

// AI
export function useAIChat() {
  return useMutation({
    mutationFn: apiClient.ai.chat,
  })
}

export function useAISuggest() {
  return useMutation({
    mutationFn: apiClient.ai.suggest,
  })
}
