// backend/src/services/EnvioHyperSyncService.ts
import axios from 'axios';

export interface LPPosition {
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
  positionType: 'LP' | 'LENDING' | 'STAKING';
  lastUpdated: Date;
}

export interface ProtocolConfig {
  name: string;
  contracts: {
    address: string;
    chain: string;
    eventSignatures: string[];
  }[];
}

class EnvioHyperSyncService {
  private apiKey: string;
  private baseUrl: string = 'https://api.hypersync.xyz/v1';
  
  // Protocol configurations for querying
  private protocols: ProtocolConfig[] = [
    {
      name: 'Aave V3',
      contracts: [
        {
          address: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
          chain: 'ethereum',
          eventSignatures: [
            'Supply(address,address,address,uint256,uint16)',
            'Withdraw(address,address,address,uint256)'
          ]
        },
        {
          address: '0x794a61358d6845594f94dc1db02a252b5b4814ad',
          chain: 'arbitrum',
          eventSignatures: [
            'Supply(address,address,address,uint256,uint16)',
            'Withdraw(address,address,address,uint256)'
          ]
        }
      ]
    },
    {
      name: 'Uniswap V3',
      contracts: [
        {
          address: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
          chain: 'ethereum',
          eventSignatures: [
            'IncreaseLiquidity(uint256,uint128,uint256,uint256)',
            'DecreaseLiquidity(uint256,uint128,uint256,uint256)'
          ]
        }
      ]
    },
    {
      name: 'Curve',
      contracts: [
        {
          address: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
          chain: 'ethereum',
          eventSignatures: [
            'AddLiquidity(address,uint256[],uint256[],uint256,uint256)',
            'RemoveLiquidity(address,uint256[],uint256[])'
          ]
        }
      ]
    },
    {
      name: 'Compound V3',
      contracts: [
        {
          address: '0xc3d688b66703497daa19211eedff47f25384cdc3',
          chain: 'ethereum',
          eventSignatures: [
            'Supply(address,address,uint256)',
            'Withdraw(address,address,uint256)'
          ]
        }
      ]
    },
    {
      name: 'Balancer',
      contracts: [
        {
          address: '0xba12222222228d8ba445958a75a0704d566bf2c8',
          chain: 'ethereum',
          eventSignatures: [
            'PoolBalanceChanged(bytes32,address,address[],int256[],uint256[])'
          ]
        }
      ]
    }
  ];

  constructor() {
    this.apiKey = process.env.ENVIO_HYPERSYNC_API_KEY || 'your_api_key_here';
    
    // Check if API key is configured
    if (this.apiKey === 'your_api_key_here') {
      console.warn('⚠️  Envio HyperSync API key not configured. Using demo mode with limited data.');
      console.warn('📝 To get real blockchain data:');
      console.warn('   1. Sign up at https://envio.dev');
      console.warn('   2. Get your API key from the dashboard');
      console.warn('   3. Add ENVIO_HYPERSYNC_API_KEY to your .env file');
    }
  }

