import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - for development)
  await prisma.portfolioPosition.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.aiChat.deleteMany();
  await prisma.apiCache.deleteMany();
  await prisma.pyusdPosition.deleteMany();
  await prisma.lpPosition.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      address: '0x1234567890123456789012345678901234567890',
      email: 'user1@example.com',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      address: '0x0987654321098765432109876543210987654321',
      email: 'user2@example.com',
    },
  });

  console.log('✅ Users created');

  // Create Protocols
  const aave = await prisma.protocol.create({
    data: {
      name: 'Aave V3',
      slug: 'aave-v3',
      baseUrl: 'https://aave.com',
      chainId: 1, // Ethereum mainnet
      isActive: true,
    },
  });

  const compound = await prisma.protocol.create({
    data: {
      name: 'Compound',
      slug: 'compound',
      baseUrl: 'https://compound.finance',
      chainId: 1, // Ethereum mainnet
      isActive: true,
    },
  });

  const curve = await prisma.protocol.create({
    data: {
      name: 'Curve Finance',
      slug: 'curve',
      baseUrl: 'https://curve.fi',
      chainId: 1, // Ethereum mainnet
      isActive: true,
    },
  });

  const uniswap = await prisma.protocol.create({
    data: {
      name: 'Uniswap V3',
      slug: 'uniswap-v3',
      baseUrl: 'https://uniswap.org',
      chainId: 1, // Ethereum mainnet
      isActive: true,
    },
  });

  console.log('✅ Protocols created');

  // Create LP Positions for Aave
  const aaveUSDC = await prisma.lpPosition.create({
    data: {
      protocolId: aave.id,
      poolAddress: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
      poolName: 'Aave V3 USDC',
      token0Symbol: 'USDC',
      token1Symbol: 'USDC',
      token0Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      token1Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      apy: 6.07,
      apr: 5.85,
      tvlUsd: 820000000,
      volume24h: 45000000,
      fees24h: 135000,
      ilRisk: 5.0, // Very low impermanent loss risk for stablecoins
      auditScore: 95.0,
      riskLevel: 'LOW',
      chainId: 1,
      dexName: 'Aave',
      isStable: true,
    },
  });

  const aaveETH = await prisma.lpPosition.create({
    data: {
      protocolId: aave.id,
      poolAddress: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
      poolName: 'Aave V3 ETH',
      token0Symbol: 'ETH',
      token1Symbol: 'ETH',
      token0Address: '0x0000000000000000000000000000000000000000',
      token1Address: '0x0000000000000000000000000000000000000000',
      apy: 3.0,
      apr: 2.95,
      tvlUsd: 520000000,
      volume24h: 28000000,
      fees24h: 84000,
      ilRisk: 15.0,
      auditScore: 95.0,
      riskLevel: 'LOW',
      chainId: 1,
      dexName: 'Aave',
      isStable: false,
    },
  });

  // Create LP Positions for Compound
  const compoundUSDC = await prisma.lpPosition.create({
    data: {
      protocolId: compound.id,
      poolAddress: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
      poolName: 'Compound USDC',
      token0Symbol: 'USDC',
      token1Symbol: 'USDC',
      token0Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      token1Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      apy: 6.13,
      apr: 5.95,
      tvlUsd: 450000000,
      volume24h: 25000000,
      fees24h: 75000,
      ilRisk: 5.0,
      auditScore: 92.0,
      riskLevel: 'LOW',
      chainId: 1,
      dexName: 'Compound',
      isStable: true,
    },
  });

  // Create LP Positions for Curve
  const curve3Pool = await prisma.lpPosition.create({
    data: {
      protocolId: curve.id,
      poolAddress: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
      poolName: 'Curve 3pool',
      token0Symbol: 'DAI',
      token1Symbol: 'USDC',
      token0Address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      token1Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      apy: 5.60,
      apr: 5.45,
      tvlUsd: 980000000,
      volume24h: 85000000,
      fees24h: 425000,
      ilRisk: 8.0,
      auditScore: 88.0,
      riskLevel: 'LOW',
      chainId: 1,
      dexName: 'Curve',
      isStable: true,
    },
  });

  // Create LP Positions for Uniswap V3
  const uniswapETHUSDC = await prisma.lpPosition.create({
    data: {
      protocolId: uniswap.id,
      poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
      poolName: 'Uniswap V3 ETH/USDC 0.3%',
      token0Symbol: 'USDC',
      token1Symbol: 'ETH',
      token0Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      token1Address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      apy: 8.5,
      apr: 8.15,
      tvlUsd: 1500000000,
      volume24h: 120000000,
      fees24h: 3600000,
      ilRisk: 35.0, // Higher IL risk for volatile pairs
      auditScore: 90.0,
      riskLevel: 'MEDIUM',
      chainId: 1,
      dexName: 'Uniswap',
      isStable: false,
    },
  });

  console.log('✅ LP Positions created');

  // Create PYUSD Positions
  const pyusdMainnet = await prisma.pyusdPosition.create({
    data: {
      poolName: 'PYUSD/USDC Pool',
      protocolName: 'Curve Finance',
      apy: 4.8,
      tvlUsd: 25000000,
      isPrimary: true,
      stabilityScore: 95.0,
      chainId: 1,
      poolAddress: '0x1234567890123456789012345678901234567890',
    },
  });

  const pyusdSecondary = await prisma.pyusdPosition.create({
    data: {
      poolName: 'PYUSD/DAI Pool',
      protocolName: 'Uniswap V3',
      apy: 5.2,
      tvlUsd: 15000000,
      isPrimary: false,
      stabilityScore: 88.0,
      chainId: 1,
      poolAddress: '0x0987654321098765432109876543210987654321',
    },
  });

  console.log('✅ PYUSD Positions created');

  // Create Portfolios for users
  const portfolio1 = await prisma.portfolio.create({
    data: {
      userId: user1.id,
      name: 'Main Portfolio',
      totalValueUsd: 50000.0,
    },
  });

  const portfolio2 = await prisma.portfolio.create({
    data: {
      userId: user2.id,
      name: 'DeFi Portfolio',
      totalValueUsd: 75000.0,
    },
  });

  console.log('✅ Portfolios created');

  // Create Portfolio Positions
  await prisma.portfolioPosition.create({
    data: {
      portfolioId: portfolio1.id,
      positionId: aaveUSDC.id,
      amountUsd: 25000.0,
      shares: 1000.0,
      entryPrice: 1.0,
      currentPrice: 1.02,
      pnlUsd: 500.0,
      pnlPercent: 2.0,
    },
  });

  await prisma.portfolioPosition.create({
    data: {
      portfolioId: portfolio1.id,
      positionId: aaveETH.id,
      amountUsd: 25000.0,
      shares: 10.5,
      entryPrice: 2400.0,
      currentPrice: 2380.0,
      pnlUsd: -210.0,
      pnlPercent: -0.84,
    },
  });

  await prisma.portfolioPosition.create({
    data: {
      portfolioId: portfolio2.id,
      positionId: uniswapETHUSDC.id,
      amountUsd: 40000.0,
      shares: 2000.0,
      entryPrice: 1.0,
      currentPrice: 1.05,
      pnlUsd: 2000.0,
      pnlPercent: 5.0,
    },
  });

  await prisma.portfolioPosition.create({
    data: {
      portfolioId: portfolio2.id,
      positionId: curve3Pool.id,
      amountUsd: 35000.0,
      shares: 1500.0,
      entryPrice: 1.0,
      currentPrice: 1.01,
      pnlUsd: 350.0,
      pnlPercent: 1.0,
    },
  });

  console.log('✅ Portfolio Positions created');

  // Create some AI Chat history
  await prisma.aiChat.create({
    data: {
      userId: user1.id,
      query: 'What are the best stablecoin pools with low risk?',
      response: 'Based on your risk profile, I recommend Aave V3 USDC and Curve 3pool. Both have high audit scores and stable returns.',
      context: {
        recommendedPools: [aaveUSDC.id, curve3Pool.id],
        riskLevel: 'LOW',
      },
      confidence: 0.92,
    },
  });

  await prisma.aiChat.create({
    data: {
      userId: user2.id,
      query: 'Show me high APY opportunities',
      response: 'Uniswap V3 ETH/USDC offers the highest APY at 8.5%, but comes with higher impermanent loss risk. Consider your risk tolerance.',
      context: {
        recommendedPools: [uniswapETHUSDC.id],
        riskLevel: 'MEDIUM',
      },
      confidence: 0.88,
    },
  });

  console.log('✅ AI Chat history created');

  // Create some API cache entries
  await prisma.apiCache.create({
    data: {
      endpoint: '/api/pools',
      data: {
        pools: [
          { id: aaveUSDC.id, apy: 6.07 },
          { id: aaveETH.id, apy: 3.0 },
          { id: compoundUSDC.id, apy: 6.13 },
        ],
      },
      ttl: 300, // 5 minutes
      expiresAt: new Date(Date.now() + 300 * 1000),
    },
  });

  await prisma.apiCache.create({
    data: {
      endpoint: '/api/pyusd-positions',
      data: {
        positions: [
          { id: pyusdMainnet.id, apy: 4.8 },
          { id: pyusdSecondary.id, apy: 5.2 },
        ],
      },
      ttl: 600, // 10 minutes
      expiresAt: new Date(Date.now() + 600 * 1000),
    },
  });

  console.log('✅ API Cache entries created');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });