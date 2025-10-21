// backend/src/services/DeFiService.ts
import { ethers } from 'ethers';

export interface APYData {
  protocol: string;
  asset: string;
  supplyAPY: number;
  borrowAPY?: number;
  totalLiquidity?: string;
  utilizationRate?: number;
  lastUpdated: string;
}

// Simplified ABI for Compound cTokens
const COMPOUND_ABI = [
  'function supplyRatePerBlock() view returns (uint256)',
  'function borrowRatePerBlock() view returns (uint256)',
  'function getCash() view returns (uint256)',
  'function totalBorrows() view returns (uint256)',
  'function totalReserves() view returns (uint256)',
  'function underlying() view returns (address)'
];

// Simplified ABI for Aave Lending Pool
const AAVE_POOL_ABI = [
  'function getReserveData(address asset) view returns (tuple(uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))'
];

export class DeFiService {
  private provider: ethers.Provider;
  
  // Contract addresses (mainnet)
  private readonly COMPOUND_CUSDC = '0x39AA39c021dfbaE8faC545936693aC917d5E7563';
  private readonly COMPOUND_CETH = '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5';
  private readonly AAVE_POOL_V3 = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
  
  // Mock token addresses
  private readonly USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  private readonly WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  private readonly DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  async getAllAPYs(): Promise<APYData[]> {
    const results: APYData[] = [];
    
    try {
      // Fetch Compound data
      const compoundData = await this.getCompoundAPYs();
      results.push(...compoundData);
      
      // Fetch Aave data
      const aaveData = await this.getAaveAPYs();
      results.push(...aaveData);
      
      // Add mock data for Euler (as it's not easily accessible without complex setup)
      results.push(...this.getMockEulerData());
      
    } catch (error) {
      console.error('Error fetching APY data:', error);
      // Return mock data if real data fails
      return this.getMockData();
    }
    
    return results;
  }

  private async getCompoundAPYs(): Promise<APYData[]> {
    try {
      const cUSDC = new ethers.Contract(this.COMPOUND_CUSDC, COMPOUND_ABI, this.provider);
      const cETH = new ethers.Contract(this.COMPOUND_CETH, COMPOUND_ABI, this.provider);
      
      // Fetch rates (returns rate per block)
      const [usdcSupplyRate, usdcBorrowRate, ethSupplyRate, ethBorrowRate] = await Promise.all([
        cUSDC.supplyRatePerBlock(),
        cUSDC.borrowRatePerBlock(),
        cETH.supplyRatePerBlock(),
        cETH.borrowRatePerBlock()
      ]);
      
      // Convert to APY (blocks per year = 2,628,000)
      const blocksPerYear = 2628000;
      const convertToAPY = (ratePerBlock: bigint) => {
        const rate = Number(ratePerBlock) / 1e18;
        return ((1 + rate) ** blocksPerYear - 1) * 100;
      };
      
      return [
        {
          protocol: 'Compound',
          asset: 'USDC',
          supplyAPY: convertToAPY(usdcSupplyRate),
          borrowAPY: convertToAPY(usdcBorrowRate),
          lastUpdated: new Date().toISOString()
        },
        {
          protocol: 'Compound',
          asset: 'ETH',
          supplyAPY: convertToAPY(ethSupplyRate),
          borrowAPY: convertToAPY(ethBorrowRate),
          lastUpdated: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Compound fetch error:', error);
      return [];
    }
  }

  private async getAaveAPYs(): Promise<APYData[]> {
    try {
      const aavePool = new ethers.Contract(this.AAVE_POOL_V3, AAVE_POOL_ABI, this.provider);
      
      // Fetch reserve data for USDC and WETH
      const [usdcData, wethData] = await Promise.all([
        aavePool.getReserveData(this.USDC),
        aavePool.getReserveData(this.WETH)
      ]);
      
      // Convert ray (27 decimals) to APY percentage
      const rayToAPY = (rate: bigint) => {
        return Number(rate) / 1e25; // Convert from ray to percentage
      };
      
      return [
        {
          protocol: 'Aave V3',
          asset: 'USDC',
          supplyAPY: rayToAPY(usdcData.currentLiquidityRate),
          borrowAPY: rayToAPY(usdcData.currentVariableBorrowRate),
          lastUpdated: new Date().toISOString()
        },
        {
          protocol: 'Aave V3',
          asset: 'WETH',
          supplyAPY: rayToAPY(wethData.currentLiquidityRate),
          borrowAPY: rayToAPY(wethData.currentVariableBorrowRate),
          lastUpdated: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Aave fetch error:', error);
      return [];
    }
  }

  private getMockEulerData(): APYData[] {
    // Mock data for Euler (with realistic APY values)
    return [
      {
        protocol: 'Euler',
        asset: 'USDC',
        supplyAPY: 4.2,
        borrowAPY: 5.8,
        totalLiquidity: '125000000',
        utilizationRate: 68.5,
        lastUpdated: new Date().toISOString()
      },
      {
        protocol: 'Euler',
        asset: 'ETH',
        supplyAPY: 2.1,
        borrowAPY: 3.2,
        totalLiquidity: '85000',
        utilizationRate: 45.2,
        lastUpdated: new Date().toISOString()
      },
      {
        protocol: 'Euler',
        asset: 'DAI',
        supplyAPY: 3.8,
        borrowAPY: 5.2,
        totalLiquidity: '95000000',
        utilizationRate: 72.3,
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  private getMockData(): APYData[] {
    // Fallback mock data if real fetches fail
    return [
      {
        protocol: 'Compound',
        asset: 'USDC',
        supplyAPY: 5.2,
        borrowAPY: 7.1,
        totalLiquidity: '450000000',
        utilizationRate: 75.3,
        lastUpdated: new Date().toISOString()
      },
      {
        protocol: 'Aave V3',
        asset: 'USDC',
        supplyAPY: 4.8,
        borrowAPY: 6.5,
        totalLiquidity: '820000000',
        utilizationRate: 68.9,
        lastUpdated: new Date().toISOString()
      },
      {
        protocol: 'Euler',
        asset: 'USDC',
        supplyAPY: 4.2,
        borrowAPY: 5.8,
        totalLiquidity: '125000000',
        utilizationRate: 62.1,
        lastUpdated: new Date().toISOString()
      },
      // Add more mock data for other assets
      {
        protocol: 'Compound',
        asset: 'ETH',
        supplyAPY: 2.3,
        borrowAPY: 3.5,
        totalLiquidity: '320000',
        utilizationRate: 45.2,
        lastUpdated: new Date().toISOString()
      },
      {
        protocol: 'Aave V3',
        asset: 'WETH',
        supplyAPY: 2.1,
        borrowAPY: 3.2,
        totalLiquidity: '520000',
        utilizationRate: 42.8,
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  async getProtocolAPYs(protocol: string): Promise<APYData[]> {
    const allData = await this.getAllAPYs();
    return allData.filter(d => d.protocol.toLowerCase() === protocol.toLowerCase());
  }

  async getTokenAPYs(token: string): Promise<APYData[]> {
    const allData = await this.getAllAPYs();
    return allData.filter(d => d.asset.toLowerCase() === token.toLowerCase());
  }
}