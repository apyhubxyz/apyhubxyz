'use client'

import { motion } from 'framer-motion'
import { FaChartLine, FaRocket, FaShieldAlt } from 'react-icons/fa'
import { BsArrowRight } from 'react-icons/bs'

const Hero = () => {
  // TODO: Fetch these from API later
  const stats = [
    { label: 'Total Value Locked', value: '$2.5B+' },
    { label: 'Protocols Tracked', value: '50+' },
    { label: 'Active Users', value: '100K+' },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center px-4 py-2 rounded-full glass mb-6"
            >
              <FaRocket className="text-purple-500 mr-2" />
              <span className="text-sm font-medium text-brown-800 dark:text-brown-100">
                Welcome to the Future of DeFi
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="gradient-text">Maximize</span>{' '}
              <span className="text-brown-800 dark:text-brown-100">Your</span>
              <br />
              <span className="text-brown-800 dark:text-brown-100">DeFi</span>{' '}
              <span className="gradient-text">Yields</span>
            </h1>

            <p className="text-lg text-brown-700 dark:text-brown-200 mb-8 leading-relaxed">
              Discover the best APY rates across all major DeFi protocols. 
              Make informed decisions with real-time data, comprehensive analytics, 
              and automated yield optimization strategies.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-hover bg-gradient-to-r from-brown-500 to-purple-500 text-white px-8 py-4 rounded-full flex items-center justify-center space-x-2 font-semibold shadow-xl"
              >
                <span>Start Earning Now</span>
                <BsArrowRight className="text-xl" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass border border-brown-300 dark:border-brown-700 text-brown-800 dark:text-brown-100 px-8 py-4 rounded-full font-semibold hover:bg-brown-50 dark:hover:bg-brown-900 transition-colors"
              >
                View Documentation
              </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold gradient-text">
                    {stat.value}
                  </div>
                  <div className="text-xs text-brown-600 dark:text-brown-300">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative">
              {/* Animated blob bg - might need performance optimization */}
              <div className="absolute inset-0 blob bg-gradient-to-br from-brown-400 via-purple-400 to-brown-400 opacity-20 blur-3xl"></div>
              
              {/* Protocol cards display */}
              <div className="relative space-y-4">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 2, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="glass p-6 rounded-2xl shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <FaChartLine className="text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-brown-600 dark:text-brown-300">Aave V3</div>
                        <div className="font-semibold text-brown-800 dark:text-brown-100">USDC Pool</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-500">12.8%</div>
                      <div className="text-xs text-brown-600 dark:text-brown-300">APY</div>
                    </div>
                  </div>
                  <div className="h-2 bg-brown-100 dark:bg-brown-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, -2, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="glass p-6 rounded-2xl shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                        <FaShieldAlt className="text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-brown-600 dark:text-brown-300">Compound</div>
                        <div className="font-semibold text-brown-800 dark:text-brown-100">ETH Vault</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-500">8.5%</div>
                      <div className="text-xs text-brown-600 dark:text-brown-300">APY</div>
                    </div>
                  </div>
                  <div className="h-2 bg-brown-100 dark:bg-brown-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
                  </div>
                </motion.div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  x: [0, 10, 0]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-brown-400 to-purple-400 rounded-2xl opacity-50"
              />
              <motion.div
                animate={{ 
                  y: [0, 20, 0],
                  x: [0, -10, 0]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -bottom-8 -left-8 w-12 h-12 bg-gradient-to-br from-purple-400 to-brown-400 rounded-full opacity-50"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Hero