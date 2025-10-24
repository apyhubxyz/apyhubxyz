'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { FaEthereum } from 'react-icons/fa'
import { SiPolygon, SiBinance } from 'react-icons/si'
import apiClient, { Pool } from '@/lib/api'

const APYShowcase = () => {
  const { data: pools, isLoading } = useQuery({
    queryKey: ['topPools'],
    queryFn: () => apiClient.pools.getTop(9),
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: false,
  })

  const getChainIcon = (chain: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum':
        return <FaEthereum />
      case 'polygon':
        return <SiPolygon />
      case 'bsc':
      case 'binance':
        return <SiBinance />
      case 'arbitrum':
        return <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">A</div>
      case 'optimism':
        return <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">O</div>
      default:
        return <FaEthereum />
    }
  }

  const formatTVL = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
    return `$${value.toFixed(2)}`
  }

  // Group pools by protocol
  const groupedPools = pools?.reduce((acc, pool) => {
    const protocolName = pool.protocol?.name || 'Unknown'
    if (!acc[protocolName]) {
      acc[protocolName] = {
        name: protocolName,
        chain: pool.protocol?.chain || 'ethereum',
        pools: [],
      }
    }
    if (acc[protocolName].pools.length < 3) {
      acc[protocolName].pools.push(pool)
    }
    return acc
  }, {} as Record<string, { name: string; chain: string; pools: Pool[] }>)

  const protocolsArray = groupedPools ? Object.values(groupedPools).slice(0, 3) : []

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
          <span className="text-purple-500 font-semibold text-sm uppercase tracking-wider">Top Yields</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            <span className="text-brown-800 dark:text-brown-100">Best APY Rates</span>{' '}
            <span className="gradient-text">Right Now</span>
          </h2>
          <p className="text-lg text-brown-600 dark:text-brown-300 max-w-3xl mx-auto">
            Real-time data from top DeFi protocols. Find the best opportunities for your assets.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 border border-brown-200/20 dark:border-brown-800/20 animate-pulse"
              >
                <div className="h-16 bg-brown-200 dark:bg-brown-700 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-brown-200 dark:bg-brown-700 rounded"></div>
                  ))}
                </div>
              </div>
            ))
          ) : protocolsArray.length > 0 ? (
            protocolsArray.map((protocol, protocolIndex) => (
              <motion.div
                key={protocol.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: protocolIndex * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 border border-brown-200/20 dark:border-brown-800/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-brown-800 dark:text-brown-100">
                      {protocol.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-2xl text-purple-500">{getChainIcon(protocol.chain)}</span>
                      <span className="text-sm text-brown-600 dark:text-brown-300 capitalize">
                        {protocol.chain}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-brown-400 to-purple-400 rounded-full opacity-20"></div>
                </div>

                <div className="space-y-4">
                  {protocol.pools.map((pool, poolIndex) => (
                    <Link key={pool.id} href={`/pool/${pool.id}`}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: protocolIndex * 0.1 + poolIndex * 0.05 }}
                        viewport={{ once: true }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-brown-50 dark:hover:bg-brown-900/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-brown-300 to-purple-300 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                            {pool.asset.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-brown-800 dark:text-brown-100">
                              {pool.asset}
                            </div>
                            <div className="text-xs text-brown-600 dark:text-brown-400">
                              TVL: {formatTVL(pool.tvl)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-500">
                            {pool.totalAPY.toFixed(1)}%
                          </div>
                          <div className="text-xs text-brown-600 dark:text-brown-400">APY</div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>

                <Link href="/pools">
                  <button className="w-full mt-6 py-3 bg-gradient-to-r from-brown-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02]">
                    View All Pools
                  </button>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 text-center text-brown-600 dark:text-brown-400 py-12">
              No pools available at the moment
            </div>
          )}
        </div>

        {/* Data refresh indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex justify-center items-center space-x-2"
        >
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-brown-600 dark:text-brown-300">
            Data refreshes every 30 seconds
          </span>
        </motion.div>
      </div>
    </section>
  )
}

export default APYShowcase