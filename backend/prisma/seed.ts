import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - for development)
  await prisma.userPosition.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.historicalAPY.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.user.deleteMany();

  // Create Protocols
  const aave = await prisma.protocol.create({
    data: {
      name: 'Aave V3',
      slug: 'aave-v3',
      description: 'Decentralized non-custodial liquidity protocol where users can participate as suppliers or borrowers.',
      website: 'https://aave.com',
      logo: '/logos/aave.png',
      chain: 'ethereum',
      audited: true,
      auditedBy: 'OpenZeppelin, Trail of Bits',
      tvl: 5200000000,
      active: true,
    },
  });

  const compound = await prisma.protocol.create({
    data: {
      name: 'Compound',
      slug: 'compound',
      description: 'Algorithmic, autonomous interest rate protocol built for developers.',
      website: 'https://compound.finance',
      logo: '/logos/compound.png',
      chain: 'ethereum',
      audited: true,
      auditedBy: 'OpenZeppelin, Trail of Bits',
      tvl: 2100000000,
      active: true,
    },
  });

  const euler = await prisma.protocol.create({
    data: {
      name: 'Euler',
      slug: 'euler',
      description: 'Permissionless lending protocol on Ethereum.',
      website: 'https://euler.finance',
      logo: '/logos/euler.png',
      chain: 'ethereum',
      audited: true,
      auditedBy: 'Certora, Solidified',
      tvl: 125000000,
      active: true,
    },
  });

  const curve = await prisma.protocol.create({
    data: {
      name: 'Curve Finance',
      slug: 'curve',
      description: 'Decentralized exchange optimized for stablecoin trading.',
      website: 'https://curve.fi',
      logo: '/logos/curve.png',
      chain: 'ethereum',
      audited: true,
      auditedBy: 'Trail of Bits, MixBytes',
      tvl: 3800000000,
      active: true,
    },
  });

  console.log('✅ Protocols created');

  // Create Pools for Aave V3
  const aaveUSDC = await prisma.pool.create({
    data: {
      protocolId: aave.id,
      name: 'Aave V3 USDC',
      asset: 'USDC',
      assetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      poolAddress: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
      poolType: 'lending',
      isLoopable: true,
      supplyAPY: 4.82,
      borrowAPY: 6.35,
      rewardAPY: 1.25,
      totalAPY: 6.07,
      tvl: 820000000,
      availableLiquidity: 615000000,
      utilizationRate: 25.0,
      riskLevel: 'low',
      riskScore: 25,
      minDeposit: 0,
      lockPeriod: 0,
      active: true,
      verified: true,
    },
  });

  const aaveETH = await prisma.pool.create({
    data: {
      protocolId: aave.id,
      name: 'Aave V3 ETH',
      asset: 'ETH',
      assetAddress: '0x0000000000000000000000000000000000000000',
      poolAddress: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
      poolType: 'lending',
      isLoopable: true,
      supplyAPY: 2.15,
      borrowAPY: 3.28,
      rewardAPY: 0.85,
      totalAPY: 3.0,
      tvl: 520000000,
      availableLiquidity: 298000000,
      utilizationRate: 42.7,
      riskLevel: 'low',
      riskScore: 20,
      minDeposit: 0,
      lockPeriod: 0,
      active: true,
      verified: true,
    },
  });

  const aaveDAI = await prisma.pool.create({
    data: {
      protocolId: aave.id,
      name: 'Aave V3 DAI',
      asset: 'DAI',
      assetAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      poolAddress: '0x018008bfb33d285247A21d44E50697654f754e63',
      poolType: 'lending',
      isLoopable: true,
      supplyAPY: 5.21,
      borrowAPY: 7.12,
      rewardAPY: 1.15,
      totalAPY: 6.36,
      tvl: 900000000,
      availableLiquidity: 675000000,
      utilizationRate: 25.0,
      riskLevel: 'low',
      riskScore: 22,
      minDeposit: 0,
      lockPeriod: 0,
      active: true,
      verified: true,
    },
  });

  // Create Pools for Compound
  const compoundUSDC = await prisma.pool.create({
    data: {
      protocolId: compound.id,
      name: 'Compound USDC',
      asset: 'USDC',
      assetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      poolAddress: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
      poolType: 'lending',
      isLoopable: false,
      supplyAPY: 5.18,
      borrowAPY: 7.05,
      rewardAPY: 0.95,
      totalAPY: 6.13,
      tvl: 450000000,
      availableLiquidity: 337500000,
      utilizationRate: 25.0,
      riskLevel: 'low',
      riskScore: 28,
      minDeposit: 0,
      lockPeriod: 0,
      active: true,
      verified: true,
    },
  });

  const compoundETH = await prisma.pool.create({
    data: {
      protocolId: compound.id,
      name: 'Compound ETH',
      asset: 'ETH',
      assetAddress: '0x0000000000000000000000000000000000000000',
      poolAddress: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
      poolType: 'lending',
      isLoopable: false,
      supplyAPY: 2.28,
      borrowAPY: 3.42,
      rewardAPY: 0.65,
      totalAPY: 2.93,
      tvl: 320000000,
      availableLiquidity: 208000000,
      utilizationRate: 35.0,
      riskLevel: 'low',
      riskScore: 25,
      minDeposit: 0,
      lockPeriod: 0,
      active: true,
      verified: true,
    },
  });

  // Create Pools for Euler
  const eulerUSDC = await prisma.pool.create({
    data: {
      protocolId: euler.id,
      name: 'Euler USDC',
      asset: 'USDC',
      assetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      poolAddress: '0xEb91861f8A4e1C12333F42DCE8fB0Ecdc28dA716',
      poolType: 'lending',
      isLoopable: true,
      supplyAPY: 4.25,
      borrowAPY: 5.82,
      rewardAPY: null,
      totalAPY: 4.25,
      tvl: 125000000,
      availableLiquidity: 85625000,
      utilizationRate: 31.5,
      riskLevel: 'medium',
      riskScore: 45,
      minDeposit: 0,
      lockPeriod: 0,
      active: true,
      verified: true,
    },
  });

  const eulerETH = await prisma.pool.create({
    data: {
      protocolId: euler.id,
      name: 'Euler ETH',
      asset: 'ETH',
      assetAddress: '0x0000000000000000000000000000000000000000',
      poolAddress: '0x1b808F49ADD4b8C6b5117d9681cF7312Fcf0dC1D',
      poolType: 'lending',
      isLoopable: true,
      supplyAPY: 2.05,
      borrowAPY: 3.15,
      rewardAPY: null,
      totalAPY: 2.05,
      tvl: 85000000,
      availableLiquidity: 46625000,
      utilizationRate: 45.1,
      riskLevel: 'medium',
      riskScore: 42,
      minDeposit: 0,
      lockPeriod: 0,
      active: true,
      verified: true,
    },
  });

  // Create Curve LP Pools (Double staking)
  const curveUSDPool = await prisma.pool.create({
    data: {
      protocolId: curve.id,
      name: 'Curve 3pool',
      asset: 'USD',
      assetAddress: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490',
      poolAddress: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
      poolType: 'double',
      isLoopable: false,
      supplyAPY: 3.45,
      borrowAPY: null,
      rewardAPY: 2.15,
      totalAPY: 5.60,
      tvl: 980000000,
      availableLiquidity: 980000000,
      utilizationRate: 75.2,
      riskLevel: 'low',
      riskScore: 18,
      minDeposit: 100,
      lockPeriod: 0,
      active: true,
      verified: true,
    },
  });

  const curveETHPool = await prisma.pool.create({
    data: {
      protocolId: curve.id,
      name: 'Curve stETH',
      asset: 'ETH',
      assetAddress: '0x06325440D014e39736583c165C2963BA99fAf14E',
      poolAddress: '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022',
      poolType: 'double',
      isLoopable: false,
      supplyAPY: 3.82,
      borrowAPY: null,
      rewardAPY: 1.85,
      totalAPY: 5.67,
      tvl: 1200000000,
      availableLiquidity: 1200000000,
      utilizationRate: 82.3,
      riskLevel: 'low',
      riskScore: 20,
      minDeposit: 0.01,
      lockPeriod: 0,
      active: true,
      verified: true,
    },
  });

  console.log('✅ Pools created');

  // Create some historical data for charts
  const pools = [aaveUSDC, aaveETH, compoundUSDC, curveUSDPool];
  const now = new Date();

  for (const pool of pools) {
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const variance = (Math.random() - 0.5) * 0.5; // Random variance
      const totalAPY = parseFloat(pool.totalAPY.toString()) + variance;

      await prisma.historicalAPY.create({
        data: {
          poolId: pool.id,
          supplyAPY: pool.supplyAPY,
          borrowAPY: pool.borrowAPY,
          totalAPY: totalAPY,
          tvl: pool.tvl,
          timestamp: date,
        },
      });
    }
  }

  console.log('✅ Historical data created');
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
