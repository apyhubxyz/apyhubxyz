'use client'

import { Pool } from '@/lib/api'
import Link from 'next/link'
import { ArrowTrendingUpIcon, ShieldCheckIcon } from '@heroicons/react/24/solid'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { SearchIcon } from '@/components/CustomIcons'

interface PoolsTableProps {
  pools: Pool[]
  loading?: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (field: string) => void
}

export default function PoolsTable({ pools, loading, sortBy, sortOrder, onSort }: PoolsTableProps) {
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

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ChevronUpIcon className="w-4 h-4 opacity-30" />
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    )
  }

  if (loading) {
    return (
      <div className="glass-dark rounded-2xl p-6 border border-brown-200 dark:border-brown-700">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-brown-200 dark:bg-brown-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!pools || pools.length === 0) {
    return (
      <div className="glass-dark rounded-2xl p-12 border border-brown-200 dark:border-brown-700 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-brown-200 to-purple-200 dark:from-brown-700 dark:to-purple-700 flex items-center justify-center">
          <SearchIcon className="w-10 h-10 text-brown-700 dark:text-brown-200" />
        </div>
        <p className="text-brown-700 dark:text-brown-300 text-lg">No pools found matching your criteria.</p>
        <p className="text-brown-600 dark:text-brown-400 text-sm mt-2">Try adjusting your filters or search terms</p>
      </div>
    )
  }

  return (
    <div className="glass-dark rounded-2xl border border-brown-200 dark:border-brown-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-brown-50/50 dark:bg-brown-900/30 border-b border-brown-200 dark:border-brown-700">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => onSort('name')}
                  className="flex items-center gap-2 font-semibold text-brown-700 dark:text-brown-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Pool
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => onSort('asset')}
                  className="flex items-center gap-2 font-semibold text-brown-700 dark:text-brown-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Asset
                  <SortIcon field="asset" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => onSort('totalAPY')}
                  className="flex items-center gap-2 font-semibold text-brown-700 dark:text-brown-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  APY
                  <SortIcon field="totalAPY" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => onSort('tvl')}
                  className="flex items-center gap-2 font-semibold text-brown-700 dark:text-brown-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  TVL
                  <SortIcon field="tvl" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => onSort('riskLevel')}
                  className="flex items-center gap-2 font-semibold text-brown-700 dark:text-brown-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Risk
                  <SortIcon field="riskLevel" />
                </button>
              </th>
              <th className="px-6 py-4 text-left font-semibold text-brown-700 dark:text-brown-300">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-200 dark:divide-brown-700">
            {pools.map((pool) => (
              <tr
                key={pool.id}
                className="hover:bg-brown-50/50 dark:hover:bg-brown-900/20 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <Link href={`/pool/${pool.id}`} className="block group">
                    <div>
                      <div className="font-semibold text-brown-900 dark:text-brown-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {pool.name}
                      </div>
                      <div className="text-sm text-brown-600 dark:text-brown-400 flex items-center gap-1">
                        {pool.protocol?.name || 'Unknown Protocol'}
                        {pool.verified && (
                          <ShieldCheckIcon className="w-4 h-4 text-blue-500" title="Verified" />
                        )}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-brown-900 dark:text-brown-100">{pool.asset}</span>
                    {pool.protocol?.chain && (
                      <span className="text-xs text-brown-500 dark:text-brown-400 uppercase bg-brown-100 dark:bg-brown-800 px-2 py-0.5 rounded">
                        {pool.protocol.chain}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {pool.totalAPY.toFixed(2)}%
                    </span>
                  </div>
                  {pool.rewardAPY && pool.rewardAPY > 0 && (
                    <div className="text-xs text-brown-500 dark:text-brown-400">
                      +{pool.rewardAPY.toFixed(2)}% rewards
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-brown-900 dark:text-brown-100">{formatCurrency(pool.tvl)}</div>
                  {pool.utilizationRate && (
                    <div className="text-xs text-brown-500 dark:text-brown-400">
                      {pool.utilizationRate.toFixed(0)}% utilized
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase ${getRiskColor(
                      pool.riskLevel
                    )}`}
                  >
                    {pool.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <span className="inline-flex px-2 py-1 bg-brown-100 dark:bg-brown-800 text-brown-700 dark:text-brown-300 rounded text-xs font-medium uppercase">
                      {pool.poolType}
                    </span>
                    {pool.isLoopable && (
                      <span className="inline-flex px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                        Loopable
                      </span>
                    )}
                    {pool.protocol?.audited && (
                      <span className="inline-flex px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                        Audited
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
