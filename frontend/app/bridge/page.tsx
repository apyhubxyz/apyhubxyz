'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import NexusBridgeWidget from '../../components/NexusBridgeWidget'
import { HiSparkles } from 'react-icons/hi'

export default function BridgePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

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

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <NexusBridgeWidget />
          </motion.div>

        </div>
      </section>

      <Footer />
    </main>
  )
}