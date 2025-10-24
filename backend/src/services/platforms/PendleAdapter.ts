// Pendle Finance Adapter - PT/YT positions
import axios from 'axios';
import { BasePlatformAdapter, PlatformPosition } from './BasePlatformAdapter';

export class PendleAdapter extends BasePlatformAdapter {
  platformName = 'Pendle';
  apiBaseUrl = 'https://api-v2.pendle.finance';
  
  async fetchPositions(): Promise<PlatformPosition[]> {
    try {
      console.log('📊 Fetching Pendle positions...');
      
      // Query Pendle's GraphQL API
      const response = await axios.post(`${this.apiBaseUrl}/core/query`, {
        query: `{
          markets(first: 50, orderBy: totalPt, orderDirection: desc) {
            id
            name
            pt { symbol }
            sy { symbol }
            expiry
            impliedApy
            totalPt
            totalSy
          }
        }`
      });
      
      const markets = response.data.data?.markets || [];
      
      return markets.map((m: any) => ({
        id: `pendle-${m.id}`,
        platform: this.platformName,
        poolAddress: m.id,
        poolName: m.name || `${m.pt?.symbol || 'PT'} Market`,
        chain: 'ethereum',
        asset: m.sy?.symbol || 'UNKNOWN',
        apy: parseFloat(m.impliedApy || '0') * 100,  // Convert to percentage
        tvl: parseFloat(m.totalPt || '0') * 1000,  // Rough TVL estimate
        risk: {
          score: this.calculateRiskScore(10, 0, 90),  // Pendle is low risk, audited
          ilRisk: 10,  // PT tokens have minimal IL
          liquidationRisk: 0,  // No liquidation in PT
          auditScore: 90,  // High audit score
        },
        composability: ['Aave', 'Compound'],  // Can deposit PT as collateral
        minDeposit: 100,
        lockPeriod: Math.floor((new Date(m.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        rewardTokens: ['PENDLE'],
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Pendle fetch error:', error);
      return [];
    }
  }
}

