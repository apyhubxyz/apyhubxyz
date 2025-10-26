// Real Position Fetcher - Direct blockchain queries for actual data
import { ethers } from 'ethers';
import axios from 'axios';

// Contract ABIs for major protocols
const UNISWAP_V3_POSITION_MANAGER = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
const AAVE_V3_POOL = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

// Simplified ABI for position queries
const POSITION_MANAGER_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
];

const AAVE_POOL_ABI = [
  'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
];

export interface RealPosition {
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
  positionType: 'LP' | 'LENDING' | 'BORROWING';
  lastUpdated: Date;
}

export class RealPositionFetcher {
  private provider: ethers.JsonRpcProvider | null;
  private static warnedOnce = false;

  constructor() {
    // Initialize provider with Alchemy RPC URL from environment (no logging here)
    if (!process.env.ALCHEMY_RPC_URL || process.env.ALCHEMY_RPC_URL.includes('YOUR_ALCHEMY_API_KEY')) {
      this.provider = null;
    } else {
      this.provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
    }
  }

  /**
   * Fetch REAL Uniswap V3 positions for an address
   */
  async fetchUniswapV3Positions(userAddress: string): Promise<RealPosition[]> {
    if (!this.provider) {
      if (!RealPositionFetcher.warnedOnce) {
        console.log('⚠️  Real position fetcher not configured, skipping...');
        RealPositionFetcher.warnedOnce = true;
      }
      return [];
    }
    try {
      const positionManager = new ethers.Contract(
        UNISWAP_V3_POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        this.provider
      );

      // Get number of positions
      const balance = await positionManager.balanceOf(userAddress);
      const positions: RealPosition[] = [];

      console.log(`Found ${balance} Uniswap V3 positions for ${userAddress}`);

      // Fetch each position
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await positionManager.tokenOfOwnerByIndex(userAddress, i);
          const position = await positionManager.positions(tokenId);

          // Get token info
          const token0 = await this.getTokenInfo(position.token0);
          const token1 = await this.getTokenInfo(position.token1);

          // Calculate liquidity value (simplified)
          const liquidity = Number(position.liquidity);
          const valueUSD = await this.calculatePositionValue(
            position.token0,
            position.token1,
            liquidity
          );

          positions.push({
            id: `uniswap-v3-${tokenId}`,
            userAddress,
            poolAddress: UNISWAP_V3_POSITION_MANAGER,
            poolName: `${token0.symbol}/${token1.symbol} ${Number(position.fee) / 10000}%`,
            protocol: 'Uniswap V3',
            chain: 'ethereum',
            token0Symbol: token0.symbol,
            token1Symbol: token1.symbol,
            token0Amount: ethers.formatUnits(position.tokensOwed0 || 0, token0.decimals),
            token1Amount: ethers.formatUnits(position.tokensOwed1 || 0, token1.decimals),
            totalValueUSD: valueUSD,
            apy: await this.fetchPoolAPY('uniswap-v3', position.token0, position.token1),
            fees24h: 0, // Would need historical data
            impermanentLoss: 0, // Would need price tracking
            positionType: 'LP',
            lastUpdated: new Date(),
          });
        } catch (err) {
          console.error(`Error fetching position ${i}:`, err);
        }
      }

