'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import apiClient, { PoolFilters as PoolFiltersType } from '@/lib/api'
import PoolFilters from '@/components/PoolFilters'
import PoolsTable from '@/components/PoolsTable'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'
import { PoolIcon, ChartIcon, VaultIcon, LoopIcon } from '@/components/CustomIcons'

export default function PoolsPage() {
  const [filters, setFilters] = useState<PoolFiltersType>({
    sortBy: 'totalAPY',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch ALL LP opportunities (discovery mode) - REAL data from 1000+ protocols
  const { data: poolsResponse, isLoading, error } = useQuery({
    queryKey: ['all-opportunities', filters, debouncedSearch],
    queryFn: async () => {
      // Use NEW positions endpoint for discovery
      const result = await apiClient.positions.getAllOpportunities({
        minAPY: filters.minAPY,
        minTVL: 1000000,  // $1M minimum
        search: debouncedSearch || undefined,
        limit: filters.limit || 50,
      })
      return result.data || []
    },
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes (data is cached on backend)
  })

  // Ensure data is always an array
  const data = Array.isArray(poolsResponse) ? poolsResponse : []

  useEffect(() => {
    if (error) {
      toast.error('Failed to load pools. Please try again.')
    }
  }, [error])

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Convert filter values to proper types
      minAPY: newFilters.minAPY ? Number(newFilters.minAPY) : undefined,
      isLoopable: newFilters.isLoopable ? newFilters.isLoopable === 'true' : undefined,
      page: 1, // Reset to first page on filter change
    }))
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleSort = useCallback((field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }))
  }, [])

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brown-600 dark:text-brown-400 hover:text-brown-800 dark:hover:text-brown-200 mb-8 transition-all duration-300 group"
        >
          <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back to Home</span>
        </Link>

        {/* Page Header with animated gradient */}
        <div className="mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-brown-800 via-purple-600 to-brown-800 dark:from-brown-200 dark:via-purple-400 dark:to-brown-200 bg-clip-text text-transparent mb-4 animate-[shine_3s_linear_infinite] bg-[length:200%_auto]">
            Discover Yield Opportunities
          </h1>
          <p className="text-lg text-brown-700 dark:text-brown-300 max-w-3xl leading-relaxed">
            Navigate through curated DeFi pools with real-time APY data. We've simplified the complex world of yield farming for you.
          </p>
        </div>

        {/* Stats Cards with glassmorphism and better theming */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Total Pools Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-brown-400 dark:from-purple-600 dark:to-brown-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
            <div className="relative glass-dark rounded-2xl p-6 transform transition-transform duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-brown-700 dark:text-brown-300 font-medium">Active Pools</div>
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 dark:bg-purple-400/20 flex items-center justify-center">
                  <PoolIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-brown-900 dark:text-brown-100">{data?.length || 0}</div>
              <div className="text-xs text-brown-600 dark:text-brown-400 mt-1">Available for farming</div>
            </div>
          </div>

          {/* Average APY Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 dark:from-green-600 dark:to-emerald-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
            <div className="relative glass-dark rounded-2xl p-6 transform transition-transform duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-brown-700 dark:text-brown-300 font-medium">Average Yield</div>
                <div className="w-8 h-8 rounded-lg bg-green-500/20 dark:bg-green-400/20 flex items-center justify-center">
                  <ChartIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-brown-900 dark:text-brown-100">
                {data && data.length > 0
                  ? (data.reduce((sum: number, p: any) => sum + (p.totalAPY || 0), 0) / data.length).toFixed(1)
                  : '0.0'}%
              </div>
              <div className="text-xs text-brown-600 dark:text-brown-400 mt-1">Across all pools</div>
            </div>
          </div>

          {/* Total TVL Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 dark:from-blue-600 dark:to-cyan-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
            <div className="relative glass-dark rounded-2xl p-6 transform transition-transform duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-brown-700 dark:text-brown-300 font-medium">Total Locked</div>
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 dark:bg-blue-400/20 flex items-center justify-center">
                  <VaultIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-brown-900 dark:text-brown-100">
                {data && data.length > 0
                  ? `$${(data.reduce((sum: number, p: any) => sum + (p.tvl || 0), 0) / 1e9).toFixed(1)}B`
                  : '$0'}
              </div>
              <div className="text-xs text-brown-600 dark:text-brown-400 mt-1">Total value secured</div>
            </div>
          </div>

          {/* Loopable Pools Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 dark:from-orange-600 dark:to-amber-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
            <div className="relative glass-dark rounded-2xl p-6 transform transition-transform duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-brown-700 dark:text-brown-300 font-medium">Loop Ready</div>
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 dark:bg-orange-400/20 flex items-center justify-center">
                  <LoopIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-brown-900 dark:text-brown-100">
                {data?.filter((p: any) => p.isLoopable).length || 0}
              </div>
              <div className="text-xs text-brown-600 dark:text-brown-400 mt-1">Enhanced strategies</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <PoolFilters onFilterChange={handleFilterChange} onSearch={handleSearch} />
        </div>

        {/* Pools Table */}
        <PoolsTable
          pools={data || []}
          loading={isLoading}
          sortBy={filters.sortBy || 'totalAPY'}
          sortOrder={filters.sortOrder || 'desc'}
          onSort={handleSort}
        />

        {/* Pagination */}
        {data && data.length >= (filters.limit || 20) && (
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              disabled={filters.page === 1}
              className="px-6 py-3 glass-dark border border-brown-300 dark:border-brown-600 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brown-50 dark:hover:bg-brown-900/30 transition-all duration-300 text-brown-700 dark:text-brown-300"
            >
              Previous
            </button>
            <div className="flex items-center px-4 text-brown-700 dark:text-brown-300 font-medium">
              Page <span className="mx-2 px-3 py-1 glass-dark rounded-lg font-bold text-brown-900 dark:text-brown-100">{filters.page || 1}</span>
            </div>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              className="px-6 py-3 glass-dark border border-brown-300 dark:border-brown-600 rounded-xl font-medium hover:bg-brown-50 dark:hover:bg-brown-900/30 transition-all duration-300 text-brown-700 dark:text-brown-300"
            >
              Next
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
