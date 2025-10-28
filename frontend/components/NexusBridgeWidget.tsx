'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi'
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
import { useNexus } from '@avail-project/nexus-widgets'
import { SUPPORTED_CHAINS, type SUPPORTED_CHAINS_IDS, type SUPPORTED_TOKENS } from '@avail-project/nexus-core'

// Chain configuration with logos
const CHAIN_CONFIG = [
  {
    id: SUPPORTED_CHAINS.ETHEREUM,
    chainId: 1,
    name: 'Ethereum',
    logo: '/chains/ethereum.png',
    color: 'bg-white',
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
  const { sdk: nexusSDK, isSdkInitialized: isInitialized, initializeSdk } = useNexus()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // Bridge state - default source chain to Base (chainId: 8453) even when wallet not connected
  const [selectedChain, setSelectedChain] = useState(CHAIN_CONFIG[0])
  const [selectedToken, setSelectedToken] = useState(TOKENS[0])
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hardcodedChains, setHardcodedChains] = useState<{ sourceChainId: number; destinationChainId: number } | null>(null)

  // Default to Base chain (chainId: 8453) for display when wallet not connected
  const defaultSourceChainId = 8453 // Base
  const effectiveSourceChainId = isConnected ? chainId : defaultSourceChainId
  
  // UI state
  const [showChainSelect, setShowChainSelect] = useState(false)
  const [showSourceChainSelect, setShowSourceChainSelect] = useState(false)
  const [showTokenSelect, setShowTokenSelect] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [intentData, setIntentData] = useState<any>(null)
  const [showIntentModal, setShowIntentModal] = useState(false)
  const [isBridgeLocked, setIsBridgeLocked] = useState(false)
  
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

  // Handle intent hook - removed as it's now handled by the SDK automatically
  
  // Handle allowance hook - removed as it's now handled by the SDK automatically

  // Auto-initialize SDK when wallet connects and auto-switch to Base if not already on it
  useEffect(() => {
    if (isConnected && !isInitialized) {
      console.log('Wallet connected, auto-initializing Nexus SDK')
      initializeSdk()
    }

    // Auto-switch to Base (chainId: 8453) when wallet connects if not already on Base
    if (isConnected && chainId !== 8453 && !hardcodedChains) {
      console.log('Auto-switching to Base as default source chain')
      switchChain({ chainId: 8453 })
    }
  }, [isConnected, isInitialized, initializeSdk, chainId, switchChain, hardcodedChains])

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

    // Hardcode the chains when bridge starts - disconnect from wallet chain switching
    setHardcodedChains({
      sourceChainId: effectiveSourceChainId,
      destinationChainId: selectedChain.chainId
    })
    setIsBridgeLocked(true)
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
      // Unlock the bridge interface and clear hardcoded chains after transaction completes (success or error)
      setTimeout(() => {
        setIsBridgeLocked(false)
        setHardcodedChains(null)
      }, 2000) // Small delay to show final status
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

      {/* Source Chain */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Source Chain {hardcodedChains && <span className="text-orange-500 ml-2">Bridge in Progress...</span>}
        </label>
        <div className="relative">
          {hardcodedChains ? (
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              {(() => {
                const displayChainId = hardcodedChains.sourceChainId
                const currentChain = CHAIN_CONFIG.find(chain => chain.chainId === displayChainId)
                return (
                  <>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentChain?.color || 'bg-gray-400'} flex items-center justify-center overflow-hidden`}>
                      <Image
                        src={currentChain?.logo || '/chains/ethereum.png'}
                        alt={currentChain?.name || 'Unknown Chain'}
                        width={40}
                        height={40}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {currentChain?.name || 'Unknown Chain'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Chain ID: {displayChainId}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowSourceChainSelect(!showSourceChainSelect)}
                className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentChain = CHAIN_CONFIG.find(chain => chain.chainId === effectiveSourceChainId)
                    return (
                      <>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentChain?.color || 'bg-gray-400'} flex items-center justify-center overflow-hidden`}>
                          <Image
                            src={currentChain?.logo || '/chains/ethereum.png'}
                            alt={currentChain?.name || 'Unknown Chain'}
                            width={40}
                            height={40}
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {currentChain?.name || 'Unknown Chain'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Chain ID: {effectiveSourceChainId}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <FaChevronDown className={`text-gray-600 dark:text-gray-400 transition-transform ${showSourceChainSelect ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSourceChainSelect && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full glass rounded-2xl p-2 z-20 border border-gray-200 dark:border-gray-700"
                  >
                    {CHAIN_CONFIG.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => {
                          switchChain({ chainId: chain.chainId })
                          setShowSourceChainSelect(false)
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
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
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {chain.name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Destination Chain */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Destination Chain
          </label>
          <div className="relative">
            {hardcodedChains ? (
              <div className="glass rounded-2xl p-4 flex items-center gap-3">
                {(() => {
                  const displayChainId = hardcodedChains.destinationChainId
                  const displayChain = CHAIN_CONFIG.find(chain => chain.chainId === displayChainId) || selectedChain
                  return (
                    <>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${displayChain.color} flex items-center justify-center overflow-hidden`}>
                        <Image
                          src={displayChain.logo}
                          alt={displayChain.name}
                          width={40}
                          height={40}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {displayChain.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Chain ID: {displayChainId}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <>
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
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {selectedChain.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Chain ID: {selectedChain.chainId}
                      </div>
                    </div>
                  </div>
                  <FaChevronDown className={`text-gray-600 dark:text-gray-400 transition-transform ${showChainSelect ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showChainSelect && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 w-full glass rounded-2xl p-2 z-20 border border-gray-200 dark:border-gray-700"
                    >
                      {CHAIN_CONFIG.map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => {
                            setSelectedChain(chain)
                            setShowChainSelect(false)
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
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
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {chain.name}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>

        {/* Token & Amount */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Amount
          </label>
          <div className={`glass rounded-2xl p-4 ${hardcodedChains ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              {hardcodedChains ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass">
                  <div className="relative w-6 h-6">
                    <Image
                      src={selectedToken.logo}
                      alt={selectedToken.symbol}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedToken.symbol}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setShowTokenSelect(!showTokenSelect)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="relative w-6 h-6">
                    <Image
                      src={selectedToken.logo}
                      alt={selectedToken.symbol}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedToken.symbol}
                  </span>
                  <FaChevronDown className="text-gray-600 dark:text-gray-400" />
                </button>
              )}

              <input
                type="number"
                value={amount}
                onChange={(e) => !hardcodedChains && setAmount(e.target.value)}
                disabled={!!hardcodedChains}
                placeholder="0.0"
                className={`flex-1 bg-transparent text-2xl font-bold text-gray-900 dark:text-gray-100 outline-none text-right ${
                  hardcodedChains ? 'cursor-not-allowed' : ''
                }`}
              />
            </div>

            {balance && (
              <div className="flex justify-between items-center mt-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Balance: {parseFloat(balance.formatted).toFixed(4)} {selectedToken.symbol}
                </span>
                <button
                  onClick={() => !hardcodedChains && setAmount(balance.formatted)}
                  disabled={!!hardcodedChains}
                  className={`font-medium ${
                    hardcodedChains ? 'text-gray-400 cursor-not-allowed' : 'text-purple-500 hover:text-purple-600'
                  }`}
                >
                  MAX
                </button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showTokenSelect && !hardcodedChains && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute mt-2 glass rounded-2xl p-2 z-20 border border-gray-200 dark:border-gray-700 w-64"
              >
                {TOKENS.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => {
                      setSelectedToken(token)
                      setShowTokenSelect(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
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
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {token.symbol}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {token.name}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Estimated Output */}
        {amount && parseFloat(amount) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 mb-6 border border-purple-200 dark:border-purple-800/50"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                <span className="text-gray-600 dark:text-gray-400">Estimated Time</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  ~3-5 min
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Bridge Fee</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  0.3%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Slippage</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {customSlippage || slippage}%
                </span>
              </div>
              <div className="border-t border-brown-200 dark:border-brown-700 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-gray-700 dark:text-gray-300">You'll Receive</span>
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
          disabled={isLoading || !!hardcodedChains || (isConnected && (!amount || parseFloat(amount) <= 0 || !isInitialized))}
          className={`
            w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 border border-brown-600
            ${isLoading || hardcodedChains || (isConnected && (!amount || parseFloat(amount) <= 0 || !isInitialized))
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-brown-500 to-purple-500 hover:from-brown-600 hover:to-purple-600 shadow-xl hover:shadow-2xl transform hover:-translate-y-1'
            }
          `}
        >
          {hardcodedChains ? (
            <span className="flex items-center justify-center gap-2">
              <FaClock className="animate-spin" />
              Bridge in Progress...
            </span>
          ) : isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <FaClock className="animate-spin" />
              Processing...
            </span>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : !isInitialized ? (
            'Please Wait...'
          ) : !amount || parseFloat(amount) <= 0 ? (
            'Enter Amount'
          ) : (
            <span className="flex items-center justify-center gap-2">
              <FaExchangeAlt />
              Bridge
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
              <div className="flex items-center gap-2">
                {txStatus === 'error' && (
                  <button
                    onClick={handleBridge}
                    className="px-3 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                )}
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
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
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
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Current: {customSlippage || slippage}%
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gas Price
                  </label>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setGasSpeed('slow')}
                      className={`flex-1 px-3 py-2 rounded-lg glass text-sm transition-all ${
                        gasSpeed === 'slow'
                          ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
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
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
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
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
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