// Beefy Finance Adapter - Auto-compounding vaults
import axios from 'axios';
import { BasePlatformAdapter, PlatformPosition } from './BasePlatformAdapter';

export class BeefyAdapter extends BasePlatformAdapter {
  platformName = 'Beefy';
  apiBaseUrl = 'https://api.beefy.finance';
  
  async fetchPositions(): Promise<PlatformPosition[]> {
    try {
      console.log('📊 Fetching Beefy vaults...');
      
      // Fetch all vaults
      const [vaultsRes, apyRes] = await Promise.all([
        axios.get(`${this.apiBaseUrl}/vaults`),
        axios.get(`${this.apiBaseUrl}/apy`)
      ]);
      
      const vaults = vaultsRes.data;
      const apys = apyRes.data;
      
      // Filter for Ethereum mainnet, high TVL
      return vaults
        .filter((v: any) => v.chain === 'ethereum' && v.status === 'active')
        .slice(0, 20)  // Top 20 vaults
        .map((v: any) => {
          const vaultApy = apys[v.id] || {};
          
          return {
            id: `beefy-${v.id}`,
            platform: this.platformName,
            poolAddress: v.earnContractAddress,
            poolName: v.name,
            chain: 'ethereum',
            asset: v.asset || v.token,
            apy: vaultApy.totalApy || 0,
            tvl: v.tvl || 0,
            risk: {
              score: this.calculateRiskScore(
                this.estimateILRisk(v.asset),
                0,  // No liquidation in vaults
                85  // Beefy is well-audited
              ),
              ilRisk: this.estimateILRisk(v.asset),
              liquidationRisk: 0,
              auditScore: 85,
            },
            composability: ['Curve', 'Balancer'],  // LP token sources
            minDeposit: 50,
            lockPeriod: 0,  // No lock
            rewardTokens: ['BIFI'],
            lastUpdated: new Date(),
          };
        });
    } catch (error) {
      console.error('Beefy fetch error:', error);
      return [];
    }
  }
}

