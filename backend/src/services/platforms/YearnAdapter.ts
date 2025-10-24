// Yearn Finance Adapter - Yield vaults
import axios from 'axios';
import { BasePlatformAdapter, PlatformPosition } from './BasePlatformAdapter';

export class YearnAdapter extends BasePlatformAdapter {
  platformName = 'Yearn';
  apiBaseUrl = 'https://api.yearn.fi';
  
  async fetchPositions(): Promise<PlatformPosition[]> {
    try {
      console.log('📊 Fetching Yearn vaults...');
      
      const response = await axios.get(`${this.apiBaseUrl}/v1/chains/1/vaults/all`);
      const vaults = response.data;
      
      return vaults
        .filter((v: any) => v.type === 'v2' && parseFloat(v.tvl?.tvl || '0') > 1000000)  // >$1M TVL
        .slice(0, 15)
        .map((v: any) => ({
          id: `yearn-${v.address}`,
          platform: this.platformName,
          poolAddress: v.address,
          poolName: v.name,
          chain: 'ethereum',
          asset: v.token?.symbol || v.symbol,
          apy: parseFloat(v.apy?.net_apy || '0') * 100,
          tvl: parseFloat(v.tvl?.tvl || '0'),
          risk: {
            score: this.calculateRiskScore(
              this.estimateILRisk(v.token?.symbol || ''),
              0,
              95  // Yearn is top-tier audited
            ),
            ilRisk: this.estimateILRisk(v.token?.symbol || ''),
            liquidationRisk: 0,
            auditScore: 95,
          },
          composability: ['Curve', 'Convex'],
          minDeposit: 100,
          lockPeriod: 0,
          rewardTokens: [],  // Auto-compounded
          lastUpdated: new Date(),
        }));
    } catch (error) {
      console.error('Yearn fetch error:', error);
      return [];
    }
  }
}

