'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, ShieldCheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid'
import apiClient from '@/lib/api'
import APYChart from '@/components/APYChart'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

export default function PoolDetailPage({ params }: { params: { id: string } }) {
   const { id } = params

  const { data: pool, isLoading, error } = useQuery({
    queryKey: ['pool', id],
    queryFn: () => apiClient.pools.getById(id),
    refetchOnWindowFocus: false,
  })

  const { data: similarPools } = useQuery({
    queryKey: ['similarPools', id],
    queryFn: () => apiClient.pools.getSimilar(id),
    enabled: !!pool,
    refetchOnWindowFocus: false,
  })

  if (error) {
    toast.error('Failed to load pool details')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Pool Not Found</h1>
            <Link href="/pools" className="text-purple-600 hover:text-purple-700">
              Back to Pools
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <Link
          href="/pools"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-8 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Pools
        </Link>

        {/* Pool Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{pool.name}</h1>
                {pool.verified && <ShieldCheckIcon className="w-8 h-8 text-blue-300" title="Verified" />}
              </div>
              <div className="flex items-center gap-4 text-purple-200">
                <span className="text-lg">{pool.protocol?.name}</span>
                <span>•</span>
                <span className="uppercase">{pool.protocol?.chain}</span>
                <span>•</span>
                <span className="capitalize">{pool.poolType}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-8 h-8" />
                <span className="text-5xl font-bold">{pool.totalAPY.toFixed(2)}%</span>
              </div>
              <span className="text-purple-200">Total APY</span>
              {pool.protocol?.website && (
                <a
                  href={pool.protocol.website.startsWith('http') ? pool.protocol.website : `https://${pool.protocol.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
                >
                  <GlobeAltIcon className="w-4 h-4" />
                  Visit Protocol
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Supply APY</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {pool.supplyAPY.toFixed(2)}%
            </div>
          </div>

          {pool.borrowAPY && (
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Borrow APY</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {pool.borrowAPY.toFixed(2)}%
              </div>
            </div>
          )}

          {pool.rewardAPY && pool.rewardAPY > 0 && (
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reward APY</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {pool.rewardAPY.toFixed(2)}%
              </div>
            </div>
          )}

          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Value Locked</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(pool.tvl)}
            </div>
          </div>

          {pool.availableLiquidity && (
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Liquidity</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(pool.availableLiquidity)}
              </div>
            </div>
          )}

          {pool.utilizationRate !== undefined && (
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Utilization Rate</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {pool.utilizationRate.toFixed(2)}%
              </div>
            </div>
          )}

          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Risk Level</div>
            <div>
              <span className={`inline-flex px-4 py-2 rounded-full text-lg font-bold uppercase ${getRiskColor(pool.riskLevel)}`}>
                {pool.riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        {pool.historicalData && pool.historicalData.length > 0 && (
          <div className="mb-8">
            <APYChart data={pool.historicalData} showBorrowAPY={!!pool.borrowAPY} />
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pool Information */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pool Information</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Asset</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{pool.asset}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Pool Type</dt>
                <dd className="font-semibold text-gray-900 dark:text-white capitalize">{pool.poolType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Loopable</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">
                  {pool.isLoopable ? 'Yes' : 'No'}
                </dd>
              </div>
              {pool.minDeposit && (
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Min Deposit</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(pool.minDeposit)}
                  </dd>
                </div>
              )}
              {pool.lockPeriod && (
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Lock Period</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {pool.lockPeriod} days
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Pool Address</dt>
                <dd className="font-mono text-sm text-gray-900 dark:text-white">
                  {pool.poolAddress.slice(0, 6)}...{pool.poolAddress.slice(-4)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Protocol Information */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Protocol Information</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Protocol</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{pool.protocol?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Chain</dt>
                <dd className="font-semibold text-gray-900 dark:text-white uppercase">
                  {pool.protocol?.chain}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Audited</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">
                  {pool.protocol?.audited ? 'Yes' : 'No'}
                </dd>
              </div>
              {pool.protocol?.website && (
                <div className="flex justify-between items-center">
                  <dt className="text-gray-600 dark:text-gray-400">Website</dt>
                  <dd>
                    <a
                      href={pool.protocol.website.startsWith('http') ? pool.protocol.website : `https://${pool.protocol.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                    >
                      Visit Protocol Site
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Similar Pools */}
        {similarPools && similarPools.length > 0 && (
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Similar Pools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarPools.map((similarPool) => (
                <Link
                  key={similarPool.id}
                  href={`/pool/${similarPool.id}`}
                  className="block p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {similarPool.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {similarPool.protocol?.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {similarPool.totalAPY.toFixed(2)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
