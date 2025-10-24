'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { ArrowLeftIcon, ArrowTrendingUpIcon, WalletIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import apiClient from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'
import { GemIcon, RewardIcon, ChartIcon, SeedIcon } from '@/components/CustomIcons'

export default function PortfolioPage() {
  const { address: connectedAddress, isConnected } = useAccount()
  const [manualAddress, setManualAddress] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  
  // Use connected wallet OR manual input (prioritize connected)
  const activeAddress = isConnected ? connectedAddress : searchAddress
  
  const handleAddressSearch = () => {
    if (!manualAddress) {
      toast.error('Please enter a valid Ethereum address')
      return
    }
    if (!manualAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Invalid Ethereum address format')
      return
    }
    setSearchAddress(manualAddress)
    toast.success('Loading positions...')
  }

  // Fetch YOUR actual positions from blockchain (NEW dashboard endpoint)
  // Works with connected wallet OR manual address input
  const { data: dashboardResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', activeAddress],
    queryFn: () => apiClient.dashboard.getMyPositions(activeAddress!),
    enabled: !!activeAddress,  // Enabled when wallet connected OR address entered
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  })

  // Extract data from response
  const dashboardData = (dashboardResponse as any)?.data || dashboardResponse
  
  // Convert to portfolio format for existing UI
  const portfolio = dashboardData ? {
    user: {
      walletAddress: activeAddress,
      ens: undefined,
    },
    portfolio: {
      totalValue: dashboardData.stats?.totalValueUSD || 0,
      totalEarnings: dashboardData.stats?.totalFees24h || 0,
      weightedAPY: dashboardData.stats?.avgAPY || 0,
      positionCount: dashboardData.stats?.totalPositions || 0,
    },
    positions: (dashboardData.positions || []).map((p: any) => ({
      id: p.id || p.poolAddress || 'unknown',
      pool: {
        id: p.poolAddress || 'unknown',
        name: p.poolName || 'Unknown Pool',
        asset: p.token0Symbol || p.asset || 'Unknown',
        poolAddress: p.poolAddress || '',
        protocol: {
          name: p.protocol || 'Unknown Protocol',
          chain: p.chain || 'ethereum',
        },
      },
      amount: p.token0Amount || p.amount || '0',
      amountUSD: p.totalValueUSD || 0,
      entryAPY: p.apy || 0,
      currentAPY: p.apy || 0,
      earnings: ((p.fees24h || 0) * 30).toString(),  // Estimate monthly
      earningsUSD: (p.fees24h || 0) * 30,
      startDate: p.lastUpdated || new Date().toISOString(),
      lastUpdated: p.lastUpdated || new Date().toISOString(),
    })),
  } : null

  if (error) {
    toast.error('Failed to load portfolio')
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value || isNaN(value)) return '$0.00'
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
    return `$${value.toFixed(2)}`
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch (e) {
      return 'Invalid Date'
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brown-600 dark:text-brown-400 hover:text-brown-800 dark:hover:text-brown-200 mb-8 transition-all duration-300 group"
        >
          <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back to Home</span>
        </Link>

        {/* Page Header with animated gradient */}
        <div className="mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-brown-800 via-purple-600 to-brown-800 dark:from-brown-200 dark:via-purple-400 dark:to-brown-200 bg-clip-text text-transparent mb-4 animate-[shine_3s_linear_infinite] bg-[length:200%_auto]">
            Your DeFi Journey
          </h1>
          <p className="text-lg text-brown-700 dark:text-brown-300 max-w-3xl leading-relaxed">
            Monitor your investments, track performance, and optimize your yield strategies all in one place.
          </p>
        </div>

        {/* Wallet Connection OR Address Input */}
        {!activeAddress ? (
          <div className="space-y-6">
            {/* Wallet Connection Option */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-brown-500 to-purple-500 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-all duration-500"></div>
              <div className="relative glass-dark rounded-3xl p-12 text-center backdrop-blur-sm border border-brown-200 dark:border-brown-700">
                <WalletIcon className="w-20 h-20 mx-auto mb-6 text-brown-700 dark:text-brown-200 animate-float" />
                <h2 className="text-3xl font-bold text-brown-900 dark:text-brown-100 mb-4">
                  Welcome to Your Personal Dashboard
                </h2>
                <p className="text-brown-700 dark:text-brown-300 mb-8 max-w-md mx-auto leading-relaxed">
                  Connect your wallet to unlock portfolio insights, track your positions, and discover new opportunities.
                </p>
                <div className="flex justify-center mb-6">
                  <ConnectButton />
                </div>
                
                {/* Divider */}
                <div className="flex items-center gap-4 my-8 max-w-md mx-auto">
                  <div className="flex-1 h-px bg-brown-300 dark:bg-brown-600"></div>
                  <span className="text-sm text-brown-600 dark:text-brown-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-brown-300 dark:bg-brown-600"></div>
                </div>
                
                {/* Manual Address Input */}
                <div className="max-w-lg mx-auto">
                  <label className="block text-left text-sm font-medium text-brown-700 dark:text-brown-300 mb-2">
                    Enter Your Address
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="0x..."
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                      className="flex-1 px-4 py-3 glass-dark border border-brown-300 dark:border-brown-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-brown-900 dark:text-brown-100 placeholder-brown-400 dark:placeholder-brown-500 transition-all"
                    />
                    <button
                      onClick={handleAddressSearch}
                      className="px-6 py-3 bg-gradient-to-r from-brown-600 to-purple-600 dark:from-brown-500 dark:to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                    >
                      <MagnifyingGlassIcon className="w-5 h-5" />
                      Search
                    </button>
                  </div>
                  <p className="text-xs text-brown-500 dark:text-brown-400 mt-2 text-left">
                    View your DeFi positions across 800+ protocols
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-brown-200 dark:bg-brown-800 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-brown-200 dark:bg-brown-800 rounded-2xl"></div>
          </div>
        ) : !portfolio || !portfolio.positions || portfolio.positions.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 border border-brown-200 dark:border-brown-700 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-brown-200 to-purple-200 dark:from-brown-700 dark:to-purple-700 flex items-center justify-center">
              <SeedIcon className="w-12 h-12 text-brown-700 dark:text-brown-200" />
            </div>
            <h3 className="text-2xl font-bold text-brown-900 dark:text-brown-100 mb-4">
              No Positions Found
            </h3>
            <p className="text-brown-700 dark:text-brown-300 mb-8 max-w-md mx-auto">
              {isConnected 
                ? "You don't have any DeFi positions yet. Start exploring yield opportunities!"
                : "This address has no DeFi positions. Try a different address or connect your wallet."}
            </p>
            {!isConnected && (
              <button
                onClick={() => {
                  setSearchAddress('')
                  setManualAddress('')
                }}
                className="inline-flex items-center gap-2 px-6 py-3 glass-dark border border-brown-300 dark:border-brown-600 rounded-xl font-medium hover:bg-brown-50 dark:hover:bg-brown-900/30 transition-all duration-300 text-brown-700 dark:text-brown-300 mb-4"
              >
                ← Try Another Address
              </button>
            )}
            <Link
              href="/pools"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brown-600 to-purple-600 dark:from-brown-500 dark:to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <span>Explore Opportunities</span>
              <span className="text-lg">→</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Portfolio Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Value Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-brown-400 dark:from-purple-600 dark:to-brown-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                <div className="relative glass-dark rounded-2xl p-6 transform transition-transform duration-300 hover:scale-[1.02]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm text-brown-700 dark:text-brown-300 font-medium">Positions Value</div>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 dark:bg-purple-400/20 flex items-center justify-center">
                      <GemIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-brown-900 dark:text-brown-100">
                    {formatCurrency(portfolio.portfolio.totalValue)}
                  </div>
                  <div className="text-xs text-brown-600 dark:text-brown-400 mt-1">
                    Across {Object.keys(dashboardData?.stats?.byProtocol || {}).length} protocols
                  </div>
                </div>
              </div>

              {/* Total Earnings Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 dark:from-green-600 dark:to-emerald-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                <div className="relative glass-dark rounded-2xl p-6 transform transition-transform duration-300 hover:scale-[1.02]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm text-brown-700 dark:text-brown-300 font-medium">Total Rewards</div>
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 dark:bg-green-400/20 flex items-center justify-center">
                      <RewardIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-brown-900 dark:text-brown-100">
                    {formatCurrency(portfolio.portfolio.totalEarnings)}
                  </div>
                  <div className="text-xs text-brown-600 dark:text-brown-400 mt-1">Lifetime earnings realized</div>
                </div>
              </div>

              {/* Weighted APY Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 dark:from-blue-600 dark:to-cyan-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                <div className="relative glass-dark rounded-2xl p-6 transform transition-transform duration-300 hover:scale-[1.02]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm text-brown-700 dark:text-brown-300 font-medium">Average Yield</div>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 dark:bg-blue-400/20 flex items-center justify-center">
                      <ChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-brown-900 dark:text-brown-100">
                    {portfolio.portfolio.weightedAPY.toFixed(2)}%
                  </div>
                  <div className="text-xs text-brown-600 dark:text-brown-400 mt-1">Weighted by position size</div>
                </div>
              </div>
            </div>

            {/* Wallet Info with Data Source */}
            <div className="glass-dark rounded-2xl p-6 border border-brown-200 dark:border-brown-700 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-sm text-brown-600 dark:text-brown-400 font-medium">
                      {isConnected ? 'Connected Wallet' : 'Viewing Address'}
                    </div>
                    {dashboardData?.meta?.dataSource && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium">
                        via {dashboardData.meta.dataSource}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-lg font-semibold text-brown-900 dark:text-brown-100">
                    {portfolio.user.ens || `${activeAddress?.slice(0, 8)}...${activeAddress?.slice(-6)}`}
                  </div>
                  {!isConnected && searchAddress && (
                    <button
                      onClick={() => {
                        setSearchAddress('')
                        setManualAddress('')
                      }}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline mt-2"
                    >
                      ← Search different address
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-brown-600 dark:text-brown-400 font-medium">Active Positions</div>
                    <div className="text-2xl font-bold text-brown-900 dark:text-brown-100">
                      {portfolio.portfolio.positionCount}
                    </div>
                  </div>
                  {isConnected && <ConnectButton />}
                </div>
              </div>
            </div>

            {/* Positions Table */}
            <div className="glass-dark rounded-2xl border border-brown-200 dark:border-brown-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-brown-200 dark:border-brown-700 bg-gradient-to-r from-brown-50/50 to-purple-50/50 dark:from-brown-900/30 dark:to-purple-900/30">
                <h3 className="text-xl font-semibold text-brown-900 dark:text-brown-100">Your Active Positions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brown-50/50 dark:bg-brown-900/30 border-b border-brown-200 dark:border-brown-700">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-brown-700 dark:text-brown-300">Pool</th>
                      <th className="px-6 py-4 text-left font-semibold text-brown-700 dark:text-brown-300">Amount</th>
                      <th className="px-6 py-4 text-left font-semibold text-brown-700 dark:text-brown-300">Value (USD)</th>
                      <th className="px-6 py-4 text-left font-semibold text-brown-700 dark:text-brown-300">Entry APY</th>
                      <th className="px-6 py-4 text-left font-semibold text-brown-700 dark:text-brown-300">Current APY</th>
                      <th className="px-6 py-4 text-left font-semibold text-brown-700 dark:text-brown-300">Earnings</th>
                      <th className="px-6 py-4 text-left font-semibold text-brown-700 dark:text-brown-300">Since</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-200 dark:divide-brown-700">
                    {portfolio.positions.map((position: any) => (
                      <tr
                        key={position.id}
                        className="hover:bg-brown-50/50 dark:hover:bg-brown-900/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link href={`/pool/${position.pool.id}`} className="block group">
                            <div className="font-semibold text-brown-900 dark:text-brown-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {position.pool.name}
                            </div>
                            <div className="text-sm text-brown-600 dark:text-brown-400">
                              {position.pool.protocol.name} • {position.pool.protocol.chain.toUpperCase()}
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-brown-900 dark:text-brown-100">
                            {Number(position.amount).toFixed(4)} {position.pool.asset}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-brown-900 dark:text-brown-100">
                            {formatCurrency(position.amountUSD)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-brown-700 dark:text-brown-300">
                            {position.entryAPY.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {position.currentAPY.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            +{formatCurrency(position.earningsUSD)}
                          </div>
                          <div className="text-xs text-brown-500 dark:text-brown-400">
                            {Number(position.earnings).toFixed(4)} {position.pool.asset}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-brown-600 dark:text-brown-400">
                            {formatDate(position.startDate)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
