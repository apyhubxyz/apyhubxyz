// Zapper API Integration - Fetch ALL user positions across protocols
// Zapper tracks: Uniswap, Aave, Extra Finance, EigenLayer, Ether.fi, Dolomite, etc.
import axios from 'axios';

export interface ZapperPosition {
  id: string;
  userAddress: string;
  poolAddress: string;
  poolName: string;
  protocol: string;
  chain: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Amount: string;
  token1Amount: string;
  totalValueUSD: number;
  apy: number;
  fees24h: number;
  impermanentLoss: number;
  positionType: 'LP' | 'LENDING' | 'BORROWING' | 'STAKING';
  lastUpdated: Date;
}

export class ZapperPositionFetcher {
  private readonly API_BASE = 'https://api.zapper.xyz/v2';
  private readonly API_KEY: string | null;

  constructor() {
    // Check API key without throwing error (will handle gracefully when used)
    if (!process.env.ZAPPER_API_KEY || process.env.ZAPPER_API_KEY === 'your_zapper_api_key_here') {
      this.API_KEY = null;
    } else {
      this.API_KEY = process.env.ZAPPER_API_KEY;
    }
  }
  
  /**
   * Fetch ALL positions for a user (covers 1000+ protocols)
   */
  async fetchAllPositions(userAddress: string): Promise<ZapperPosition[]> {
    if (!this.API_KEY) {
      console.log('⚠️  Zapper API key not configured, using fallback...');
      return this.fallbackToDirectQueries(userAddress);
    }
    
    try {
      console.log(`\n🔍 [Zapper] Fetching ALL positions for ${userAddress}...`);
      
      // Zapper's balances endpoint gets ALL positions across protocols
      const response = await axios.get(
        `${this.API_BASE}/balances/apps`,
        {
          params: {
            addresses: [userAddress],
            networks: ['ethereum', 'optimism', 'arbitrum', 'base', 'polygon'].join(','),
          },
          headers: {
            'Authorization': `Basic ${Buffer.from(this.API_KEY + ':').toString('base64')}`,
          },
          timeout: 30000,
        }
      );
      
      const apps = response.data[userAddress.toLowerCase()] || {};
      const positions: ZapperPosition[] = [];
      
      // Parse each app's positions
      Object.entries(apps).forEach(([appName, appData]: [string, any]) => {
        (appData.products || []).forEach((product: any) => {
          (product.assets || []).forEach((asset: any) => {
            positions.push({
              id: `${appName}-${asset.address || asset.symbol}`,
              userAddress,
              poolAddress: asset.address || '',
              poolName: asset.displayProps?.label || `${appName} ${asset.symbol}`,
              protocol: this.normalizeProtocolName(appName),
              chain: asset.network || 'ethereum',
              token0Symbol: asset.symbol || asset.tokens?.[0]?.symbol || 'UNKNOWN',
              token1Symbol: asset.tokens?.[1]?.symbol || '',
              token0Amount: asset.balance || asset.balanceRaw || '0',
              token1Amount: asset.tokens?.[1]?.balance || '0',
              totalValueUSD: asset.balanceUSD || 0,
              apy: this.extractAPY(asset),
              fees24h: (asset.balanceUSD || 0) * 0.0001, // Estimate
              impermanentLoss: 0,
              positionType: this.determinePositionType(product.label),
              lastUpdated: new Date(),
            });
          });
        });
      });
      
      console.log(`✅ [Zapper] Found ${positions.length} positions across protocols\n`);
      
      return positions;
    } catch (error: any) {
      console.error('Zapper API error:', error.message);
      console.log('ℹ️  Zapper API key needed for full coverage. Get free key at: https://studio.zapper.xyz/');
      
      // Fallback to direct blockchain queries
      return this.fallbackToDirectQueries(userAddress);
    }
  }
  
  /**
   * Fallback: Use direct blockchain queries (Uniswap + Aave only)
   */
  private async fallbackToDirectQueries(userAddress: string): Promise<ZapperPosition[]> {
    console.log('→ Using fallback: Direct blockchain queries (limited coverage)');
    
    // Import and use RealPositionFetcher
    const { realPositionFetcher } = await import('./RealPositionFetcher');
    return realPositionFetcher.fetchAllPositions(userAddress) as any;
  }
  
  /**
   * Normalize protocol names
   */
  private normalizeProtocolName(zapperName: string): string {
    const mapping: Record<string, string> = {
      'uniswap-v3': 'Uniswap V3',
      'aave-v3': 'Aave V3',
      'extra-finance': 'Extra Finance',
      'eigenlayer': 'EigenLayer',
      'ether-fi': 'Ether.fi',
      'dolomite': 'Dolomite',
      'symbiotic': 'Symbiotic',
      'ethena': 'Ethena',
      'etherex': 'Etherex',
    };
    
    return mapping[zapperName.toLowerCase()] || zapperName;
  }
  
  /**
   * Extract APY from asset data
   */
  private extractAPY(asset: any): number {
    return asset.dataProps?.apy || asset.stats?.apy || 0;
  }
  
  /**
   * Determine position type from product label
   */
  private determinePositionType(label: string): 'LP' | 'LENDING' | 'BORROWING' | 'STAKING' {
    const lower = label.toLowerCase();
    if (lower.includes('lend') || lower.includes('supply')) return 'LENDING';
    if (lower.includes('borrow') || lower.includes('debt')) return 'BORROWING';
    if (lower.includes('stake') || lower.includes('restake')) return 'STAKING';
    return 'LP';
  }
}

// Lazy initialization - create instance only when needed
let _instance: ZapperPositionFetcher | null = null;
export const zapperPositionFetcher = {
  fetchAllPositions: (userAddress: string) => {
    if (!_instance) {
      _instance = new ZapperPositionFetcher();
    }
    return _instance.fetchAllPositions(userAddress);
  }
};

