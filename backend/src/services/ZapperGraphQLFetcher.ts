// Zapper GraphQL API Integration - Get ALL DeFi positions
// Uses GraphQL as per official docs: https://build.zapper.xyz/docs/api/
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
  category?: string;
  healthFactor?: number;
  lastUpdated: Date;
}

export class ZapperGraphQLFetcher {
  private readonly GRAPHQL_ENDPOINT = 'https://public.zapper.xyz/graphql';
  private readonly API_KEY: string | null;

  constructor() {
    if (!process.env.ZAPPER_API_KEY || process.env.ZAPPER_API_KEY === 'your_zapper_api_key_here') {
      console.warn('⚠️  ZAPPER_API_KEY not configured. Zapper integration will be disabled.');
      this.API_KEY = null;
    } else {
      this.API_KEY = process.env.ZAPPER_API_KEY;
    }
  }
  
  /**
   * Fetch ALL DeFi positions using Zapper's GraphQL API
   * Covers: Extra Finance, EigenLayer, Ether.fi, Dolomite, and 1000+ more
   */
  async fetchAllPositions(userAddress: string): Promise<ZapperPosition[]> {
    if (!this.API_KEY) {
      console.log('⚠️  Zapper API key not configured, skipping Zapper positions...');
      return [];
    }

    try {
      console.log(`\n🔍 [Zapper GraphQL] Fetching ALL DeFi positions for ${userAddress}...`);
      
      // GraphQL query for app balances (DeFi positions)
      const query = `
        query AppBalances($addresses: [Address!]!, $first: Int) {
          portfolioV2(addresses: $addresses) {
            appBalances {
              totalBalanceUSD
              byApp(first: $first) {
                totalCount
                edges {
                  node {
                    balanceUSD
                    app {
                      displayName
                      imgUrl
                      description
                      category { name }
                    }
                    network {
                      name
                      chainId
                    }
                    positionBalances(first: 20) {
                      edges {
                        node {
                          ... on AppTokenPositionBalance {
                            type
                            symbol
                            balance
                            balanceUSD
                            price
                            groupLabel
                            displayProps {
                              label
                              images
                            }
                          }
                          ... on ContractPositionBalance {
                            type
                            balanceUSD
                            groupLabel
                            tokens {
                              metaType
                              token {
                                ... on BaseTokenPositionBalance {
                                  symbol
                                  balance
                                  balanceUSD
                                }
                              }
                            }
                            displayProps {
                              label
                              images
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const response = await axios.post(
        this.GRAPHQL_ENDPOINT,
        {
          query,
          variables: {
            addresses: [userAddress.toLowerCase()],
            first: 100,  // Get up to 100 apps (protocols)
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-zapper-api-key': this.API_KEY,
          },
          timeout: 30000,
        }
      );
      
      const portfolio = response.data?.data?.portfolioV2;
      const apps = portfolio?.appBalances?.byApp?.edges || [];
      const positions: ZapperPosition[] = [];
      
      console.log(`  → Found ${apps.length} apps (protocols) with balances`);
      
      // Parse each app's positions
      apps.forEach((appEdge: any) => {
        const appNode = appEdge.node;
        const appName = appNode.app?.displayName || 'Unknown';
        const chain = appNode.network?.name?.toLowerCase() || 'ethereum';
        const chainId = appNode.network?.chainId;
        const category = appNode.app?.category?.name || 'DeFi';
        
        // Parse position balances
        const positionEdges = appNode.positionBalances?.edges || [];
        
        positionEdges.forEach((posEdge: any, index: number) => {
          const position = posEdge.node;
          
          if (position.balanceUSD && position.balanceUSD > 0.01) {  // Skip dust
            const label = position.displayProps?.label || position.groupLabel || `${appName} Position`;
            
            // Extract tokens
            let tokens: any[] = [];
            if (position.tokens) {
              tokens = position.tokens.map((t: any) => t.token).filter((t: any) => t);
            }
            
            positions.push({
              id: `zapper-${appName.toLowerCase().replace(/\s+/g, '-')}-${index}`,
              userAddress,
              poolAddress: '', // GraphQL doesn't always provide this
              poolName: label,
              protocol: appName,
              chain,
              token0Symbol: position.symbol || tokens[0]?.symbol || 'MULTI',
              token1Symbol: tokens[1]?.symbol || '',
              token0Amount: position.balance?.toString() || tokens[0]?.balance?.toString() || '0',
              token1Amount: tokens[1]?.balance?.toString() || '0',
              totalValueUSD: position.balanceUSD || appNode.balanceUSD || 0,
              apy: 0,  // Zapper doesn't provide APY in this endpoint
              fees24h: (position.balanceUSD || 0) * 0.0001,
              impermanentLoss: 0,
              positionType: this.determineType(position.type || position.groupLabel || category),
              category,
              lastUpdated: new Date(),
            });
          }
        });
      });
      
      console.log(`✅ [Zapper GraphQL] Found ${positions.length} positions from ${apps.length} protocols`);
      console.log(`   Protocols: ${apps.slice(0, 5).map((a: any) => a.node.app?.displayName).join(', ')}${apps.length > 5 ? '...' : ''}\n`);
      
      return positions;
    } catch (error: any) {
      console.error(`❌ [Zapper] Error:`, error.response?.data || error.message);
      return [];
    }
  }
  
  /**
   * Determine position type from Zapper's type or label
   */
  private determineType(typeOrLabel: string): 'LP' | 'LENDING' | 'BORROWING' | 'STAKING' {
    const lower = (typeOrLabel || '').toLowerCase();
    
    if (lower.includes('lend') || lower.includes('supply') || lower.includes('deposit')) return 'LENDING';
    if (lower.includes('borrow') || lower.includes('debt')) return 'BORROWING';
    if (lower.includes('stake') || lower.includes('restake') || lower.includes('farm') || lower.includes('reward')) return 'STAKING';
    if (lower.includes('pool') || lower.includes('liquidity') || lower.includes('lp')) return 'LP';
    
    return 'LP';  // Default
  }
}

export const zapperGraphQLFetcher = new ZapperGraphQLFetcher();

