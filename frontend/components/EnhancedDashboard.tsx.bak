'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  useEnhancedPositions, 
  useProtocolStatistics, 
  useTopOpportunities,
  usePortfolioAnalysis,
  useWebSocket,
  useAIRecommendations
} from '@/hooks/useEnhancedAPI'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  DollarSign, 
  Activity,
  Brain,
  Link,
  AlertCircle
} from 'lucide-react'

export function EnhancedDashboard() {
  const { address, isConnected } = useAccount()
  const [selectedChains, setSelectedChains] = useState(['ethereum', 'arbitrum'])
  const [riskFilter, setRiskFilter] = useState<string[]>(['LOW', 'MEDIUM'])
  const [minAPY, setMinAPY] = useState(5)

  // Fetch enhanced data
  const { data: positions, isLoading: positionsLoading } = useEnhancedPositions({
    chains: selectedChains,
    riskLevels: riskFilter,
    minAPY,
    sortBy: 'apy',
    sortOrder: 'desc',
    limit: 50
  })

  const { data: stats } = useProtocolStatistics()
  const { data: opportunities } = useTopOpportunities('stable', 10)
  const { data: portfolioAnalysis } = usePortfolioAnalysis()
  const aiRecommendations = useAIRecommendations()

  // WebSocket for real-time updates
  const { isConnected: wsConnected, lastMessage } = useWebSocket(['positions', 'prices'])

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'position_update') {
      console.log('Position updated:', lastMessage.data)
    }
  }, [lastMessage])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'HIGH': return 'text-orange-600 bg-orange-50'
      case 'VERY_HIGH': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Protocols</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProtocols || 52}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.auditedProtocols || 45} audited
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total TVL</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalTVL || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Across all protocols
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average APY</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageAPY?.toFixed(2) || '12.5'}%</div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Updates</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wsConnected ? 'Connected' : 'Offline'}</div>
            <p className="text-xs text-muted-foreground">
              Real-time via WebSocket
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium">Chains</label>
              <div className="flex gap-2 mt-1">
                {['ethereum', 'arbitrum', 'optimism', 'base', 'polygon'].map(chain => (
                  <Badge
                    key={chain}
                    variant={selectedChains.includes(chain) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedChains(prev =>
                        prev.includes(chain)
                          ? prev.filter(c => c !== chain)
                          : [...prev, chain]
                      )
                    }}
                  >
                    {chain}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Risk Levels</label>
              <div className="flex gap-2 mt-1">
                {['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].map(risk => (
                  <Badge
                    key={risk}
                    variant={riskFilter.includes(risk) ? 'default' : 'outline'}
                    className={`cursor-pointer ${getRiskColor(risk)}`}
                    onClick={() => {
                      setRiskFilter(prev =>
                        prev.includes(risk)
                          ? prev.filter(r => r !== risk)
                          : [...prev, risk]
                      )
                    }}
                  >
                    {risk}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Min APY: {minAPY}%</label>
              <input
                type="range"
                min="0"
                max="50"
                value={minAPY}
                onChange={(e) => setMinAPY(Number(e.target.value))}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="positions">Top Positions</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="ai">AI Strategies</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Top Yield Positions (50+ Protocols)</CardTitle>
            </CardHeader>
            <CardContent>
              {positionsLoading ? (
                <div className="text-center py-8">Loading positions from 50+ protocols...</div>
              ) : (
                <div className="space-y-2">
                  {positions?.slice(0, 20).map((position: any, index: number) => (
                    <div key={position.poolAddress} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold">#{index + 1}</div>
                        <div>
                          <div className="font-semibold">{position.protocolName}</div>
                          <div className="text-sm text-muted-foreground">
                            {position.poolName} • {position.chain}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-green-600">{position.apy.toFixed(2)}% APY</div>
                          <div className="text-sm text-muted-foreground">
                            TVL: {formatNumber(position.tvlUsd)}
                          </div>
                        </div>
                        <Badge className={getRiskColor(position.riskLevel)}>
                          {position.riskLevel}
                        </Badge>
                        {position.isLoopable && (
                          <Badge variant="secondary">
                            <Zap className="h-3 w-3 mr-1" />
                            Loopable
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <CardTitle>Top Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {opportunities?.map((opp: any) => (
                  <div key={opp.poolAddress} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{opp.protocolName} - {opp.poolName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {opp.assets.join(' / ')} • {opp.chain}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{opp.apy.toFixed(2)}% APY</div>
                        <Badge className={getRiskColor(opp.riskLevel)}>{opp.riskLevel}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Strategy Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => aiRecommendations.mutate({
                      totalValue: 10000,
                      riskTolerance: 'MEDIUM',
                      chains: selectedChains
                    })}
                    disabled={!isConnected || aiRecommendations.isPending}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Get AI Recommendations
                  </Button>
                </div>

                {aiRecommendations.data && (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-semibold mb-2">
                      {aiRecommendations.data.recommendation.strategy}
                    </h4>
                    <p className="text-sm mb-3">
                      {aiRecommendations.data.recommendation.description}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span className="font-medium">
                        Expected APY: {aiRecommendations.data.recommendation.expectedAPY}%
                      </span>
                      <Badge className={getRiskColor(aiRecommendations.data.recommendation.risk)}>
                        {aiRecommendations.data.recommendation.risk}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Steps:</p>
                      <ol className="text-sm space-y-1">
                        {aiRecommendations.data.recommendation.steps.map((step: string, i: number) => (
                          <li key={i}>{i + 1}. {step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioAnalysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-xl font-bold">{formatNumber(portfolioAnalysis.analysis.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current APY</p>
                      <p className="text-xl font-bold">{portfolioAnalysis.analysis.currentAPY.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Risk Score</p>
                      <p className="text-xl font-bold">{portfolioAnalysis.analysis.riskScore}/100</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Diversification</p>
                      <p className="text-xl font-bold">{portfolioAnalysis.analysis.diversificationScore}/100</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Optimization Recommendations</h4>
                    <div className="space-y-2">
                      {portfolioAnalysis.analysis.recommendations.map((rec: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-600" />
                            <div>
                              <p className="font-medium">{rec.action}</p>
                              <p className="text-sm text-muted-foreground">{rec.reason}</p>
                              {rec.expectedGain && (
                                <p className="text-sm text-green-600">
                                  Expected gain: ${rec.expectedGain}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium">Optimized APY</p>
                    <p className="text-2xl font-bold text-green-600">
                      {portfolioAnalysis.analysis.optimizedAPY.toFixed(2)}%
                    </p>
                    <p className="text-sm text-green-600">
                      +${portfolioAnalysis.analysis.additionalYearlyEarnings}/year
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  {isConnected ? 'Loading portfolio analysis...' : 'Connect wallet to see analysis'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedDashboard