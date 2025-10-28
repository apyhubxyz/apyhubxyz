'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useBalance } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { parseEther, formatEther } from 'viem'
import Image from 'next/image'
import {
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
import { useNexus } from '../providers/NexusProvider'
import { SUPPORTED_CHAINS, type SUPPORTED_CHAINS_IDS, type SUPPORTED_TOKENS } from '@avail-project/nexus-core'

// Chain configuration with logos
const CHAIN_CONFIG = [
  {
    id: SUPPORTED_CHAINS.ETHEREUM,
    chainId: 1,
    name: 'Ethereum',
    logo: '/chains/ethereum.png',
    color: 'from-white to-gray-50 dark:from-gray-800 dark:to-gray-700',
    nativeCurrency: 'ETH',
    explorer: 'https://etherscan.io'
  },
  {
    id: SUPPORTED_CHAINS.ARBITRUM,
    chainId: 42161,
    name: 'Arbitrum',
    logo: '/chains/arbitrum.jpeg',
    color: 'from-blue-400 to-cyan-500',
    nativeCurrency: 'ETH',
    explorer: 'https://arbiscan.io'
  },
  {
    id: SUPPORTED_CHAINS.OPTIMISM,
    chainId: 10,
    name: 'Optimism',
    logo: '/chains/optimism.jpeg',
    color: 'from-red-500 to-red-600',
    nativeCurrency: 'ETH',
    explorer: 'https://optimistic.etherscan.io'
  },
  {
    id: SUPPORTED_CHAINS.BASE,
    chainId: 8453,
    name: 'Base',
    logo: '/chains/base.jpeg',
    color: 'from-blue-600 to-indigo-600',
    nativeCurrency: 'ETH',
    explorer: 'https://basescan.org'
  },
  {
    id: SUPPORTED_CHAINS.POLYGON,
    chainId: 137,
    name: 'Polygon',
    logo: '/chains/polygon.png',
    color: 'from-purple-500 to-purple-600',
    nativeCurrency: 'MATIC',
    explorer: 'https://polygonscan.com'
  }
]

// Token configuration
const TOKENS: { symbol: SUPPORTED_TOKENS; name: string; logo: string; address: string }[] = [
  { symbol: 'ETH' as SUPPORTED_TOKENS, name: 'Ethereum', logo: '/tokens/eth.svg', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDC' as SUPPORTED_TOKENS, name: 'USD Coin', logo: '/tokens/usdc.svg', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { symbol: 'USDT' as SUPPORTED_TOKENS, name: 'Tether', logo: '/tokens/usdt.svg', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
]

export default function NexusBridgeWidget() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { nexusSDK, isInitialized, intentRefCallback, allowanceRefCallback, handleInit } = useNexus()
  
  // Bridge state
  const [selectedChain, setSelectedChain] = useState(CHAIN_CONFIG[0])
  const [selectedToken, setSelectedToken] = useState(TOKENS[0])
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [bridgeMode, setBridgeMode] = useState<'bridge' | 'bridge-execute'>('bridge')
  const [executeAction, setExecuteAction] = useState<'swap' | 'deposit' | 'stake'>('swap')
  
  // UI state
  const [showChainSelect, setShowChainSelect] = useState(false)
  const [showTokenSelect, setShowTokenSelect] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [intentData, setIntentData] = useState<any>(null)
  const [showIntentModal, setShowIntentModal] = useState(false)
  
  // Advanced settings
  const [slippage, setSlippage] = useState('0.5')
  const [customSlippage, setCustomSlippage] = useState('')
  const [gasSpeed, setGasSpeed] = useState<'slow' | 'standard' | 'fast'>('standard')

  // Get balance
  const { data: balance } = useBalance({
    address: address,
    token: selectedToken.address === '0x0000000000000000000000000000000000000000' 
      ? undefined
      : selectedToken.address as `0x${string}`,
  })

  // Handle intent hook
  useEffect(() => {
    if (intentRefCallback?.current) {
      const { intent, allow, deny } = intentRefCallback.current
      setIntentData(intent)
      setShowIntentModal(true)
      
      // Auto-approve after showing to user (for demo)
      // In production, wait for user confirmation
      setTimeout(() => {
        allow()
        setShowIntentModal(false)
      }, 3000)
    }
  }, [intentRefCallback?.current])

  // Handle allowance hook
  useEffect(() => {
    if (allowanceRefCallback?.current) {
      const { sources, allow, deny } = allowanceRefCallback.current
      
      // Auto-approve max allowances (for demo)
      // In production, show UI for user to select
      const allowances = sources.map(() => 'max')
      allow(allowances)
    }
  }, [allowanceRefCallback?.current])

  const handleBridge = async () => {
    if (!isConnected) {
      if (openConnectModal) {
        openConnectModal()
      }
      return
    }

    if (!nexusSDK || !isInitialized) {
      toast.error('Nexus SDK not initialized. Please connect your wallet.')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    setTxStatus('pending')
    
    try {
      console.log('Starting bridge with params:', {
        token: selectedToken.symbol,
        amount: amount,
        chainId: selectedChain.id
      })

      const bridgeResult = await nexusSDK.bridge({
        token: selectedToken.symbol,
        amount: amount,
        chainId: selectedChain.id,
      })

      if (bridgeResult?.success) {
        console.log('Bridge successful!')
        console.log('Explorer URL:', bridgeResult.explorerUrl)
        
        setTxStatus('success')
        setTxHash(bridgeResult.explorerUrl || '')
        toast.success('Bridge transaction successful!')
        
        // Reset form
        setAmount('')
      } else {
        throw new Error('Bridge transaction failed')
      }
    } catch (error) {
      console.error('Bridge failed:', error)
      setTxStatus('error')
      toast.error('Bridge transaction failed: ' + (error as any).message)
    } finally {
      setIsLoading(false)
      // intentRefCallback is managed by the provider
    }
  }

  // Estimated output calculation
  const estimatedOutput = useMemo(() => {
    if (!amount || parseFloat(amount) === 0) return '0'
    const amountNum = parseFloat(amount)
    const slippageNum = parseFloat(customSlippage || slippage) / 100
    const feeNum = 0.003 // 0.3% bridge fee
    const output = amountNum * (1 - slippageNum - feeNum)
    return output.toFixed(6)
  }, [amount, slippage, customSlippage])

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Bridge Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-dark rounded-3xl p-8 border border-purple-200 dark:border-purple-800/50 shadow-2xl"
      >
        {/* SDK Status */}
        {!isInitialized && isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl border border-yellow-300 dark:border-yellow-700"
          >
            <div className="flex items-start gap-3">
              <FaClock className="text-yellow-600 dark:text-yellow-400 mt-0.5 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Initializing Nexus SDK...
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                  This may take up to 30 seconds. If it takes longer, please try again.
                </p>
                <button
                  onClick={() => {
                    console.log('Manual retry requested')
                    handleInit()
                  }}
                  className="text-xs bg-yellow-200 dark:bg-yellow-800 hover:bg-yellow-300 dark:hover:bg-yellow-700 text-yellow-900 dark:text-yellow-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Retry Initialization
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
              Bridge & Execute
            </button>
          </div>
        </div>

        {/* Destination Chain */}
        <div className="mb-6">
          <label className="text-sm font-medium text-brown-700 dark:text-brown-300 mb-2 block">
            Destination Chain
          </label>
          <div className="relative">
            <button
              onClick={() => setShowChainSelect(!showChainSelect)}
              className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedChain.color} flex items-center justify-center overflow-hidden`}>
                  <Image
                    src={selectedChain.logo}
                    alt={selectedChain.name}
                    width={40}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-brown-900 dark:text-brown-100">
                    {selectedChain.name}
                  </div>
                  <div className="text-xs text-brown-600 dark:text-brown-400">
                    Chain ID: {selectedChain.chainId}
                  </div>
                </div>
              </div>
              <FaChevronDown className={`text-brown-600 dark:text-brown-400 transition-transform ${showChainSelect ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showChainSelect && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full glass rounded-2xl p-2 z-20 border border-brown-200 dark:border-brown-700"
                >
                  {CHAIN_CONFIG.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setSelectedChain(chain)
                        setShowChainSelect(false)
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
                {TOKENS.map((token) => (
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

        {/* Estimated Output */}
        {amount && parseFloat(amount) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 mb-6 border border-purple-200 dark:border-purple-800/50"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-brown-700 dark:text-brown-300">
                Bridge Details
              </span>
              <div className="flex items-center gap-1">
                <HiSparkles className="text-purple-500" />
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  Avail Nexus
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brown-600 dark:text-brown-400">Estimated Time</span>
                <span className="text-brown-900 dark:text-brown-100 font-medium">
                  ~3-5 min
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown-600 dark:text-brown-400">Bridge Fee</span>
                <span className="text-brown-900 dark:text-brown-100 font-medium">
                  0.3%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown-600 dark:text-brown-400">Slippage</span>
                <span className="text-brown-900 dark:text-brown-100 font-medium">
                  {customSlippage || slippage}%
                </span>
              </div>
              <div className="border-t border-brown-200 dark:border-brown-700 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-brown-700 dark:text-brown-300">You'll Receive</span>
                <span className="text-green-600 dark:text-green-400">
                  ~{estimatedOutput} {selectedToken.symbol}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bridge Button */}
        <button
          onClick={handleBridge}
          disabled={isLoading || (isConnected && (!amount || parseFloat(amount) <= 0 || !isInitialized))}
          className={`
            w-full py-4 rounded-2xl font-bold text-white transition-all duration-300
            ${isLoading || (isConnected && (!amount || parseFloat(amount) <= 0 || !isInitialized))
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-brown-500 to-purple-500 hover:from-brown-600 hover:to-purple-600 shadow-xl hover:shadow-2xl transform hover:-translate-y-1'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <FaClock className="animate-spin" />
              Processing...
            </span>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : !isInitialized ? (
            'Initializing SDK...'
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
              {txHash && (
                <a
                  href={txHash}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  View
                  <HiExternalLink />
                </a>
              )}
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

      {/* Intent Modal */}
      <AnimatePresence>
        {showIntentModal && intentData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowIntentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-dark rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-brown-900 dark:text-brown-100 mb-4">
                Bridge Intent
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-brown-700 dark:text-brown-300">
                  Processing your bridge transaction...
                </p>
                <div className="glass rounded-xl p-4">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(intentData, null, 2)}
                  </pre>
                </div>
                <p className="text-xs text-brown-600 dark:text-brown-400">
                  Auto-approving in 3 seconds...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}