// DeBank API Integration - No API key required!
// Fetches ALL user positions across 800+ protocols
import axios from 'axios';

export interface DeBankPosition {
  id: string;
  userAddress: string;
  poolAddress: string;
  poolName: string;
  protocol: string;
  chain: string;
  token0Symbol: string;
  token1Symbol: string;
  totalValueUSD: number;
  apy: number;
  positionType: 'LP' | 'LENDING' | 'BORROWING' | 'STAKING';
  healthFactor?: number;
  lastUpdated: Date;
}

export class DeBankPositionFetcher {
  private readonly API_BASE = 'https://pro-openapi.debank.com/v1';
  private readonly OPEN_API = 'https://openapi.debank.com/v1';  // Public endpoint (no key)
  
  /**
   * Fetch ALL positions for a user across all protocols
   */
  async fetchAllPositions(userAddress: string): Promise<DeBankPosition[]> {
    try {
      console.log(`\n🔍 [DeBank] Fetching ALL positions for ${userAddress}...`);
      
      // Use public endpoint (no key required)
      const response = await axios.get(
        `${this.OPEN_API}/user/complex_protocol_list`,
        {
          params: {
            id: userAddress.toLowerCase(),
          },
          timeout: 30000,
        }
      );
      
      const protocols = response.data || [];
      const positions: DeBankPosition[] = [];
      
      // Parse each protocol's positions
      protocols.forEach((protocol: any) => {
        (protocol.portfolio_item_list || []).forEach((item: any) => {
          const stats = item.stats || {};
          const detail = item.detail || {};
          
          positions.push({
            id: `${protocol.id}-${item.name}`,
            userAddress,
            poolAddress: detail.pool_id || '',
            poolName: item.name || `${protocol.name} ${item.detail_types?.[0] || 'Position'}`,
            protocol: protocol.name,
            chain: protocol.chain || 'ethereum',
            token0Symbol: detail.supply_token_list?.[0]?.symbol || stats.asset_usd_value ? 'MULTI' : 'UNKNOWN',
            token1Symbol: detail.supply_token_list?.[1]?.symbol || '',
            totalValueUSD: stats.net_usd_value || stats.asset_usd_value || 0,
            apy: this.extractAPY(item),
            positionType: this.determineType(item.detail_types?.[0] || ''),
            healthFactor: stats.health_rate,
            lastUpdated: new Date(),
          });
        });
      });
      
      console.log(`✅ [DeBank] Found ${positions.length} positions from ${protocols.length} protocols`);
      console.log(`   Protocols: ${protocols.map((p: any) => p.name).slice(0, 5).join(', ')}${protocols.length > 5 ? '...' : ''}\n`);
      
      return positions;
    } catch (error: any) {
      console.error('DeBank API error:', error.message);
      console.log('ℹ️  DeBank public API may be rate-limited. Consider adding DEBANK_API_KEY for higher limits.\n');
      return [];
    }
  }
  
  /**
   * Extract APY from position data
   */
  private extractAPY(item: any): number {
    // DeBank stores APY in different places
    return (
      item.stats?.apy ||
      item.detail?.base_apy ||
      item.detail?.reward_apy ||
      0
    );
  }
  
  /**
   * Determine position type
   */
  private determineType(detailType: string): 'LP' | 'LENDING' | 'BORROWING' | 'STAKING' {
    const lower = detailType.toLowerCase();
    if (lower.includes('lend') || lower.includes('deposit')) return 'LENDING';
    if (lower.includes('borrow') || lower.includes('debt')) return 'BORROWING';
    if (lower.includes('stake') || lower.includes('farm') || lower.includes('reward')) return 'STAKING';
    if (lower.includes('liquidity') || lower.includes('pool')) return 'LP';
    return 'LENDING';  // Default
  }
}

export const deBankPositionFetcher = new DeBankPositionFetcher();

