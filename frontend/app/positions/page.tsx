'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Token {
  symbol: string;
  address: string;
  decimals: number;
}

interface LPPosition {
  id: string;
  protocol: string;
  chain: string;
  chainId: number;
  poolAddress: string;
  poolName: string;
  token0: Token;
  token1: Token;
  tvl: string;
  apy: number;
  volume24h: string;
  fees24h: string;
  userAddress?: string;
  userBalance?: string;
  userShare?: number;
  timestamp: number;
}

interface Protocol {
  name: string;
  logo: string;
  tvl: string;
  chains: number[];
}

interface Chain {
  id: number;
  name: string;
  logo: string;
}

interface PositionStats {
  totalPositions: number;
  totalTVL: string;
  averageAPY: number;
  protocolBreakdown: { [protocol: string]: number };
  chainBreakdown: { [chain: string]: number };
}

const CHAIN_COLORS: { [key: string]: string } = {
  'Ethereum': 'bg-blue-500',
  'Optimism': 'bg-red-500',
  'Arbitrum': 'bg-blue-600',
  'Base': 'bg-blue-700',
  'Polygon': 'bg-purple-500',
  'BSC': 'bg-yellow-500',
};

export default function PositionsPage() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<LPPosition[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<LPPosition[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [stats, setStats] = useState<PositionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('all');
  const [selectedChain, setSelectedChain] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'tvl' | 'apy' | 'volume24h'>('tvl');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showUserPositions, setShowUserPositions] = useState(false);

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, [address]);

  // Apply filters
  useEffect(() => {
    let filtered = [...positions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.poolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.token0.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.token1.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.protocol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Protocol filter
    if (selectedProtocol !== 'all') {
      filtered = filtered.filter(p => p.protocol === selectedProtocol);
    }

    // Chain filter
    if (selectedChain !== 0) {
      filtered = filtered.filter(p => p.chainId === selectedChain);
    }

    // User positions filter
    if (showUserPositions && address) {
      filtered = filtered.filter(p => p.userBalance && parseFloat(p.userBalance) > 0);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = sortBy === 'apy' ? a[sortBy] : parseFloat(a[sortBy]);
      let bVal = sortBy === 'apy' ? b[sortBy] : parseFloat(b[sortBy]);
      
      if (sortOrder === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    setFilteredPositions(filtered);
  }, [positions, searchQuery, selectedProtocol, selectedChain, sortBy, sortOrder, showUserPositions, address]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch positions
      const positionsRes = await fetch(`/api/positions${address ? `?userAddress=${address}` : ''}`);
      const positionsData = await positionsRes.json();
      if (positionsData.success) {
        setPositions(positionsData.data);
      }

      // Fetch protocols
      const protocolsRes = await fetch('/api/positions/protocols');
      const protocolsData = await protocolsRes.json();
      if (protocolsData.success) {
        setProtocols(protocolsData.data);
      }

      // Fetch chains
      const chainsRes = await fetch('/api/positions/chains');
      const chainsData = await chainsRes.json();
      if (chainsData.success) {
        setChains(chainsData.data);
      }

      // Fetch stats
      const statsRes = await fetch(`/api/positions/stats${address ? `?userAddress=${address}` : ''}`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: string | number): string => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatAPY = (apy: number): string => {
    return `${apy.toFixed(2)}%`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openExplorer = (address: string, chainId: number) => {
    const explorers: { [key: number]: string } = {
      1: 'https://etherscan.io/address/',
      10: 'https://optimistic.etherscan.io/address/',
      137: 'https://polygonscan.com/address/',
      42161: 'https://arbiscan.io/address/',
      8453: 'https://basescan.org/address/',
      56: 'https://bscscan.com/address/',
    };
    window.open(`${explorers[chainId]}${address}`, '_blank');
  };

  const toggleSort = (field: 'tvl' | 'apy' | 'volume24h') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">LP Positions Hub</h1>
          <p className="text-gray-400">
            Discover and track liquidity positions across 50+ DeFi protocols
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Positions</p>
                  <p className="text-2xl font-bold">{stats.totalPositions}</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total TVL</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.totalTVL)}</p>
                </div>
                <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Average APY</p>
                  <p className="text-2xl font-bold">{formatAPY(stats.averageAPY)}</p>
                </div>
                <SparklesIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Protocols</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.protocolBreakdown).length}</p>
                </div>
                <BanknotesIcon className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Protocol Filter */}
            <select
              value={selectedProtocol}
              onChange={(e) => setSelectedProtocol(e.target.value)}
              className="px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Protocols</option>
              {protocols.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>

            {/* Chain Filter */}
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(Number(e.target.value))}
              className="px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="0">All Chains</option>
              {chains.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'tvl' | 'apy' | 'volume24h');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="tvl-desc">TVL High to Low</option>
              <option value="tvl-asc">TVL Low to High</option>
              <option value="apy-desc">APY High to Low</option>
              <option value="apy-asc">APY Low to High</option>
              <option value="volume24h-desc">Volume High to Low</option>
              <option value="volume24h-asc">Volume Low to High</option>
            </select>

            {/* User Positions Toggle */}
            {isConnected && (
              <button
                onClick={() => setShowUserPositions(!showUserPositions)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showUserPositions 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                My Positions
              </button>
            )}
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900 text-gray-400 text-sm">
                  <th className="px-6 py-4 text-left">Protocol</th>
                  <th className="px-6 py-4 text-left">Chain</th>
                  <th className="px-6 py-4 text-left">Pool</th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('tvl')}>
                    <div className="flex items-center justify-end">
                      TVL
                      {sortBy === 'tvl' && (sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('apy')}>
                    <div className="flex items-center justify-end">
                      APY
                      {sortBy === 'apy' && (sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('volume24h')}>
                    <div className="flex items-center justify-end">
                      24h Volume
                      {sortBy === 'volume24h' && (sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">24h Fees</th>
                  {isConnected && <th className="px-6 py-4 text-right">Your Position</th>}
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((position) => (
                  <tr key={position.id} className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{position.protocol}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${CHAIN_COLORS[position.chain]}`}></span>
                        <span className="text-sm">{position.chain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{position.poolName}</div>
                        <div className="text-sm text-gray-400">
                          {position.token0.symbol}/{position.token1.symbol}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium">{formatNumber(position.tvl)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-medium ${position.apy > 10 ? 'text-green-400' : position.apy > 5 ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {formatAPY(position.apy)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm">{formatNumber(position.volume24h)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-400">{formatNumber(position.fees24h)}</div>
                    </td>
                    {isConnected && (
                      <td className="px-6 py-4 text-right">
                        {position.userBalance && parseFloat(position.userBalance) > 0 ? (
                          <div>
                            <div className="font-medium">{formatNumber(position.userBalance)}</div>
                            <div className="text-sm text-gray-400">
                              {((position.userShare || 0) * 100).toFixed(2)}% share
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(position.poolAddress)}
                          className="p-1.5 hover:bg-gray-600 rounded transition-colors"
                          title="Copy address"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openExplorer(position.poolAddress, position.chainId)}
                          className="p-1.5 hover:bg-gray-600 rounded transition-colors"
                          title="View on explorer"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPositions.length === 0 && (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No positions found matching your filters</p>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-center text-gray-400">
          Showing {filteredPositions.length} of {positions.length} positions
        </div>
      </div>
    </div>
  );
}