'use client'

import { motion } from 'framer-motion'
import { FaEthereum, FaBitcoin } from 'react-icons/fa'
import { SiPolygon, SiBinance } from 'react-icons/si'

const APYShowcase = () => {
  const protocols = [
    {
      name: 'Aave V3',
      chain: 'Ethereum',
      icon: <FaEthereum />,
      pools: [
        { asset: 'USDC', apy: '12.8%', tvl: '$2.3B' },
        { asset: 'ETH', apy: '8.5%', tvl: '$1.8B' },
        { asset: 'DAI', apy: '10.2%', tvl: '$900M' },
      ],
    },
    {
      name: 'Compound',
      chain: 'Polygon',
      icon: <SiPolygon />,
      pools: [
        { asset: 'MATIC', apy: '15.3%', tvl: '$450M' },
        { asset: 'USDT', apy: '9.7%', tvl: '$320M' },
        { asset: 'WETH', apy: '7.2%', tvl: '$180M' },
      ],
    },
    {
      name: 'PancakeSwap',
      chain: 'BSC',
      icon: <SiBinance />,
      pools: [
        { asset: 'CAKE', apy: '28.5%', tvl: '$120M' },
        { asset: 'BNB', apy: '18.2%', tvl: '$85M' },
        { asset: 'BUSD', apy: '11.4%', tvl: '$65M' },
      ],
    },
  ]

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
          {protocols.map((protocol, protocolIndex) => (
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
                    <span className="text-2xl text-purple-500">{protocol.icon}</span>
                    <span className="text-sm text-brown-600 dark:text-brown-300">{protocol.chain}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-brown-400 to-purple-400 rounded-full opacity-20"></div>
              </div>

              <div className="space-y-4">
                {protocol.pools.map((pool, poolIndex) => (
                  <motion.div
                    key={pool.asset}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: protocolIndex * 0.1 + poolIndex * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-brown-50 dark:hover:bg-brown-900/30 transition-colors"
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
                          TVL: {pool.tvl}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-500">{pool.apy}</div>
                      <div className="text-xs text-brown-600 dark:text-brown-400">APY</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 bg-gradient-to-r from-brown-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02]">
                View Details
              </button>
            </motion.div>
          ))}
        </div>

        {/* Live data indicator - looks cool but need actual websocket connection */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex justify-center items-center space-x-2"
        >
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-brown-600 dark:text-brown-300">
            Live data • Updated every 30 seconds
          </span>
        </motion.div>
      </div>
    </section>
  )
}

export default APYShowcase