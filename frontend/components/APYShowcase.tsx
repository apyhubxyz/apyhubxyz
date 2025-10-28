'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { FaEthereum } from 'react-icons/fa'
import { SiPolygon, SiBinance } from 'react-icons/si'
import apiClient from '@/lib/api'

const APYShowcase = () => {
  // Use the same positions endpoint that pools page uses for real data
  const { data: poolsResponse, isLoading, error } = useQuery({
    queryKey: ['topPositions'],
    queryFn: async () => {
      // Fetch real positions from DefiLlama via positions endpoint
      const response = await apiClient.positions.getAllOpportunities({
        minAPY: 50, // Get high APY pools (50%+)
        minTVL: 500000, // Minimum $500k TVL for quality
        limit: 30, // Get top 30 to have more options
      });
      // Sort by APY to ensure highest APY pools are first
      if (response?.data) {
        response.data.sort((a: any, b: any) => {
          const apyA = a.totalAPY || a.apy || a.supplyAPY || 0;
          const apyB = b.totalAPY || b.apy || b.supplyAPY || 0;
          return apyB - apyA; // Descending order
        });
      }
      return response;
    },
    refetchInterval: 60000, // Auto refresh every minute
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000, // Data considered fresh for 30 seconds
  })
  
  // Extract pools data from response
  const pools = poolsResponse?.data || []

  const getChainIcon = (chain: string) => {
    const chainName = chain?.toLowerCase() || 'ethereum'
    switch (chainName) {
      case 'ethereum':
      case 'eth':
        return <FaEthereum />
      case 'polygon':
      case 'matic':
        return <SiPolygon />
      case 'bsc':
      case 'binance':
      case 'bnb':
        return <SiBinance />
      case 'arbitrum':
      case 'arb':
        return <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">A</div>
      case 'optimism':
      case 'op':
        return <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">O</div>
      default:
        return <FaEthereum />
    }
  }

  const formatTVL = (value: number) => {
    if (!value || value === 0) return 'N/A'
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
    return `$${value.toFixed(2)}`
  }

  // Get pools dynamically - all data from API
  const topPools = pools || []
  const displayLimit = Math.min(topPools.length, 12) // Show up to 12 pools
  const displayPools = topPools.slice(0, displayLimit)

  return (
    <section id="protocols" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-purple-500 font-semibold text-sm uppercase tracking-wider">Live Yields</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            <span className="text-brown-800 dark:text-brown-100">Best APY Rates</span>{' '}
            <span className="gradient-text">Right Now</span>
          </h2>
          <p className="text-lg text-brown-600 dark:text-brown-300 max-w-3xl mx-auto">
            {pools && pools.length > 0
              ? `Showing ${displayPools.length} highest APY opportunities${
                  displayPools[0] && (displayPools[0].totalAPY || displayPools[0].apy) > 1000
                    ? ` (up to ${Math.round(displayPools[0].totalAPY || displayPools[0].apy || 0)}% APY!)`
                    : ''
                }`
              : 'Discovering the best yield opportunities across DeFi protocols'
            }
          </p>
        </motion.div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-center">
            Unable to load pools. Please try again later.
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {isLoading ? (
            [...Array(Math.min(displayLimit || 6, 6))].map((_, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-5 border border-brown-200/20 dark:border-brown-800/20 animate-pulse"
              >
                <div className="h-12 bg-brown-200/50 dark:bg-brown-700/50 rounded mb-4"></div>
                <div className="h-24 bg-brown-200/50 dark:bg-brown-700/50 rounded"></div>
              </div>
            ))
          ) : displayPools.length > 0 ? (
            displayPools.map((pool: any, index: number) => (
              <motion.div
                key={pool.id || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
                viewport={{ once: true }}
              >
                <a href={pool.protocol?.website ? pool.protocol.website : `/pool/${pool.id}`} target={pool.protocol?.website ? '_blank' : '_self'} rel={pool.protocol?.website ? 'noopener,noreferrer' : undefined} className="block">
                  <div className="glass rounded-2xl p-5 border border-brown-200/20 dark:border-brown-800/20 hover:border-purple-400/30 dark:hover:border-purple-500/30 transition-all duration-300 cursor-pointer h-full">
                    {/* Protocol Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl text-purple-500">
                          {getChainIcon(pool.protocol?.chain || 'ethereum')}
                        </span>
                        <div>
                          <h3 className="font-semibold text-brown-800 dark:text-brown-100 text-sm">
                            {pool.protocol?.name || 'Protocol'}
                          </h3>
                          <span className="text-xs text-brown-600 dark:text-brown-400">
                            {pool.protocol?.chain || 'ethereum'}
                          </span>
                        </div>
                      </div>
                      {/* Dynamic Rank Badge - Show for top performers */}
                      {(pool.totalAPY || pool.apy || 0) > 100 || index < 3 ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          (pool.totalAPY || pool.apy || 0) > 1000 ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                          (pool.totalAPY || pool.apy || 0) > 500 ? 'bg-gradient-to-br from-purple-500 to-indigo-500' :
                          'bg-gradient-to-br from-purple-400 to-purple-600'
                        }`}>
                          {index < 3 ? index + 1 :
                           (pool.totalAPY || pool.apy || 0) > 1000 ? '🔥' :
                           (pool.totalAPY || pool.apy || 0) > 500 ? '⚡' : '★'}
                        </div>
                      ) : null}
                    </div>

                    {/* Pool Details */}
                    <div className="space-y-3">
                      <div>
                        <div className="font-semibold text-brown-800 dark:text-brown-100 text-lg">
                          {pool.asset || pool.name || `Pool ${index + 1}`}
                        </div>
                        <div className="text-xs text-brown-600 dark:text-brown-400">
                          {pool.poolType || pool.isLoopable ? 'Loopable' : 'Standard Pool'}
                        </div>
                      </div>

                      {/* Stats Grid - Dynamic Data */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className={`text-2xl font-bold ${
                            (pool.totalAPY || pool.apy || 0) > 1000 ? 'text-yellow-500' :
                            (pool.totalAPY || pool.apy || 0) > 500 ? 'text-orange-500' :
                            (pool.totalAPY || pool.apy || 0) > 100 ? 'text-green-400' :
                            'text-green-500'
                          }`}>
                            {pool.totalAPY ?
                              pool.totalAPY > 1000 ? `${(pool.totalAPY / 1).toFixed(0)}%` : pool.totalAPY.toFixed(1) + '%' :
                              pool.apy ?
                                pool.apy > 1000 ? `${(pool.apy / 1).toFixed(0)}%` : pool.apy.toFixed(1) + '%' :
                                pool.supplyAPY ? pool.supplyAPY.toFixed(1) + '%' :
                                '0.0%'
                            }
                          </div>
                          <div className="text-xs text-brown-600 dark:text-brown-400">APY</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-brown-800 dark:text-brown-100">
                            {formatTVL(pool.tvl || 0)}
                          </div>
                          <div className="text-xs text-brown-600 dark:text-brown-400">TVL</div>
                        </div>
                      </div>

                      {/* Additional Dynamic Stats if Available */}
                      {(pool.borrowAPY || pool.rewardAPY) && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {pool.borrowAPY && (
                            <div>
                              <span className="text-brown-600 dark:text-brown-400">Borrow: </span>
                              <span className="text-brown-800 dark:text-brown-100">{pool.borrowAPY.toFixed(1)}%</span>
                            </div>
                          )}
                          {pool.rewardAPY && (
                            <div>
                              <span className="text-brown-600 dark:text-brown-400">Rewards: </span>
                              <span className="text-brown-800 dark:text-brown-100">+{pool.rewardAPY.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Risk Level Indicator */}
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-brown-600 dark:text-brown-400">Risk:</span>
                        <div className="flex space-x-1">
                          {['low', 'medium', 'high'].map((level) => (
                            <div
                              key={level}
                              className={`w-2 h-2 rounded-full ${
                                (pool.riskLevel || 'medium') === level
                                  ? level === 'low'
                                    ? 'bg-green-500'
                                    : level === 'medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs capitalize text-brown-600 dark:text-brown-400">
                          {pool.riskLevel || 'Medium'}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </motion.div>
            ))
          ) : !isLoading && !error ? (
            <div className="col-span-full text-center py-12">
              <div className="text-brown-600 dark:text-brown-400 mb-4">
                No pools available at the moment
              </div>
              <Link href="/pools">
                <button className="px-6 py-2 bg-gradient-to-r from-brown-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                  Browse All Pools
                </button>
              </Link>
            </div>
          ) : null}
        </div>

        {/* Dynamic View All Button - Show if more pools available */}
        {displayPools.length > 0 && (
          <div className="text-center">
            <Link href="/pools">
              <button className="px-8 py-3 bg-gradient-to-r from-brown-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02]">
                {pools && pools.length > displayLimit
                  ? `View All Pools →`
                  : 'Explore More Pools →'
                }
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default APYShowcase