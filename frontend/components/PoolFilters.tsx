'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface PoolFiltersProps {
  onFilterChange: (filters: any) => void
  onSearch: (query: string) => void
}

export default function PoolFilters({ onFilterChange, onSearch }: PoolFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    asset: '',
    poolType: '',
    chain: '',
    minAPY: '',
    riskLevel: '',
    isLoopable: '',
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch(value)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({
      asset: '',
      poolType: '',
      chain: '',
      minAPY: '',
      riskLevel: '',
      isLoopable: '',
    })
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="glass-dark rounded-2xl p-6 border border-brown-200 dark:border-brown-700">
      {/* Search Bar */}
      <div className="flex gap-4 items-center mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-500 dark:text-brown-400" />
          <input
            type="text"
            placeholder="Search for pools, assets, or protocols..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 glass-dark border border-brown-300 dark:border-brown-600 rounded-xl focus:ring-2 focus:ring-brown-500 dark:focus:ring-purple-500 focus:border-transparent outline-none text-brown-900 dark:text-brown-100 placeholder-brown-500 dark:placeholder-brown-400"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
            showFilters || hasActiveFilters
              ? 'bg-gradient-to-r from-brown-600 to-purple-600 text-white shadow-lg'
              : 'glass-dark border border-brown-300 dark:border-brown-600 text-brown-700 dark:text-brown-300 hover:bg-brown-100 dark:hover:bg-brown-800'
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {Object.values(filters).filter((v) => v !== '').length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-4 border-t border-brown-200 dark:border-brown-700">
          {/* Asset Filter */}
          <div>
            <label className="block text-sm font-medium text-brown-700 dark:text-brown-300 mb-2">
              Asset Type
            </label>
            <select
              value={filters.asset}
              onChange={(e) => handleFilterChange('asset', e.target.value)}
              className="w-full px-3 py-2 glass-dark border border-brown-300 dark:border-brown-600 rounded-lg focus:ring-2 focus:ring-brown-500 dark:focus:ring-purple-500 outline-none text-brown-900 dark:text-brown-100"
            >
              <option value="">All Assets</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="DAI">DAI</option>
              <option value="ETH">ETH</option>
              <option value="WBTC">WBTC</option>
            </select>
          </div>

          {/* Pool Type Filter */}
          <div>
            <label className="block text-sm font-medium text-brown-700 dark:text-brown-300 mb-2">
              Pool Category
            </label>
            <select
              value={filters.poolType}
              onChange={(e) => handleFilterChange('poolType', e.target.value)}
              className="w-full px-3 py-2 glass-dark border border-brown-300 dark:border-brown-600 rounded-lg focus:ring-2 focus:ring-brown-500 dark:focus:ring-purple-500 outline-none text-brown-900 dark:text-brown-100"
            >
              <option value="">All Types</option>
              <option value="lending">Lending</option>
              <option value="staking">Staking</option>
              <option value="single">Single Asset</option>
              <option value="double">LP Pair</option>
            </select>
          </div>

          {/* Chain Filter */}
          <div>
            <label className="block text-sm font-medium text-brown-700 dark:text-brown-300 mb-2">
              Blockchain
            </label>
            <select
              value={filters.chain}
              onChange={(e) => handleFilterChange('chain', e.target.value)}
              className="w-full px-3 py-2 glass-dark border border-brown-300 dark:border-brown-600 rounded-lg focus:ring-2 focus:ring-brown-500 dark:focus:ring-purple-500 outline-none text-brown-900 dark:text-brown-100"
            >
              <option value="">All Chains</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
              <option value="base">Base</option>
            </select>
          </div>

          {/* Min APY Filter */}
          <div>
            <label className="block text-sm font-medium text-brown-700 dark:text-brown-300 mb-2">
              Minimum APY
            </label>
            <select
              value={filters.minAPY}
              onChange={(e) => handleFilterChange('minAPY', e.target.value)}
              className="w-full px-3 py-2 glass-dark border border-brown-300 dark:border-brown-600 rounded-lg focus:ring-2 focus:ring-brown-500 dark:focus:ring-purple-500 outline-none text-brown-900 dark:text-brown-100"
            >
              <option value="">Any APY</option>
              <option value="5">5%+</option>
              <option value="10">10%+</option>
              <option value="20">20%+</option>
              <option value="50">50%+</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="block text-sm font-medium text-brown-700 dark:text-brown-300 mb-2">
              Risk Profile
            </label>
            <select
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
              className="w-full px-3 py-2 glass-dark border border-brown-300 dark:border-brown-600 rounded-lg focus:ring-2 focus:ring-brown-500 dark:focus:ring-purple-500 outline-none text-brown-900 dark:text-brown-100"
            >
              <option value="">All Risks</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Loopable Filter */}
          <div>
            <label className="block text-sm font-medium text-brown-700 dark:text-brown-300 mb-2">
              Strategy Type
            </label>
            <select
              value={filters.isLoopable}
              onChange={(e) => handleFilterChange('isLoopable', e.target.value)}
              className="w-full px-3 py-2 glass-dark border border-brown-300 dark:border-brown-600 rounded-lg focus:ring-2 focus:ring-brown-500 dark:focus:ring-purple-500 outline-none text-brown-900 dark:text-brown-100"
            >
              <option value="">All Pools</option>
              <option value="true">Loopable Only</option>
              <option value="false">Non-Loopable</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-900/30 dark:to-orange-900/30 text-red-600 dark:text-red-400 rounded-lg hover:from-red-500/20 hover:to-orange-500/20 dark:hover:from-red-900/40 dark:hover:to-orange-900/40 transition-all flex items-center justify-center gap-2 border border-red-300 dark:border-red-700"
              >
                <XMarkIcon className="w-4 h-4" />
                <span className="font-medium">Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