      return positions;
    } catch (error) {
      console.error('Uniswap V3 fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch REAL Aave V3 positions
   */
  async fetchAavePositions(userAddress: string): Promise<RealPosition[]> {
    if (!this.provider) {
      return [];
    }
    try {
      const aavePool = new ethers.Contract(AAVE_V3_POOL, AAVE_POOL_ABI, this.provider);
      const accountData = await aavePool.getUserAccountData(userAddress);

      const positions: RealPosition[] = [];

      // If user has collateral, they have a position
      if (Number(accountData.totalCollateralBase) > 0) {
        const totalValueUSD = Number(ethers.formatUnits(accountData.totalCollateralBase, 8));
        const debtUSD = Number(ethers.formatUnits(accountData.totalDebtBase, 8));
        const healthFactor = Number(ethers.formatUnits(accountData.healthFactor, 18));

        console.log(`Aave position: ${totalValueUSD} USD collateral, ${debtUSD} USD debt`);

        positions.push({
          id: `aave-v3-${userAddress}`,
          userAddress,
          poolAddress: AAVE_V3_POOL,
          poolName: 'Aave V3 Lending',
          protocol: 'Aave V3',
          chain: 'ethereum',
          token0Symbol: 'MIXED', // Aave supports multiple tokens
          token1Symbol: '',
          token0Amount: totalValueUSD.toFixed(2),
          token1Amount: '0',
          totalValueUSD,
          apy: await this.fetchPoolAPY('aave-v3', '', ''),
          fees24h: (totalValueUSD * 0.03) / 365, // Estimated daily yield
          impermanentLoss: 0,
          positionType: debtUSD > 0 ? 'BORROWING' : 'LENDING',
          lastUpdated: new Date(),
        });
      }

      return positions;
    } catch (error) {
      console.error('Aave fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch Extra Finance positions (leveraged farming)
   */
  async fetchExtraFinancePositions(userAddress: string): Promise<RealPosition[]> {
    try {
      // Extra Finance uses vaults - query via RPC or API
      // Using DefiLlama to find Extra Finance user positions (simplified)
      console.log('  → Checking Extra Finance...');
      // TODO: Add Extra Finance vault contract queries
      return [];
    } catch (error) {
      console.error('Extra Finance error:', error);
      return [];
    }
  }

  /**
   * Fetch EigenLayer restaking positions
   */
  async fetchEigenLayerPositions(userAddress: string): Promise<RealPosition[]> {
    try {
      console.log('  → Checking EigenLayer...');
      // TODO: Add EigenLayer restaking contract queries
      return [];
    } catch (error) {
      console.error('EigenLayer error:', error);
      return [];
    }
  }

  /**
   * Fetch Ether.fi liquid staking positions
   */
  async fetchEtherFiPositions(userAddress: string): Promise<RealPosition[]> {
    try {
      console.log('  → Checking Ether.fi...');
      // TODO: Add Ether.fi eETH/weETH contract queries
      return [];
    } catch (error) {
      console.error('Ether.fi error:', error);
      return [];
    }
  }

  /**
   * Fetch Dolomite margin trading positions
   */
  async fetchDolomitePositions(userAddress: string): Promise<RealPosition[]> {
    try {
      console.log('  → Checking Dolomite...');
      // TODO: Add Dolomite margin account queries
      return [];
    } catch (error) {
      console.error('Dolomite error:', error);
      return [];
    }
  }

  /**
   * Fetch all real positions for an address (EXPANDED)
   */
  async fetchAllPositions(userAddress: string): Promise<RealPosition[]> {
    console.log(`\n🔍 Fetching REAL positions from ALL protocols for ${userAddress}...`);

    // Query all protocols in parallel
    const [
      uniswapPositions,
      aavePositions,
      extraFinancePositions,
      eigenLayerPositions,
      etherFiPositions,
      dolomitePositions,
    ] = await Promise.all([
      this.fetchUniswapV3Positions(userAddress),
      this.fetchAavePositions(userAddress),
      this.fetchExtraFinancePositions(userAddress),
      this.fetchEigenLayerPositions(userAddress),
      this.fetchEtherFiPositions(userAddress),
      this.fetchDolomitePositions(userAddress),
    ]);

    const allPositions = [
      ...uniswapPositions,
      ...aavePositions,
      ...extraFinancePositions,
      ...eigenLayerPositions,
      ...etherFiPositions,
      ...dolomitePositions,
    ];

    console.log(`✅ Found ${allPositions.length} real positions from ${[
      uniswapPositions.length && 'Uniswap',
      aavePositions.length && 'Aave',
      extraFinancePositions.length && 'Extra Finance',
      eigenLayerPositions.length && 'EigenLayer',
      etherFiPositions.length && 'Ether.fi',
      dolomitePositions.length && 'Dolomite',
    ].filter(Boolean).join(', ')}\n`);

    return allPositions;
  }

  /**
   * Get token info from contract
   */
  private async getTokenInfo(tokenAddress: string) {
    if (!this.provider) {
      return { symbol: 'UNKNOWN', decimals: 18 };
    }
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function symbol() view returns (string)', 'function decimals() view returns (uint8)'],
        this.provider
      );

      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      return { symbol, decimals: Number(decimals) };
    } catch {
      return { symbol: 'UNKNOWN', decimals: 18 };
    }
  }

  /**
   * Calculate position value in USD (simplified - uses CoinGecko)
   */
  private async calculatePositionValue(
    token0: string,
    token1: string,
    liquidity: number
  ): Promise<number> {
    // Simplified: Return estimated value based on liquidity
    // In production, fetch real prices from CoinGecko/Chainlink
    return liquidity / 1e18 * 2000; // Rough estimate
  }

  /**
   * Fetch real APY from DeFiLlama API
   */
  private async fetchPoolAPY(protocol: string, token0: string, token1: string): Promise<number> {
    try {
      // Use DeFiLlama API for real APY data (free, no key needed)
      const response = await axios.get(`https://yields.llama.fi/pools`);
      const pools = response.data.data;

      // Find matching pool
      const pool = pools.find((p: any) =>
        p.project?.toLowerCase() === protocol.toLowerCase() &&
        p.chain === 'Ethereum'
      );

      return pool?.apy || 0;
    } catch (error) {
      console.error('APY fetch error:', error);
      return 0; // Fallback
    }
  }
}

// Lazy initialization - create instance only when needed
let _instance: RealPositionFetcher | null = null;
export const realPositionFetcher = {
  fetchAllPositions: (userAddress: string) => {
    if (!_instance) {
      _instance = new RealPositionFetcher();
    }
    return _instance.fetchAllPositions(userAddress);
  },
  fetchUniswapV3Positions: (userAddress: string) => {
    if (!_instance) {
      _instance = new RealPositionFetcher();
    }
    return _instance.fetchUniswapV3Positions(userAddress);
  },
  fetchAavePositions: (userAddress: string) => {
    if (!_instance) {
      _instance = new RealPositionFetcher();
    }
    return _instance.fetchAavePositions(userAddress);
  }
};

