'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BridgeWidget from '../../components/BridgeWidget'
import UnifiedBalance from '../../components/UnifiedBalance'
import BridgeHistory from '../../components/BridgeHistory'
import { useAccount } from 'wagmi'
import { FaExchangeAlt, FaHistory, FaWallet } from 'react-icons/fa'
import { HiSparkles } from 'react-icons/hi'

export default function BridgePage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'bridge' | 'history' | 'balance'>('bridge')
  const { address, isConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const tabs = [
    { id: 'bridge', label: 'Bridge', icon: FaExchangeAlt },
    { id: 'balance', label: 'Unified Balance', icon: FaWallet },
    { id: 'history', label: 'History', icon: FaHistory },
  ]

  return (
    <main className="relative min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <HiSparkles className="text-purple-500" />
              <span className="text-sm font-medium text-brown-800 dark:text-brown-200">
                Powered by Avail Nexus SDK
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Cross-Chain Bridge</span>
            </h1>
            
            <p className="text-lg text-brown-600 dark:text-brown-300 max-w-2xl mx-auto">
              Seamlessly transfer assets across multiple blockchains with optimal routes and minimal fees
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Bridge Interface */}
      <section className="relative pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="glass-dark rounded-2xl p-2 inline-flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
                      ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-brown-500 to-purple-500 text-white shadow-lg scale-105'
                        : 'text-brown-600 dark:text-brown-300 hover:bg-brown-100 dark:hover:bg-brown-800/50'
                      }
                    `}
                  >
                    <Icon className="text-lg" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            {activeTab === 'bridge' && (
              <motion.div
                key="bridge"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BridgeWidget />
              </motion.div>
            )}

            {activeTab === 'balance' && (
              <motion.div
                key="balance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <UnifiedBalance />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BridgeHistory />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      <Footer />
    </main>
  )
}