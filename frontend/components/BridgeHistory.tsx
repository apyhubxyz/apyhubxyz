'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import {
  FaHistory,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExternalLinkAlt,
  FaArrowRight,
  FaFilter,
  FaSearch
} from 'react-icons/fa'
import {
  HiSparkles,
  HiLightningBolt,
  HiDownload
} from 'react-icons/hi'
import { apiClient } from '@/lib/api'

interface BridgeTransaction {
  id: string
  status: 'pending' | 'confirming' | 'completed' | 'failed'
  fromChain: {
    id: number
    name: string
    icon: string
    explorer: string
  }
  toChain: {
    id: number
    name: string
    icon: string
    explorer: string
  }
  token: {
    symbol: string
    name: string
    icon: string
  }
  amount: string
  usdValue: number
  fromTxHash: string
  toTxHash?: string
  bridgeProtocol: string
  mode: 'bridge' | 'bridge-execute'
  executeAction?: string
  timestamp: number
  estimatedCompletion?: number
  gasCost: string
  bridgeFee: string
}

export default function BridgeHistory() {
  const { address, isConnected } = useAccount()
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTx, setSelectedTx] = useState<BridgeTransaction | null>(null)

  // Mock data for demonstration
  const mockTransactions: BridgeTransaction[] = [
    {
      id: 'tx-001',
      status: 'completed',
      fromChain: {
        id: 1,
        name: 'Ethereum',
        icon: '🔷',
        explorer: 'https://etherscan.io'
      },
      toChain: {
        id: 42161,
        name: 'Arbitrum',
        icon: '🔵',
        explorer: 'https://arbiscan.io'
      },
      token: {
        symbol: 'ETH',
        name: 'Ethereum',
        icon: '🔷'
      },
      amount: '2.5',
      usdValue: 4250,
      fromTxHash: '0x1234567890abcdef',
      toTxHash: '0xfedcba0987654321',
      bridgeProtocol: 'Avail Nexus',
      mode: 'bridge',
      timestamp: Date.now() - 3600000,
      gasCost: '0.005',
      bridgeFee: '0.003'
    },
    {
      id: 'tx-002',
      status: 'pending',
      fromChain: {
        id: 137,
        name: 'Polygon',
        icon: '🟣',
        explorer: 'https://polygonscan.com'
      },
      toChain: {
        id: 10,
        name: 'Optimism',
        icon: '🔴',
        explorer: 'https://optimistic.etherscan.io'
      },
      token: {
        symbol: 'USDC',
        name: 'USD Coin',
        icon: '💵'
      },
      amount: '1000',
      usdValue: 1000,
      fromTxHash: '0xabcdef1234567890',
      bridgeProtocol: 'Avail Nexus',
      mode: 'bridge-execute',
      executeAction: 'swap',
      timestamp: Date.now() - 300000,
      estimatedCompletion: Date.now() + 180000,
      gasCost: '0.002',
      bridgeFee: '0.001'
    },
    {
      id: 'tx-003',
      status: 'confirming',
      fromChain: {
        id: 8453,
        name: 'Base',
        icon: '🔵',
        explorer: 'https://basescan.org'
      },
      toChain: {
        id: 1,
        name: 'Ethereum',
        icon: '🔷',
        explorer: 'https://etherscan.io'
      },
      token: {
        symbol: 'USDT',
        name: 'Tether',
        icon: '💲'
      },
      amount: '500',
      usdValue: 500,
      fromTxHash: '0x9876543210fedcba',
      bridgeProtocol: 'Avail Nexus',
      mode: 'bridge',
      timestamp: Date.now() - 120000,
      estimatedCompletion: Date.now() + 60000,
      gasCost: '0.015',
      bridgeFee: '0.002'
    }
  ]

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions()
    }
  }, [isConnected, address])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      // Fetch real transactions from the API
      const data = await apiClient.bridge.getHistory(address!)
      setTransactions(data)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      // Fallback to mock data if API fails
      setTransactions(mockTransactions)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== 'all' && tx.status !== filter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        tx.token.symbol.toLowerCase().includes(query) ||
        tx.fromChain.name.toLowerCase().includes(query) ||
        tx.toChain.name.toLowerCase().includes(query) ||
        tx.fromTxHash.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />
      case 'failed':
        return <FaTimesCircle className="text-red-500" />
      case 'pending':
      case 'confirming':
        return <FaClock className="text-yellow-500 animate-pulse" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      case 'pending':
      case 'confirming':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      default:
        return ''
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const formatTxHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-3xl p-12 text-center"
      >
        <FaHistory className="text-6xl text-brown-400 dark:text-brown-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-brown-900 dark:text-brown-100 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-brown-600 dark:text-brown-400">
          Connect your wallet to view your bridge transaction history
        </p>
      </motion.div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-2xl p-6 border border-purple-200 dark:border-purple-800/50"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brown-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FaHistory className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brown-900 dark:text-brown-100">
                Transaction History
              </h3>
              <p className="text-sm text-brown-600 dark:text-brown-400">
                {transactions.length} total transactions
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-600 dark:text-brown-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass rounded-xl bg-transparent outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {(['all', 'pending', 'completed', 'failed'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === filterType
                      ? 'bg-gradient-to-r from-brown-500 to-purple-500 text-white'
                      : 'glass text-brown-600 dark:text-brown-300 hover:bg-brown-100 dark:hover:bg-brown-800/50'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Transactions List */}
      <div className="space-y-4">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-brown-600 dark:text-brown-400">Loading transactions...</p>
          </motion.div>
        ) : filteredTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <p className="text-brown-600 dark:text-brown-400">No transactions found</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass rounded-2xl p-6 hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setSelectedTx(tx)}
              >
                <div className="flex items-center justify-between">
                  {/* Left Side - Chain & Token Info */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-xl">
                        {tx.fromChain.icon}
                      </div>
                      <FaArrowRight className="mx-2 text-purple-500" />
                      <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-xl">
                        {tx.toChain.icon}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tx.token.icon}</span>
                        <span className="font-semibold text-brown-900 dark:text-brown-100">
                          {tx.amount} {tx.token.symbol}
                        </span>
                        {tx.mode === 'bridge-execute' && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-lg font-medium">
                            <HiLightningBolt className="inline mr-1" />
                            {tx.executeAction}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-brown-600 dark:text-brown-400">
                        {tx.fromChain.name} → {tx.toChain.name}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Status & Time */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(tx.status)}`}>
                        {getStatusIcon(tx.status)}
                        <span className="capitalize">{tx.status}</span>
                      </div>
                      <div className="text-xs text-brown-600 dark:text-brown-400 mt-1">
                        {formatTime(tx.timestamp)}
                      </div>
                    </div>
                    
                    <a
                      href={`${tx.fromChain.explorer}/tx/${tx.fromTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg glass hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <FaExternalLinkAlt className="text-purple-500" />
                    </a>
                  </div>
                </div>

                {/* Progress Bar for Pending/Confirming */}
                {(tx.status === 'pending' || tx.status === 'confirming') && tx.estimatedCompletion && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-brown-600 dark:text-brown-400 mb-2">
                      <span>Processing...</span>
                      <span>~{Math.ceil((tx.estimatedCompletion - Date.now()) / 60000)} min remaining</span>
                    </div>
                    <div className="w-full bg-brown-200 dark:bg-brown-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '60%' }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                        className="h-full bg-gradient-to-r from-purple-500 to-brown-500"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-dark rounded-3xl p-8 max-w-lg w-full border border-purple-200 dark:border-purple-800/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-brown-900 dark:text-brown-100">
                  Transaction Details
                </h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-2xl text-brown-600 dark:text-brown-400 hover:text-brown-900 dark:hover:text-brown-100"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="glass rounded-xl p-4">
                  <div className="text-sm text-brown-600 dark:text-brown-400 mb-1">Status</div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(selectedTx.status)}`}>
                    {getStatusIcon(selectedTx.status)}
                    <span className="capitalize">{selectedTx.status}</span>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <div className="text-sm text-brown-600 dark:text-brown-400 mb-1">Amount</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedTx.token.icon}</span>
                    <span className="text-lg font-semibold text-brown-900 dark:text-brown-100">
                      {selectedTx.amount} {selectedTx.token.symbol}
                    </span>
                    <span className="text-sm text-brown-600 dark:text-brown-400">
                      (${selectedTx.usdValue.toLocaleString()})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-brown-600 dark:text-brown-400 mb-1">From</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedTx.fromChain.icon}</span>
                      <span className="font-medium text-brown-900 dark:text-brown-100">
                        {selectedTx.fromChain.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-brown-600 dark:text-brown-400 mb-1">To</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedTx.toChain.icon}</span>
                      <span className="font-medium text-brown-900 dark:text-brown-100">
                        {selectedTx.toChain.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-brown-600 dark:text-brown-400">Bridge Protocol</span>
                    <span className="text-sm font-medium text-brown-900 dark:text-brown-100">
                      {selectedTx.bridgeProtocol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-brown-600 dark:text-brown-400">Gas Cost</span>
                    <span className="text-sm font-medium text-brown-900 dark:text-brown-100">
                      {selectedTx.gasCost} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-brown-600 dark:text-brown-400">Bridge Fee</span>
                    <span className="text-sm font-medium text-brown-900 dark:text-brown-100">
                      {selectedTx.bridgeFee} {selectedTx.token.symbol}
                    </span>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 space-y-3">
                  <div>
                    <div className="text-sm text-brown-600 dark:text-brown-400 mb-1">Source Tx</div>
                    <a
                      href={`${selectedTx.fromChain.explorer}/tx/${selectedTx.fromTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      {formatTxHash(selectedTx.fromTxHash)}
                      <FaExternalLinkAlt className="text-xs" />
                    </a>
                  </div>
                  
                  {selectedTx.toTxHash && (
                    <div>
                      <div className="text-sm text-brown-600 dark:text-brown-400 mb-1">Destination Tx</div>
                      <a
                        href={`${selectedTx.toChain.explorer}/tx/${selectedTx.toTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {formatTxHash(selectedTx.toTxHash)}
                        <FaExternalLinkAlt className="text-xs" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center"
      >

      </motion.div>
    </div>
  )
}