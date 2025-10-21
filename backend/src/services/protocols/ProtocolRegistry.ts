// Protocol Registry - Central registry for all DeFi protocols
import { ProtocolAdapter, ProtocolInfo, ChainId } from './ProtocolAdapter';
import { ethers } from 'ethers';
import Redis from 'ioredis';

export class ProtocolRegistry {
  private adapters: Map<string, ProtocolAdapter> = new Map();
  private protocols: Map<string, ProtocolInfo> = new Map();
  
  // Priority protocols for hackathon (25 protocols from requirements)
  static readonly PRIORITY_PROTOCOLS: ProtocolInfo[] = [
    {
      id: 'rate-x',
      name: 'Rate-X',
      website: 'https://rate-x.io',
      chains: ['ethereum', 'arbitrum'],
      tvlUsd: 150000000,
      audited: true,
      riskScore: 75,
      categories: ['leveraged', 'vault'],
    },
    {
      id: 'ether-fi',
      name: 'Ether.fi',
      website: 'https://ether.fi',
      chains: ['ethereum'],
      tvlUsd: 3500000000,
      audited: true,
      riskScore: 85,
      categories: ['staking', 'liquidity'],
    },
    {
      id: 'renzo',
      name: 'Renzo Protocol',
      website: 'https://renzoprotocol.com',
      chains: ['ethereum', 'arbitrum'],
      tvlUsd: 2800000000,
      audited: true,
      riskScore: 80,
      categories: ['staking'],
    },
    {
      id: 'coinshift',
      name: 'Coinshift',
      website: 'https://coinshift.xyz',
      chains: ['ethereum', 'polygon', 'arbitrum'],
      tvlUsd: 125000000,
      audited: true,
      riskScore: 70,
      categories: ['vault', 'stable'],
    },
    {
      id: 'origin',
      name: 'Origin Protocol',
      website: 'https://originprotocol.com',
      chains: ['ethereum'],
      tvlUsd: 350000000,
      audited: true,
      riskScore: 82,
      categories: ['staking', 'stable'],
    },
    {
      id: 'summer-fi',
      name: 'Summer.fi',
      website: 'https://summer.fi',
      chains: ['ethereum', 'arbitrum', 'optimism', 'base'],
      tvlUsd: 1200000000,
      audited: true,
      riskScore: 78,
      categories: ['vault', 'leveraged'],
    },
    {
      id: 'mode-network',
      name: 'Mode Network',
      website: 'https://mode.network',
      chains: ['ethereum'],
      tvlUsd: 450000000,
      audited: false,
      riskScore: 65,
      categories: ['vault'],
    },
    {
      id: 'gearbox',
      name: 'Gearbox Protocol',
      website: 'https://gearbox.finance',
      chains: ['ethereum', 'arbitrum'],
      tvlUsd: 200000000,
      audited: true,
      riskScore: 75,
      categories: ['leveraged', 'liquidity'],
    },
    {
      id: 'contango',
      name: 'Contango',
      website: 'https://contango.xyz',
      chains: ['ethereum', 'arbitrum', 'optimism'],
      tvlUsd: 85000000,
      audited: true,
      riskScore: 72,
      categories: ['leveraged', 'derivative'],
    },
    {
      id: 'alphagrowth',
      name: 'AlphaGrowth',
      website: 'https://alphagrowth.io',
      chains: ['ethereum', 'arbitrum'],
      tvlUsd: 65000000,
      audited: false,
      riskScore: 60,
      categories: ['liquidity'],
    },
    {
      id: 'mantle',
      name: 'Mantle LST',
      website: 'https://mantle.xyz',
      chains: ['mantle'],
      tvlUsd: 850000000,
      audited: true,
      riskScore: 75,
      categories: ['staking'],
    },
    {
      id: 'pendle',
      name: 'Pendle Finance',
      website: 'https://pendle.finance',
      chains: ['ethereum', 'arbitrum'],
      tvlUsd: 2500000000,
      audited: true,
      riskScore: 83,
      categories: ['derivative', 'vault'],
    },
    {
      id: 'aladdin',
      name: 'Aladdin Club',
      website: 'https://aladdin.club',
      chains: ['ethereum'],
      tvlUsd: 180000000,
      audited: true,
      riskScore: 70,
      categories: ['stable', 'vault'],
    },
    {
      id: 'qu-ai',
      name: 'Qu.ai',
      website: 'https://qu.ai',
      chains: ['ethereum', 'arbitrum'],
      tvlUsd: 45000000,
      audited: false,
      riskScore: 55,
      categories: ['liquidity'],
    },
    {
      id: 'plume',
      name: 'Plume Network',
      website: 'https://plume.org',
      chains: ['ethereum'],
      tvlUsd: 120000000,
      audited: false,
      riskScore: 60,
      categories: ['vault'],
    },
    {
      id: 'kamino',
      name: 'Kamino Finance',
      website: 'https://kamino.finance',
      chains: ['solana'],
      tvlUsd: 1800000000,
      audited: true,
      riskScore: 77,
      categories: ['vault', 'liquidity'],
    },
    {
      id: 'beefy',
      name: 'Beefy Finance',
      website: 'https://beefy.finance',
      chains: ['ethereum', 'polygon', 'bsc', 'avalanche', 'fantom', 'arbitrum', 'optimism'],
      tvlUsd: 450000000,
      audited: true,
      riskScore: 78,
      categories: ['vault'],
    },
    {
      id: 'silo',
      name: 'Silo Finance',
      website: 'https://silo.finance',
      chains: ['ethereum', 'arbitrum'],
      tvlUsd: 92000000,
      audited: true,
      riskScore: 73,
      categories: ['lending'],
    },
    {
      id: 'yearn',
      name: 'Yearn Finance',
      website: 'https://yearn.fi',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
      tvlUsd: 380000000,
      audited: true,
      riskScore: 88,
      categories: ['vault'],
    },
    {
      id: 'dolomite',
      name: 'Dolomite',
      website: 'https://dolomite.io',
      chains: ['arbitrum'],
      tvlUsd: 68000000,
      audited: true,
      riskScore: 71,
      categories: ['liquidity', 'leveraged'],
    },
    {
      id: 'fluid',
      name: 'Fluid Protocol',
      website: 'https://fluid.io',
      chains: ['ethereum', 'arbitrum'],
      tvlUsd: 125000000,
      audited: false,
      riskScore: 65,
      categories: ['lending', 'liquidity'],
    },
    {
      id: 'morpho',
      name: 'Morpho',
      website: 'https://morpho.org',
      chains: ['ethereum', 'base'],
      tvlUsd: 2100000000,
      audited: true,
      riskScore: 82,
      categories: ['lending'],
    },
    {
      id: 'compound',
      name: 'Compound Finance',
      website: 'https://compound.finance',
      chains: ['ethereum', 'polygon', 'arbitrum'],
      tvlUsd: 1800000000,
      audited: true,
      riskScore: 90,
      categories: ['lending'],
    },
    {
      id: 'aave',
      name: 'Aave',
      website: 'https://aave.com',
      chains: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base'],
      tvlUsd: 11500000000,
      audited: true,
      riskScore: 92,
      categories: ['lending'],
    },
    {
      id: 'curve',
      name: 'Curve Finance',
      website: 'https://curve.fi',
      chains: ['ethereum', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base'],
      tvlUsd: 2300000000,
      audited: true,
      riskScore: 88,
      categories: ['liquidity', 'stable'],
    },
  ];
  
  // Additional protocols to reach 50+ total
  static readonly ADDITIONAL_PROTOCOLS: ProtocolInfo[] = [
    {
      id: 'uniswap-v3',
      name: 'Uniswap V3',
      website: 'https://uniswap.org',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
      tvlUsd: 4200000000,
      audited: true,
      riskScore: 90,
      categories: ['liquidity'],
    },
    {
      id: 'convex',
      name: 'Convex Finance',
      website: 'https://convexfinance.com',
      chains: ['ethereum'],
      tvlUsd: 3100000000,
      audited: true,
      riskScore: 85,
      categories: ['vault'],
    },
    {
      id: 'frax',
      name: 'Frax Finance',
      website: 'https://frax.finance',
      chains: ['ethereum'],
      tvlUsd: 1450000000,
      audited: true,
      riskScore: 80,
      categories: ['stable', 'staking'],
    },
    {
      id: 'lido',
      name: 'Lido',
      website: 'https://lido.fi',
      chains: ['ethereum'],
      tvlUsd: 32000000000,
      audited: true,
      riskScore: 93,
      categories: ['staking'],
    },
    {
      id: 'rocket-pool',
      name: 'Rocket Pool',
      website: 'https://rocketpool.net',
      chains: ['ethereum'],
      tvlUsd: 4200000000,
      audited: true,
      riskScore: 87,
      categories: ['staking'],
    },
    {
      id: 'balancer',
      name: 'Balancer',
      website: 'https://balancer.fi',
      chains: ['ethereum', 'polygon', 'arbitrum'],
      tvlUsd: 780000000,
      audited: true,
      riskScore: 84,
      categories: ['liquidity'],
    },
    {
      id: 'gmx',
      name: 'GMX',
      website: 'https://gmx.io',
      chains: ['arbitrum', 'avalanche'],
      tvlUsd: 650000000,
      audited: true,
      riskScore: 78,
      categories: ['derivative', 'leveraged'],
    },
    {
      id: 'dydx',
      name: 'dYdX',
      website: 'https://dydx.exchange',
      chains: ['ethereum'],
      tvlUsd: 380000000,
      audited: true,
      riskScore: 82,
      categories: ['derivative'],
    },
    {
      id: 'synthetix',
      name: 'Synthetix',
      website: 'https://synthetix.io',
      chains: ['ethereum', 'optimism'],
      tvlUsd: 420000000,
      audited: true,
      riskScore: 79,
      categories: ['derivative'],
    },
    {
      id: 'makerdao',
      name: 'MakerDAO',
      website: 'https://makerdao.com',
      chains: ['ethereum'],
      tvlUsd: 8900000000,
      audited: true,
      riskScore: 91,
      categories: ['lending', 'stable'],
    },
    {
      id: 'liquity',
      name: 'Liquity Protocol',
      website: 'https://liquity.org',
      chains: ['ethereum'],
      tvlUsd: 780000000,
      audited: true,
      riskScore: 86,
      categories: ['lending', 'stable'],
    },
    {
      id: 'abracadabra',
      name: 'Abracadabra',
      website: 'https://abracadabra.money',
      chains: ['ethereum', 'avalanche', 'arbitrum'],
      tvlUsd: 120000000,
      audited: true,
      riskScore: 68,
      categories: ['lending', 'stable'],
    },
    {
      id: 'benqi',
      name: 'Benqi',
      website: 'https://benqi.fi',
      chains: ['avalanche'],
      tvlUsd: 280000000,
      audited: true,
      riskScore: 74,
      categories: ['lending', 'staking'],
    },
    {
      id: 'trader-joe',
      name: 'Trader Joe',
      website: 'https://traderjoexyz.com',
      chains: ['avalanche', 'arbitrum', 'bsc'],
      tvlUsd: 340000000,
      audited: true,
      riskScore: 76,
      categories: ['liquidity'],
    },
    {
      id: 'radiant',
      name: 'Radiant Capital',
      website: 'https://radiant.capital',
      chains: ['arbitrum', 'bsc'],
      tvlUsd: 450000000,
      audited: true,
      riskScore: 72,
      categories: ['lending'],
    },
    {
      id: 'venus',
      name: 'Venus Protocol',
      website: 'https://venus.io',
      chains: ['bsc'],
      tvlUsd: 1850000000,
      audited: true,
      riskScore: 77,
      categories: ['lending'],
    },
    {
      id: 'alpaca',
      name: 'Alpaca Finance',
      website: 'https://alpaca.finance',
      chains: ['bsc', 'fantom'],
      tvlUsd: 180000000,
      audited: true,
      riskScore: 73,
      categories: ['leveraged', 'vault'],
    },
    {
      id: 'pancakeswap',
      name: 'PancakeSwap',
      website: 'https://pancakeswap.finance',
      chains: ['bsc', 'ethereum', 'arbitrum'],
      tvlUsd: 2100000000,
      audited: true,
      riskScore: 81,
      categories: ['liquidity'],
    },
    {
      id: 'sushiswap',
      name: 'SushiSwap',
      website: 'https://sushi.com',
      chains: ['ethereum', 'polygon', 'arbitrum', 'avalanche'],
      tvlUsd: 420000000,
      audited: true,
      riskScore: 79,
      categories: ['liquidity'],
    },
    {
      id: 'quickswap',
      name: 'QuickSwap',
      website: 'https://quickswap.exchange',
      chains: ['polygon'],
      tvlUsd: 180000000,
      audited: true,
      riskScore: 75,
      categories: ['liquidity'],
    },
    {
      id: 'spookyswap',
      name: 'SpookySwap',
      website: 'https://spooky.fi',
      chains: ['fantom'],
      tvlUsd: 68000000,
      audited: true,
      riskScore: 70,
      categories: ['liquidity'],
    },
    {
      id: 'beethoven-x',
      name: 'Beethoven X',
      website: 'https://beets.fi',
      chains: ['fantom', 'optimism'],
      tvlUsd: 95000000,
      audited: true,
      riskScore: 72,
      categories: ['liquidity'],
    },
    {
      id: 'velodrome',
      name: 'Velodrome',
      website: 'https://velodrome.finance',
      chains: ['optimism'],
      tvlUsd: 680000000,
      audited: true,
      riskScore: 76,
      categories: ['liquidity'],
    },
    {
      id: 'camelot',
      name: 'Camelot',
      website: 'https://camelot.exchange',
      chains: ['arbitrum'],
      tvlUsd: 240000000,
      audited: true,
      riskScore: 74,
      categories: ['liquidity'],
    },
    {
      id: 'spark',
      name: 'Spark Protocol',
      website: 'https://spark.fi',
      chains: ['ethereum'],
      tvlUsd: 2800000000,
      audited: true,
      riskScore: 83,
      categories: ['lending'],
    },
  ];
  
  constructor(
    private provider: ethers.Provider,
    private redis?: Redis
  ) {
    this.initializeProtocols();
  }
  
  private initializeProtocols(): void {
    // Register all protocols
    const allProtocols = [
      ...ProtocolRegistry.PRIORITY_PROTOCOLS,
      ...ProtocolRegistry.ADDITIONAL_PROTOCOLS,
    ];
    
    for (const protocol of allProtocols) {
      this.protocols.set(protocol.id, protocol);
    }
    
    console.log(`✅ Registered ${this.protocols.size} DeFi protocols`);
  }
  
  // Get protocol info
  getProtocolInfo(protocolId: string): ProtocolInfo | undefined {
    return this.protocols.get(protocolId);
  }
  
  // Get all protocols
  getAllProtocols(): ProtocolInfo[] {
    return Array.from(this.protocols.values());
  }
  
  // Get protocols by chain
  getProtocolsByChain(chain: ChainId): ProtocolInfo[] {
    return this.getAllProtocols().filter(p => p.chains.includes(chain));
  }
  
  // Get protocols by category
  getProtocolsByCategory(category: string): ProtocolInfo[] {
    return this.getAllProtocols().filter(p => p.categories.includes(category as any));
  }
  
  // Register an adapter
  registerAdapter(protocolId: string, adapter: ProtocolAdapter): void {
    this.adapters.set(protocolId, adapter);
  }
  
  // Get adapter for protocol
  getAdapter(protocolId: string): ProtocolAdapter | undefined {
    return this.adapters.get(protocolId);
  }
  
  // Get protocol statistics
  getStatistics(): {
    totalProtocols: number;
    totalTVL: number;
    chainDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
    auditedProtocols: number;
  } {
    const protocols = this.getAllProtocols();
    const chainDist: Record<string, number> = {};
    const categoryDist: Record<string, number> = {};
    
    for (const protocol of protocols) {
      for (const chain of protocol.chains) {
        chainDist[chain] = (chainDist[chain] || 0) + 1;
      }
      for (const category of protocol.categories) {
        categoryDist[category] = (categoryDist[category] || 0) + 1;
      }
    }
    
    return {
      totalProtocols: protocols.length,
      totalTVL: protocols.reduce((sum, p) => sum + p.tvlUsd, 0),
      chainDistribution: chainDist,
      categoryDistribution: categoryDist,
      auditedProtocols: protocols.filter(p => p.audited).length,
    };
  }
}

export default ProtocolRegistry;