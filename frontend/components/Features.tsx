'use client'

import { motion } from 'framer-motion'
import { FaChartBar, FaLock, FaRobot, FaBolt, FaGlobe, FaWallet } from 'react-icons/fa'

const Features = () => {
  // Feature list - thinking about adding more in v2
  const features = [
    {
      icon: <FaChartBar />,
      title: 'Real-Time Analytics',
      description: 'Track APY rates across multiple protocols with live updates and historical data visualization.',
      color: 'from-brown-400 to-brown-600',
    },
    {
      icon: <FaLock />,
      title: 'Secure & Trustless',
      description: 'Non-custodial solution with audited smart contracts. Your keys, your crypto, always.',
      color: 'from-purple-400 to-purple-600',
    },
    {
      icon: <FaRobot />,
      title: 'Auto-Compound',
      description: 'Automated yield optimization strategies that compound your earnings for maximum returns.',
      color: 'from-brown-400 to-purple-500',
    },
    {
      icon: <FaBolt />,
      title: 'Lightning Fast',
      description: 'Optimized for speed with instant data updates and quick transaction processing.',
      color: 'from-purple-400 to-brown-500',
    },
    {
      icon: <FaGlobe />,
      title: 'Multi-Chain Support',
      description: 'Access yields across Ethereum, BSC, Polygon, Arbitrum, and more chains.',
      color: 'from-brown-500 to-purple-400',
    },
    {
      icon: <FaWallet />,
      title: 'Portfolio Tracking',
      description: 'Monitor your entire DeFi portfolio in one place with detailed performance metrics.',
      color: 'from-purple-500 to-brown-400',
    },
  ]

  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-purple-500 font-semibold text-sm uppercase tracking-wider">Features</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            <span className="text-brown-800 dark:text-brown-100">Everything You Need for</span>{' '}
            <span className="gradient-text">DeFi Success</span>
          </h2>
          <p className="text-lg text-brown-600 dark:text-brown-300 max-w-3xl mx-auto">
            Our comprehensive platform provides all the tools and insights you need to maximize your yields
            and make informed investment decisions in the DeFi space.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group"
            >
              <div className="glass p-8 rounded-2xl h-full hover:shadow-2xl transition-all duration-300 border border-brown-200/20 dark:border-brown-800/20">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-brown-800 dark:text-brown-100 mb-4">
                  {feature.title}
                </h3>
                <p className="text-brown-600 dark:text-brown-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bg decorations - keep an eye on performance */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-purple-400 opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-brown-400 opacity-10 rounded-full blur-3xl"></div>
      </div>
    </section>
  )
}

export default Features