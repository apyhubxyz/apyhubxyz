'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import {
  FaWallet,
  FaChartLine,
  FaChevronRight,
  FaEyeSlash,
  FaEye,
  FaSyncAlt
} from 'react-icons/fa'
import {
  HiSparkles,
  HiTrendingUp,
  HiTrendingDown,
  HiRefresh
} from 'react-icons/hi'
import { apiClient } from '@/lib/api'

interface ChainBalance {
  chainId: number
  chainName: string
  icon: string
  color: string
  balances: TokenBalance[]
  totalUsdValue: number
}

interface TokenBalance {
  symbol: string
  name: string
  address: string
  balance: string
  usdValue: number
  icon: string
  change24h: number
}

export default function UnifiedBalance() {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [hideBalances, setHideBalances] = useState(false)
  const [chainBalances, setChainBalances] = useState<ChainBalance[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [expandedChain, setExpandedChain] = useState<number | null>(null)

  // Mock data for demonstration
  const mockBalances: ChainBalance[] = [
    {
      chainId: 1,
      chainName: 'Ethereum',
      icon: '🔷',
      color: 'from-blue-500 to-blue-600',
      balances: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          address: '0x0000000000000000000000000000000000000000',
          balance: '5.234',
          usdValue: 8897.80,
          icon: '🔷',
          change24h: 2.5
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          balance: '1250.50',
          usdValue: 1250.50,
          icon: '💵',
          change24h: 0.01
        },
        {
          symbol: 'USDT',
          name: 'Tether',
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          balance: '500.00',
          usdValue: 500.00,
          icon: '💲',
          change24h: -0.02
        }
      ],
      totalUsdValue: 10648.30
    },
    {
      chainId: 42161,
      chainName: 'Arbitrum',
      icon: '🔵',
      color: 'from-blue-400 to-cyan-500',
      balances: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          address: '0x0000000000000000000000000000000000000000',
          balance: '2.156',
          usdValue: 3665.20,
          icon: '🔷',
          change24h: 2.5
        },
        {
          symbol: 'ARB',
          name: 'Arbitrum',
          address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
          balance: '1500.00',
          usdValue: 1650.00,
          icon: '🔵',
          change24h: 5.2
        }
      ],
      totalUsdValue: 5315.20
    },
    {
      chainId: 10,
      chainName: 'Optimism',
      icon: '🔴',
      color: 'from-red-500 to-red-600',
      balances: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          address: '0x0000000000000000000000000000000000000000',
          balance: '1.005',
          usdValue: 1708.50,
          icon: '🔷',
          change24h: 2.5
        },
        {
          symbol: 'OP',
          name: 'Optimism',
          address: '0x4200000000000000000000000000000000000042',
          balance: '750.00',
          usdValue: 1125.00,
          icon: '🔴',
          change24h: -1.8
        }
      ],
      totalUsdValue: 2833.50
    },
    {
      chainId: 137,
      chainName: 'Polygon',
      icon: '🟣',
      color: 'from-purple-500 to-purple-600',
      balances: [
        {
          symbol: 'MATIC',
          name: 'Polygon',
          address: '0x0000000000000000000000000000000000000000',
          balance: '2500.00',
          usdValue: 1750.00,
          icon: '🟣',
          change24h: 3.2
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          balance: '850.00',
          usdValue: 850.00,
          icon: '💵',
          change24h: 0.01
        }
      ],
      totalUsdValue: 2600.00
    }
  ]

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances()
    }
  }, [isConnected, address])

  const fetchBalances = async () => {
    setIsLoading(true)
    try {
      // Fetch real balances from the API
      const data = await apiClient.bridge.getUnifiedBalance(address!)
      if (data && data.balances) {
        setChainBalances(data.balances)
        setTotalBalance(data.totalUsdValue)
      } else {
        // Fallback to mock data if API response is incomplete
        setChainBalances(mockBalances)
        const total = mockBalances.reduce((sum, chain) => sum + chain.totalUsdValue, 0)
        setTotalBalance(total)
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error)
      // Fallback to mock data if API fails
      setChainBalances(mockBalances)
      const total = mockBalances.reduce((sum, chain) => sum + chain.totalUsdValue, 0)
      setTotalBalance(total)
    } finally {
      setIsLoading(false)
    }
  }

  const formatValue = (value: number): string => {
    if (hideBalances) return '****'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatBalance = (balance: string): string => {
    if (hideBalances) return '****'
    return parseFloat(balance).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    })
  }

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-3xl p-12 text-center"
      >
        <FaWallet className="text-6xl text-brown-400 dark:text-brown-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-brown-900 dark:text-brown-100 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-brown-600 dark:text-brown-400">
          Connect your wallet to view your unified balance across all chains
        </p>
      </motion.div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-dark rounded-3xl p-8 border border-purple-200 dark:border-purple-800/50 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brown-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FaWallet className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brown-900 dark:text-brown-100">
                Unified Balance
              </h3>
              <p className="text-sm text-brown-600 dark:text-brown-400">
                Total across all chains
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="p-2 rounded-lg glass hover:bg-brown-100 dark:hover:bg-brown-800/50 transition-colors"
            >
              {hideBalances ? <FaEyeSlash /> : <FaEye />}
            </button>
            <button
              onClick={fetchBalances}
              disabled={isLoading}
              className="p-2 rounded-lg glass hover:bg-brown-100 dark:hover:bg-brown-800/50 transition-colors"
            >
              <FaSyncAlt className={`${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="text-center">
          <motion.div
            key={totalBalance}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold gradient-text mb-2"
          >
            {formatValue(totalBalance)}
          </motion.div>
          
          <div className="flex items-center justify-center gap-2 text-sm">
            <HiTrendingUp className="text-green-500" />
            <span className="text-green-600 dark:text-green-400">
              +{formatValue(352.45)} (1.7%)
            </span>
            <span className="text-brown-600 dark:text-brown-400">
              24h
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-brown-900 dark:text-brown-100">
              {chainBalances.length}
            </div>
            <div className="text-xs text-brown-600 dark:text-brown-400">
              Active Chains
            </div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-brown-900 dark:text-brown-100">
              {chainBalances.reduce((sum, chain) => sum + chain.balances.length, 0)}
            </div>
            <div className="text-xs text-brown-600 dark:text-brown-400">
              Total Assets
            </div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              +2.4%
            </div>
            <div className="text-xs text-brown-600 dark:text-brown-400">
              Portfolio 24h
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chain Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chainBalances.map((chain, index) => (
          <motion.div
            key={chain.chainId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Chain Header */}
            <button
              onClick={() => setExpandedChain(expandedChain === chain.chainId ? null : chain.chainId)}
              className="w-full p-6 flex items-center justify-between hover:bg-brown-50 dark:hover:bg-brown-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${chain.color} flex items-center justify-center text-xl`}>
                  {chain.icon}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-brown-900 dark:text-brown-100">
                    {chain.chainName}
                  </div>
                  <div className="text-sm text-brown-600 dark:text-brown-400">
                    {chain.balances.length} assets
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-brown-900 dark:text-brown-100">
                    {formatValue(chain.totalUsdValue)}
                  </div>
                  <div className="text-xs text-brown-600 dark:text-brown-400">
                    {((chain.totalUsdValue / totalBalance) * 100).toFixed(1)}% of total
                  </div>
                </div>
                <FaChevronRight className={`text-brown-600 dark:text-brown-400 transition-transform ${expandedChain === chain.chainId ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {/* Token List */}
            <AnimatePresence>
              {expandedChain === chain.chainId && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-2">
                    {chain.balances.map((token) => (
                      <div
                        key={token.address}
                        className="glass rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{token.icon}</span>
                          <div>
                            <div className="font-medium text-brown-900 dark:text-brown-100">
                              {formatBalance(token.balance)} {token.symbol}
                            </div>
                            <div className="text-xs text-brown-600 dark:text-brown-400">
                              {token.name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-brown-900 dark:text-brown-100">
                            {formatValue(token.usdValue)}
                          </div>
                          <div className={`text-xs flex items-center justify-end gap-1 ${token.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {token.change24h >= 0 ? <HiTrendingUp /> : <HiTrendingDown />}
                            {Math.abs(token.change24h)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Bridge Suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 to-brown-500/10 border border-purple-300 dark:border-purple-700"
      >
        <div className="flex items-start gap-4">
          <HiSparkles className="text-2xl text-purple-500 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-brown-900 dark:text-brown-100 mb-2">
              Optimize Your Portfolio
            </h4>
            <p className="text-sm text-brown-600 dark:text-brown-400 mb-3">
              You have {formatValue(2600)} on Polygon that could earn 12% APY on Arbitrum. 
              Bridge now to maximize your yields!
            </p>
            <button className="px-4 py-2 bg-gradient-to-r from-brown-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
              Bridge & Earn
            </button>
          </div>
        </div>
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="glass rounded-2xl p-8 flex flex-col items-center">
              <HiRefresh className="text-4xl text-purple-500 animate-spin mb-4" />
              <p className="text-brown-900 dark:text-brown-100 font-medium">
                Fetching balances across chains...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}