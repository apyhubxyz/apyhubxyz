/**
 * Envio HyperSync Configuration
 * Indexes LP positions and yield data from multiple chains
 */

export const ENVIO_CONFIG = {
  // API Configuration
  apiKey: process.env.ENVIO_HYPERSYNC_API_KEY || '',
  hyperIndexUrl: 'https://api.envio.dev/hypersync/v1',  // Not used for mainnet RPC; kept for reference
  
  // Networks to index (switch to mainnet for real data)
  networks: [
    // Comment out Sepolia for now
    // {
    //   id: 11155111,  // Sepolia
    //   name: 'sepolia',
    //   rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    //   startBlock: 1234567,
    //   confirmations: 12,
    // },
    {
      id: 1,  // Ethereum Mainnet for real positions
      name: 'ethereum',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/Qb1HjrRk7epyN-yl1MjjcZRx1r3CmSHj' || 'https://eth-mainnet.g.alchemy.com/v2/demo',  // Use your Infura/Alchemy key or public demo (limited)
      startBlock: 19000000,  // Recent block to speed up
      confirmations: 12,
    },
    // Add more mainnets as needed (e.g., Arbitrum id: 42161)
  ],
  
  // Protocols to index
  protocols: [
    // AMMs
    {
      name: 'Uniswap V3',
      contracts: {
        ethereum: {
          factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
          positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
        },
        arbitrum: {
          factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
          positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
        },
      },
      events: [
        'IncreaseLiquidity(uint256,uint128,uint256,uint256)',
        'DecreaseLiquidity(uint256,uint128,uint256,uint256)',
        'Collect(uint256,address,uint256,uint256)',
      ],
    },
    
    // Lending
    {
      name: 'Aave V3',
      contracts: {
        ethereum: {
          pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
          dataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3',
        },
        arbitrum: {
          pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
          dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
        },
      },
      events: [
        'Supply(address,address,address,uint256,uint16)',
        'Withdraw(address,address,address,uint256)',
        'Borrow(address,address,address,uint256,uint256,uint256,uint16)',
        'Repay(address,address,address,uint256,bool)',
      ],
    },
    
    // Liquity V2 (BOLD strategies)
    {
      name: 'Liquity V2',
      contracts: {
        ethereum: {
          borrowerOperations: '0x24179CD81c9e782A4096035f7eC97fB8B783e007',
          stabilityPool: '0x66017D22b0f8556afDd19FC67041899Eb65a21bb',
          boldToken: '0x0000000000000000000000000000000000000000', // To be updated
        },
      },
      events: [
        'TroveUpdated(address,uint256,uint256,uint256,uint8)',
        'StabilityPoolDeposit(address,uint256)',
      ],
    },
    
    // Curve Finance
    {
      name: 'Curve',
      contracts: {
        ethereum: {
          registry: '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5',
          gauge: '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB',
        },
      },
      events: [
        'AddLiquidity(address,uint256[],uint256[],uint256,uint256)',
        'RemoveLiquidity(address,uint256[],uint256[])',
        'TokenExchange(address,int128,uint256,int128,uint256)',
      ],
    },
    
    // Pendle (PT/YT strategies)
    {
      name: 'Pendle',
      contracts: {
        ethereum: {
          router: '0x00000000005BBc2f6aD2338B3Cd802203Ff5e7D',
          marketFactory: '0x27b1dafCFe19495BC150c1c1ab3eE93006b0E4ca',
        },
        arbitrum: {
          router: '0x00000000005BBc2f6aD2338B3Cd802203Ff5e7D',
          marketFactory: '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced',
        },
      },
      events: [
        'Mint(address,address,uint256,uint256)',
        'Burn(address,address,uint256,uint256)',
        'Swap(address,address,int256,int256)',
      ],
    },
  ],
  
  // Indexing configuration
  indexing: {
    batchSize: 1000,
    maxRetries: 3,
    retryDelay: 5000, // ms
    cacheEnabled: true,
    cacheTTL: 60, // seconds
    webhookUrl: process.env.ENVIO_WEBHOOK_URL,
    websocketEnabled: true,
  },
  
  // Data processing
  processing: {
    calculateAPY: true,
    calculateIL: true,
    trackGasUsage: true,
    enrichWithPrices: true,
    aggregateByUser: true,
  },
};

// Event signature helpers
export const EVENT_SIGNATURES = {
  // ERC20
  Transfer: 'Transfer(address,address,uint256)',
  Approval: 'Approval(address,address,uint256)',
  
  // LP Events
  Mint: 'Mint(address,uint256,uint256)',
  Burn: 'Burn(address,uint256,uint256)',
  Swap: 'Swap(address,uint256,uint256,uint256,uint256,address)',
  Sync: 'Sync(uint112,uint112)',
  
  // Lending Events
  Deposit: 'Deposit(address,address,uint256)',
  Withdraw: 'Withdraw(address,address,uint256)',
  Borrow: 'Borrow(address,uint256,uint256,uint256)',
  Repay: 'Repay(address,address,uint256)',
  Liquidate: 'Liquidate(address,address,uint256,uint256,address)',
};

export default ENVIO_CONFIG;