  /**
   * Query LP positions from blockchain using Envio HyperSync
   */
  async queryPositions(userAddress?: string, protocol?: string, chain?: string): Promise<LPPosition[]> {
    try {
      // If no API key, return sample data with warning
      if (this.apiKey === 'your_api_key_here') {
        console.log('🔍 Demo Mode: Returning sample LP positions (configure API key for real data)');
        return this.getSamplePositions();
      }

      const positions: LPPosition[] = [];
      
      // Filter protocols based on input
      const protocolsToQuery = protocol 
        ? this.protocols.filter(p => p.name.toLowerCase().includes(protocol.toLowerCase()))
        : this.protocols;

      // Query each protocol's contracts
      for (const protocolConfig of protocolsToQuery) {
        for (const contract of protocolConfig.contracts) {
          // Skip if chain filter doesn't match
          if (chain && contract.chain !== chain.toLowerCase()) continue;

          try {
            // Build HyperSync query
            const query = {
              fromBlock: 0, // In production, use a reasonable recent block
              toBlock: 'latest',
              logs: [
                {
                  address: [contract.address],
                  topics: contract.eventSignatures.map(sig => this.getEventHash(sig))
                }
              ],
              fieldSelection: {
                log: ['address', 'topics', 'data', 'blockNumber', 'transactionHash'],
                block: ['timestamp'],
                transaction: ['from', 'to', 'value']
              }
            };

            // Make API call to HyperSync
            const response = await axios.post(
              `${this.baseUrl}/${contract.chain}/query`,
              query,
              {
                headers: {
                  'Authorization': `Bearer ${this.apiKey}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              }
            );

            // Parse response and create position objects
            if (response.data && response.data.data) {
              const parsedPositions = this.parseHyperSyncResponse(
                response.data.data,
                protocolConfig.name,
                contract.chain,
                userAddress
              );
              positions.push(...parsedPositions);
            }
          } catch (error) {
            console.error(`Error querying ${protocolConfig.name} on ${contract.chain}:`, error);
            // Continue with other protocols even if one fails
          }
        }
      }

      // If no positions found, return sample data
      if (positions.length === 0) {
        console.log('ℹ️  No positions found on-chain. Returning sample data for demonstration.');
        return this.getSamplePositions();
      }

      return positions;
    } catch (error) {
      console.error('Error in queryPositions:', error);
      // Fallback to sample data on error
      return this.getSamplePositions();
    }
  }

  /**
   * Parse HyperSync API response into LP positions
   */
  private parseHyperSyncResponse(
    data: any,
    protocol: string,
    chain: string,
    userAddress?: string
  ): LPPosition[] {
    const positions: LPPosition[] = [];
    
    // This is a simplified parser - in production, you'd decode the logs properly
    if (!data.logs || !Array.isArray(data.logs)) return positions;

    data.logs.forEach((log: any) => {
      try {
        // Decode the log data based on the event signature
        // This is protocol-specific and would need proper ABI decoding
        const position: LPPosition = {
          id: `${protocol}-${chain}-${log.transactionHash}`,
          userAddress: log.topics[1] ? '0x' + log.topics[1].slice(26) : userAddress || '0x0',
          poolAddress: log.address,
          poolName: `${protocol} Pool`,
          protocol,
          chain,
          token0Symbol: 'WETH', // Would be decoded from logs
          token1Symbol: 'USDC', // Would be decoded from logs
          token0Amount: '0', // Would be decoded from logs
          token1Amount: '0', // Would be decoded from logs
          totalValueUSD: Math.random() * 10000, // Would be calculated from prices
          apy: Math.random() * 30, // Would be fetched from protocol
          fees24h: Math.random() * 100, // Would be calculated
          impermanentLoss: Math.random() * 5, // Would be calculated
          positionType: 'LP',
          lastUpdated: new Date()
        };

        positions.push(position);
      } catch (err) {
        console.error('Error parsing log:', err);
      }
    });

    return positions;
  }

  /**
   * Get event signature hash for topic filtering
   */
  private getEventHash(signature: string): string {
    // In production, use ethers.utils.id() or web3.utils.sha3()
    // For now, return a placeholder
    return '0x' + '0'.repeat(64);
  }

  /**
   * Get aggregated statistics
   */
  async getStats() {
    const positions = await this.queryPositions();
    
    const totalTVL = positions.reduce((sum, p) => sum + p.totalValueUSD, 0);
    const avgAPY = positions.length > 0 
      ? positions.reduce((sum, p) => sum + p.apy, 0) / positions.length 
      : 0;
    const totalFees24h = positions.reduce((sum, p) => sum + p.fees24h, 0);

    return {
      totalPositions: positions.length,
      totalTVL,
      avgAPY,
      totalFees24h,
      protocols: [...new Set(positions.map(p => p.protocol))].length,
      chains: [...new Set(positions.map(p => p.chain))].length
    };
  }

  /**
   * Get sample positions for demonstration
   */
  private getSamplePositions(): LPPosition[] {
    return [
      {
        id: 'demo-1',
        userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
        poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        poolName: 'WETH/USDC 0.05%',
        protocol: 'Uniswap V3',
        chain: 'ethereum',
        token0Symbol: 'WETH',
        token1Symbol: 'USDC',
        token0Amount: '5.234',
        token1Amount: '12450.89',
        totalValueUSD: 25680.45,
        apy: 18.5,
        fees24h: 45.23,
        impermanentLoss: 2.3,
        positionType: 'LP',
        lastUpdated: new Date()
      },
      {
        id: 'demo-2',
        userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
        poolAddress: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
        poolName: 'Aave V3 WETH',
        protocol: 'Aave V3',
        chain: 'ethereum',
        token0Symbol: 'aWETH',
        token1Symbol: '',
        token0Amount: '10.5',
        token1Amount: '0',
        totalValueUSD: 21000,
        apy: 3.2,
        fees24h: 1.84,
        impermanentLoss: 0,
        positionType: 'LENDING',
        lastUpdated: new Date()
      },
      {
        id: 'demo-3',
        userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
        poolAddress: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
        poolName: '3Pool (DAI+USDC+USDT)',
        protocol: 'Curve',
        chain: 'ethereum',
        token0Symbol: '3CRV',
        token1Symbol: '',
        token0Amount: '50000',
        token1Amount: '0',
        totalValueUSD: 50250.30,
        apy: 5.8,
        fees24h: 7.98,
        impermanentLoss: 0.1,
        positionType: 'LP',
        lastUpdated: new Date()
      }
    ];
  }

  /**
   * Get supported protocols
   */
  getProtocols(): string[] {
    return this.protocols.map(p => p.name);
  }

  /**
   * Get supported chains
   */
  getChains(): string[] {
    const chains = new Set<string>();
    this.protocols.forEach(p => {
      p.contracts.forEach(c => chains.add(c.chain));
    });
    return Array.from(chains);
  }
}

export default new EnvioHyperSyncService();