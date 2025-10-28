'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useChainId, useSwitchChain, useBalance } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { parseEther, formatEther } from 'viem'
import Image from 'next/image'
import {
  FaEthereum,
  FaExchangeAlt,
  FaChevronDown,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaRocket,
  FaShieldAlt,
  FaGasPump
} from 'react-icons/fa'
import {
  HiSparkles,
  HiLightningBolt,
  HiArrowRight,
  HiInformationCircle,
  HiExternalLink
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'

// Supported chains configuration - Update the extension (.svg, .png, .jpg, .webp) based on your logo format
const SUPPORTED_CHAINS = [
  {
    id: 1,
    name: 'Ethereum',
    logo: '/chains/ethereum.png',
    icon: '🔷', // Fallback icon
    color: 'from-white to-gray-50 dark:from-gray-800 dark:to-gray-700',
    nativeCurrency: 'ETH',
    explorer: 'https://etherscan.io'
  },
  {
    id: 42161,
    name: 'Arbitrum',
    logo: '/chains/arbitrum.jpeg',
    icon: '🔵', // Fallback icon
    color: 'from-blue-400 to-cyan-500',
    nativeCurrency: 'ETH',
    explorer: 'https://arbiscan.io'
  },
  {
    id: 10,
    name: 'Optimism',
    logo: '/chains/optimism.jpeg',
    icon: '🔴', // Fallback icon
    color: 'from-red-500 to-red-600',
    nativeCurrency: 'ETH',
    explorer: 'https://optimistic.etherscan.io'
  },
  {
    id: 8453,
    name: 'Base',
    logo: '/chains/base.jpeg',
    icon: '🔵', // Fallback icon
    color: 'from-blue-600 to-indigo-600',
    nativeCurrency: 'ETH',
    explorer: 'https://basescan.org'
  },
  {
    id: 137,
    name: 'Polygon',
    logo: '/chains/polygon.png',
    icon: '🟣', // Fallback icon
    color: 'from-purple-500 to-purple-600',
    nativeCurrency: 'MATIC',
    explorer: 'https://polygonscan.com'
  }
]

// Popular tokens - Update the extension (.svg, .png, .jpg, .webp) based on your logo format
const POPULAR_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', logo: '/tokens/eth.svg', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDC', name: 'USD Coin', logo: '/tokens/usdc.svg', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { symbol: 'USDT', name: 'Tether', logo: '/tokens/usdt.svg', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { symbol: 'DAI', name: 'Dai', logo: '/tokens/dai.svg', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', logo: '/tokens/wbtc.svg', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
]

interface BridgeRoute {
  protocol: string
  estimatedTime: number
  gasCost: string
  bridgeFee: string
  totalCost: string
  confidence: number
}

export default function BridgeWidget() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { openConnectModal } = useConnectModal()
  
  // Bridge state
  const [fromChain, setFromChain] = useState(SUPPORTED_CHAINS[0])
  const [toChain, setToChain] = useState(SUPPORTED_CHAINS[1])
  const [selectedToken, setSelectedToken] = useState(POPULAR_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [bestRoute, setBestRoute] = useState<BridgeRoute | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [bridgeMode, setBridgeMode] = useState<'bridge' | 'bridge-execute'>('bridge')
  const [executeAction, setExecuteAction] = useState<'swap' | 'deposit' | 'stake'>('swap')
  
  // Advanced settings state
  const [slippage, setSlippage] = useState('0.5')
  const [customSlippage, setCustomSlippage] = useState('')
  const [gasSpeed, setGasSpeed] = useState<'slow' | 'standard' | 'fast'>('standard')
  
  // UI state
  const [showFromChainSelect, setShowFromChainSelect] = useState(false)
  const [showToChainSelect, setShowToChainSelect] = useState(false)
  const [showTokenSelect, setShowTokenSelect] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')

  // Get balance
  const { data: balance } = useBalance({
    address: address,
    token: selectedToken.address === '0x0000000000000000000000000000000000000000' 
      ? undefined
      : selectedToken.address as `0x${string}`,
    chainId: fromChain.id,
  })

  // Calculate estimated output
  const estimatedOutput = useMemo(() => {
    if (!amount || !bestRoute) return '0'
    const amountBN = parseEther(amount || '0')
    const feeAmount = (amountBN * BigInt(30)) / BigInt(10000) // 0.3% fee
    const output = amountBN - feeAmount
    return formatEther(output)
  }, [amount, bestRoute])

  // Fetch best route when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      fetchBestRoute()
    }
  }, [amount, fromChain, toChain, selectedToken])

  const fetchBestRoute = async () => {
    setIsLoadingRoute(true)
    try {
      // Simulate API call to get best route
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setBestRoute({
        protocol: 'Avail Nexus',
        estimatedTime: 180, // 3 minutes
        gasCost: '0.005',
        bridgeFee: '0.003',
        totalCost: '0.008',
        confidence: 95
      })
    } catch (error) {
      console.error('Failed to fetch route:', error)
    } finally {
      setIsLoadingRoute(false)
    }
  }

  const handleBridge = async () => {
    if (!isConnected) {
      // Open connect wallet modal instead of showing error
      if (openConnectModal) {
        openConnectModal()
      }
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setTxStatus('pending')
    
    try {
      // Call backend bridge service using apiClient
      const response = await apiClient.bridge.execute({
        fromChain: fromChain.id,
        toChain: toChain.id,
        token: selectedToken.address,
        amount: parseEther(amount).toString(),
        recipient: address!,
        mode: bridgeMode,
        executeAction: bridgeMode === 'bridge-execute' ? executeAction : undefined
      })

      setTxHash(response.txHash)
      setTxStatus('success')
      toast.success('Bridge transaction initiated!')
      
      // Reset form
      setAmount('')
      setBestRoute(null)
    } catch (error) {
      console.error('Bridge failed:', error)
      setTxStatus('error')
      toast.error('Bridge transaction failed')
    }
  }

  const switchChains = () => {
    const temp = fromChain
    setFromChain(toChain)
    setToChain(temp)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Bridge Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-dark rounded-3xl p-8 border border-purple-200 dark:border-purple-800/50 shadow-2xl"
      >
        {/* Bridge Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="glass rounded-xl p-1 inline-flex gap-1">
            <button
              onClick={() => setBridgeMode('bridge')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                bridgeMode === 'bridge'
                  ? 'bg-gradient-to-r from-brown-500 to-purple-500 text-white'
                  : 'text-brown-600 dark:text-brown-300'
              }`}
            >
              <FaExchangeAlt className="inline mr-2" />
              Bridge
            </button>
            <button
              onClick={() => setBridgeMode('bridge-execute')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                bridgeMode === 'bridge-execute'
                  ? 'bg-gradient-to-r from-brown-500 to-purple-500 text-white'
                  : 'text-brown-600 dark:text-brown-300'
              }`}
            >
              <HiLightningBolt className="inline mr-2" />
             
            </button>
          </div>
        </div>

        {/* From Chain */}
        <div className="mb-6">
          <label className="text-sm font-medium text-brown-700 dark:text-brown-300 mb-2 block">
            From
          </label>
          <div className="relative">
            <button
              onClick={() => setShowFromChainSelect(!showFromChainSelect)}
              className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${fromChain.color} flex items-center justify-center overflow-hidden`}>
                  <Image
                    src={fromChain.logo}
                    alt={fromChain.name}
                    width={40}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-brown-900 dark:text-brown-100">
                    {fromChain.name}
                  </div>
                  <div className="text-xs text-brown-600 dark:text-brown-400">
                    Chain ID: {fromChain.id}
                  </div>
                </div>
              </div>
              <FaChevronDown className={`text-brown-600 dark:text-brown-400 transition-transform ${showFromChainSelect ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showFromChainSelect && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full glass rounded-2xl p-2 z-20 border border-brown-200 dark:border-brown-700"
                >
                  {SUPPORTED_CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setFromChain(chain)
                        setShowFromChainSelect(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brown-100 dark:hover:bg-brown-800/50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${chain.color} flex items-center justify-center overflow-hidden`}>
                        <Image
                          src={chain.logo}
                          alt={chain.name}
                          width={32}
                          height={32}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="font-medium text-brown-900 dark:text-brown-100">
                        {chain.name}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={switchChains}
            className="glass rounded-full p-3 border-2 border-purple-300 dark:border-purple-700 hover:rotate-180 transition-all duration-300"
          >
            <FaExchangeAlt className="text-purple-500 text-xl rotate-90" />
          </button>
        </div>

        {/* To Chain */}
        <div className="mb-6">
          <label className="text-sm font-medium text-brown-700 dark:text-brown-300 mb-2 block">
            To
          </label>
          <div className="relative">
            <button
              onClick={() => setShowToChainSelect(!showToChainSelect)}
              className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${toChain.color} flex items-center justify-center overflow-hidden`}>
                  <Image
                    src={toChain.logo}
                    alt={toChain.name}
                    width={40}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-brown-900 dark:text-brown-100">
                    {toChain.name}
                  </div>
                  <div className="text-xs text-brown-600 dark:text-brown-400">
                    Chain ID: {toChain.id}
                  </div>
                </div>
              </div>
              <FaChevronDown className={`text-brown-600 dark:text-brown-400 transition-transform ${showToChainSelect ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showToChainSelect && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full glass rounded-2xl p-2 z-20 border border-brown-200 dark:border-brown-700"
                >
                  {SUPPORTED_CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setToChain(chain)
                        setShowToChainSelect(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brown-100 dark:hover:bg-brown-800/50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${chain.color} flex items-center justify-center overflow-hidden`}>
                        <Image
                          src={chain.logo}
                          alt={chain.name}
                          width={32}
                          height={32}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="font-medium text-brown-900 dark:text-brown-100">
                        {chain.name}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Token & Amount */}
        <div className="mb-6">
          <label className="text-sm font-medium text-brown-700 dark:text-brown-300 mb-2 block">
            Amount
          </label>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTokenSelect(!showTokenSelect)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-brown-100 dark:hover:bg-brown-800/50 transition-colors"
              >
                <div className="relative w-6 h-6">
                  <Image
                    src={selectedToken.logo}
                    alt={selectedToken.symbol}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold text-brown-900 dark:text-brown-100">
                  {selectedToken.symbol}
                </span>
                <FaChevronDown className="text-brown-600 dark:text-brown-400" />
              </button>
              
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold text-brown-900 dark:text-brown-100 outline-none text-right"
              />
            </div>
            
            {balance && (
              <div className="flex justify-between items-center mt-3 text-sm">
                <span className="text-brown-600 dark:text-brown-400">
                  Balance: {parseFloat(balance.formatted).toFixed(4)} {selectedToken.symbol}
                </span>
                <button
                  onClick={() => setAmount(balance.formatted)}
                  className="text-purple-500 hover:text-purple-600 font-medium"
                >
                  MAX
                </button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showTokenSelect && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute mt-2 glass rounded-2xl p-2 z-20 border border-brown-200 dark:border-brown-700 w-64"
              >
                {POPULAR_TOKENS.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => {
                      setSelectedToken(token)
                      setShowTokenSelect(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brown-100 dark:hover:bg-brown-800/50 transition-colors"
                  >
                    <div className="relative w-8 h-8">
                      <Image
                        src={token.logo}
                        alt={token.symbol}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-brown-900 dark:text-brown-100">
                        {token.symbol}
                      </div>
                      <div className="text-xs text-brown-600 dark:text-brown-400">
                        {token.name}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bridge & Execute Options */}
        {bridgeMode === 'bridge-execute' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <label className="text-sm font-medium text-brown-700 dark:text-brown-300 mb-2 block">
              Execute Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setExecuteAction('swap')}
                className={`p-3 rounded-xl font-medium transition-all ${
                  executeAction === 'swap'
                    ? 'glass bg-gradient-to-r from-brown-500/20 to-purple-500/20 border-purple-500'
                    : 'glass hover:bg-brown-100 dark:hover:bg-brown-800/50'
                }`}
              >
                Swap
              </button>
              <button
                onClick={() => setExecuteAction('deposit')}
                className={`p-3 rounded-xl font-medium transition-all ${
                  executeAction === 'deposit'
                    ? 'glass bg-gradient-to-r from-brown-500/20 to-purple-500/20 border-purple-500'
                    : 'glass hover:bg-brown-100 dark:hover:bg-brown-800/50'
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setExecuteAction('stake')}
                className={`p-3 rounded-xl font-medium transition-all ${
                  executeAction === 'stake'
                    ? 'glass bg-gradient-to-r from-brown-500/20 to-purple-500/20 border-purple-500'
                    : 'glass hover:bg-brown-100 dark:hover:bg-brown-800/50'
                }`}
              >
                Stake
              </button>
            </div>
          </motion.div>
        )}

        {/* Route Info */}
        {bestRoute && amount && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 mb-6 border border-purple-200 dark:border-purple-800/50"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-brown-700 dark:text-brown-300">
                Best Route
              </span>
              <div className="flex items-center gap-1">
                <HiSparkles className="text-purple-500" />
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {bestRoute.protocol}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brown-600 dark:text-brown-400">Estimated Time</span>
                <span className="text-brown-900 dark:text-brown-100 font-medium">
                  ~{Math.ceil(bestRoute.estimatedTime / 60)} min
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown-600 dark:text-brown-400">Gas Cost</span>
                <span className="text-brown-900 dark:text-brown-100 font-medium">
                  Very Low
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown-600 dark:text-brown-400">Bridge Fee</span>
                <span className="text-brown-900 dark:text-brown-100 font-medium">
                  Very Low
                </span>
              </div>
              <div className="border-t border-brown-200 dark:border-brown-700 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-brown-700 dark:text-brown-300">You'll Receive</span>
                <span className="text-green-600 dark:text-green-400">
                  ~{estimatedOutput} {selectedToken.symbol}
                </span>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="mt-3 flex items-center gap-2">
              <FaShieldAlt className="text-green-500 text-sm" />
              <div className="flex-1 bg-brown-200 dark:bg-brown-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bestRoute.confidence}%` }}
                  className="h-full bg-gradient-to-r from-green-500 to-green-600"
                />
              </div>
              <span className="text-xs text-brown-600 dark:text-brown-400">
                {bestRoute.confidence}% confidence
              </span>
            </div>
          </motion.div>
        )}

        {/* Bridge Button */}
        <button
          onClick={handleBridge}
          disabled={txStatus === 'pending' || (isConnected && (!amount || parseFloat(amount) <= 0))}
          className={`
            w-full py-4 rounded-2xl font-bold text-white transition-all duration-300
            ${txStatus === 'pending' || (isConnected && (!amount || parseFloat(amount) <= 0))
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-brown-500 to-purple-500 hover:from-brown-600 hover:to-purple-600 shadow-xl hover:shadow-2xl transform hover:-translate-y-1'
            }
          `}
        >
          {txStatus === 'pending' ? (
            <span className="flex items-center justify-center gap-2">
              <FaClock className="animate-spin" />
              Processing...
            </span>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : !amount || parseFloat(amount) <= 0 ? (
            'Enter Amount'
          ) : (
            <span className="flex items-center justify-center gap-2">
              {bridgeMode === 'bridge' ? <FaExchangeAlt /> : <HiLightningBolt />}
              {bridgeMode === 'bridge' ? 'Bridge' : 'Bridge & Execute'}
            </span>
          )}
        </button>

        {/* Transaction Status */}
        {txHash && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-xl ${
              txStatus === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' 
                : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {txStatus === 'success' ? (
                  <FaCheckCircle className="text-green-500" />
                ) : (
                  <FaTimesCircle className="text-red-500" />
                )}
                <span className="text-sm font-medium text-brown-900 dark:text-brown-100">
                  Transaction {txStatus === 'success' ? 'Submitted' : 'Failed'}
                </span>
              </div>
              <a
                href={`${fromChain.explorer}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View
                <HiExternalLink />
              </a>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Advanced Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-center"
      >
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
        >
          <HiInformationCircle />
          Advanced Settings
          <FaChevronDown className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 glass rounded-2xl p-6 text-left"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-brown-700 dark:text-brown-300">
                    Slippage Tolerance
                  </label>
                  <div className="flex gap-2 mt-2">
                    {['0.1', '0.5', '1.0'].map((slippageOption) => (
                      <button
                        key={slippageOption}
                        onClick={() => {
                          setSlippage(slippageOption)
                          setCustomSlippage('')
                        }}
                        className={`px-3 py-1 rounded-lg glass text-sm transition-all ${
                          slippage === slippageOption && !customSlippage
                            ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                            : 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
                        }`}
                      >
                        {slippageOption}%
                      </button>
                    ))}
                    <input
                      type="number"
                      placeholder="Custom"
                      value={customSlippage}
                      onChange={(e) => {
                        setCustomSlippage(e.target.value)
                        if (e.target.value) {
                          setSlippage(e.target.value)
                        }
                      }}
                      className={`px-3 py-1 rounded-lg glass text-sm bg-transparent outline-none w-20 text-brown-900 dark:text-brown-100 ${
                        customSlippage ? 'border border-purple-300 dark:border-purple-700' : ''
                      }`}
                    />
                  </div>
                  <p className="text-xs text-brown-600 dark:text-brown-400 mt-1">
                    Current: {customSlippage || slippage}%
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-brown-700 dark:text-brown-300">
                    Gas Price
                  </label>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setGasSpeed('slow')}
                      className={`flex-1 px-3 py-2 rounded-lg glass text-sm transition-all ${
                        gasSpeed === 'slow'
                          ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                          : 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      <FaGasPump className="inline mr-1" />
                      Slow
                    </button>
                    <button
                      onClick={() => setGasSpeed('standard')}
                      className={`flex-1 px-3 py-2 rounded-lg glass text-sm transition-all ${
                        gasSpeed === 'standard'
                          ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                          : 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      <FaRocket className="inline mr-1" />
                      Standard
                    </button>
                    <button
                      onClick={() => setGasSpeed('fast')}
                      className={`flex-1 px-3 py-2 rounded-lg glass text-sm transition-all ${
                        gasSpeed === 'fast'
                          ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                          : 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      <HiLightningBolt className="inline mr-1" />
                      Fast
                    </button>
                  </div>
                  <p className="text-xs text-brown-600 dark:text-brown-400 mt-1">
                    Selected: {gasSpeed.charAt(0).toUpperCase() + gasSpeed.slice(1)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}