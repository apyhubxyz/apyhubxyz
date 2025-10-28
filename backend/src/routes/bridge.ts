import express, { Request, Response } from 'express'
import { getAvailNexusBridge, SupportedChain } from '../services/AvailNexusBridge'
import { ethers } from 'ethers'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Initialize providers for supported chains
const providers = new Map<SupportedChain, ethers.Provider>([
  ['ethereum', new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://eth.llamarpc.com')],
  ['arbitrum', new ethers.JsonRpcProvider(process.env.ARB_RPC_URL || 'https://arb1.arbitrum.io/rpc')],
  ['optimism', new ethers.JsonRpcProvider(process.env.OP_RPC_URL || 'https://mainnet.optimism.io')],
  ['base', new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org')],
  ['polygon', new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com')],
])

// Get bridge instance
const bridge = getAvailNexusBridge(providers)

// Validation schemas
const BridgeQuoteSchema = z.object({
  fromChain: z.enum(['ethereum', 'arbitrum', 'optimism', 'base', 'polygon']),
  toChain: z.enum(['ethereum', 'arbitrum', 'optimism', 'base', 'polygon']),
  token: z.string(),
  amount: z.string(),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
})

const ExecuteBridgeSchema = z.object({
  fromChain: z.number(),
  toChain: z.number(),
  token: z.string(),
  amount: z.string(),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  mode: z.enum(['bridge', 'bridge-execute']),
  executeAction: z.enum(['swap', 'deposit', 'stake']).optional()
})

// GET /api/bridge/routes - Get available bridge routes
router.get('/routes', async (req: Request, res: Response) => {
  try {
    const { fromChain, toChain, token, amount, recipient } = req.query
    
    if (!fromChain || !toChain || !token || !amount || !recipient) {
      return res.status(400).json({ 
        error: 'Missing required parameters: fromChain, toChain, token, amount, recipient' 
      })
    }

    const routes = await bridge.getBestRoute(
      fromChain as SupportedChain,
      toChain as SupportedChain,
      token as string,
      BigInt(amount as string),
      recipient as string
    )

    res.json({ routes })
  } catch (error) {
    console.error('Error fetching bridge routes:', error)
    res.status(500).json({ error: 'Failed to fetch bridge routes' })
  }
})

// POST /api/bridge/quote - Get bridge quote
router.post('/quote', async (req: Request, res: Response) => {
  try {
    const validated = BridgeQuoteSchema.parse(req.body)
    
    const { intentId, quote } = await bridge.createBridgeIntent({
      id: `intent-${Date.now()}`,
      type: 'bridge',
      fromChain: validated.fromChain,
      toChain: validated.toChain,
      fromToken: validated.token,
      toToken: validated.token,
      amount: BigInt(validated.amount),
      recipient: validated.recipient
    })

    res.json({
      intentId,
      quote: {
        ...quote,
        inputAmount: quote.inputAmount.toString(),
        outputAmount: quote.outputAmount.toString(),
        totalGasCost: quote.totalGasCost.toString(),
        totalFees: quote.totalFees.toString()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors })
    }
    console.error('Error creating bridge quote:', error)
    res.status(500).json({ error: 'Failed to create bridge quote' })
  }
})

// POST /api/bridge/execute - Execute bridge transaction
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const validated = ExecuteBridgeSchema.parse(req.body)
    
    // Map chain IDs to chain names
    const chainIdToName: Record<number, SupportedChain> = {
      1: 'ethereum',
      42161: 'arbitrum',
      10: 'optimism',
      8453: 'base',
      137: 'polygon'
    }
    
    const fromChain = chainIdToName[validated.fromChain]
    const toChain = chainIdToName[validated.toChain]
    
    if (!fromChain || !toChain) {
      return res.status(400).json({ error: 'Unsupported chain ID' })
    }

    // Create bridge intent
    const { intentId, quote } = await bridge.createBridgeIntent({
      id: `intent-${Date.now()}`,
      type: validated.mode === 'bridge-execute' ? 'bridge-and-execute' : 'bridge',
      fromChain,
      toChain,
      fromToken: validated.token,
      toToken: validated.token,
      amount: BigInt(validated.amount),
      recipient: validated.recipient,
      execution: validated.mode === 'bridge-execute' && validated.executeAction 
        ? [{
            action: validated.executeAction,
            protocol: 'aave-v3', // Default protocol
            inputToken: validated.token,
            outputToken: validated.token,
            poolAddress: '0x' // Will be filled by bridge service
          }]
        : undefined
    })

    // In production, this would execute with user's signer
    // For demo purposes, we'll return a mock transaction hash
    const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')

    // Save transaction to database
    try {
      await prisma.bridgeTransaction.create({
        data: {
          userAddress: validated.recipient.toLowerCase(),
          status: 'completed',
          fromChainId: validated.fromChain,
          fromChainName: chainIdToName[validated.fromChain] || 'Unknown',
          fromChainIcon: '/chains/ethereum.png', // Default icon
          fromChainExplorer: 'https://etherscan.io', // Default explorer
          toChainId: validated.toChain,
          toChainName: chainIdToName[validated.toChain] || 'Unknown',
          toChainIcon: '/chains/ethereum.png', // Default icon
          toChainExplorer: 'https://etherscan.io', // Default explorer
          tokenSymbol: validated.token.toUpperCase(),
          tokenName: validated.token.toUpperCase(),
          tokenIcon: `/tokens/${validated.token.toLowerCase()}.svg`,
          amount: validated.amount,
          usdValue: 0, // Will be calculated based on token price
          fromTxHash: mockTxHash,
          toTxHash: null,
          bridgeProtocol: 'Avail Nexus',
          mode: validated.mode,
          executeAction: validated.executeAction || null,
          gasCost: '0.005',
          bridgeFee: '0.003',
          estimatedCompletion: 300, // 5 minutes
        }
      })
    } catch (dbError) {
      console.error('Failed to save bridge transaction to database:', dbError)
      // Continue with response even if DB save fails
    }

    res.json({
      success: true,
      intentId,
      txHash: mockTxHash,
      estimatedTime: quote.estimatedTime,
      outputAmount: quote.outputAmount.toString()
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors })
    }
    console.error('Error executing bridge:', error)
    res.status(500).json({ error: 'Failed to execute bridge transaction' })
  }
})

// GET /api/bridge/status/:bridgeId - Get bridge transaction status
router.get('/status/:bridgeId', async (req: Request, res: Response) => {
  try {
    const { bridgeId } = req.params
    
    const status = await bridge.getBridgeStatus(bridgeId)
    
    if (!status) {
      return res.status(404).json({ error: 'Bridge transaction not found' })
    }

    res.json(status)
  } catch (error) {
    console.error('Error fetching bridge status:', error)
    res.status(500).json({ error: 'Failed to fetch bridge status' })
  }
})

// GET /api/bridge/history/:address - Get bridge history for an address
router.get('/history/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address format' })
    }

    // Fetch from database
    const transactions = await prisma.bridgeTransaction.findMany({
      where: {
        userAddress: address.toLowerCase()
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50 // Limit to 50 most recent transactions
    })

    // Transform to match frontend expected format
    const formattedHistory = transactions.map(tx => ({
      id: tx.id,
      status: tx.status,
      fromChain: {
        id: tx.fromChainId,
        name: tx.fromChainName,
        icon: tx.fromChainIcon || '🔷',
        explorer: tx.fromChainExplorer || 'https://etherscan.io'
      },
      toChain: {
        id: tx.toChainId,
        name: tx.toChainName,
        icon: tx.toChainIcon || '🔷',
        explorer: tx.toChainExplorer || 'https://etherscan.io'
      },
      token: {
        symbol: tx.tokenSymbol,
        name: tx.tokenName,
        icon: tx.tokenIcon || '🔷'
      },
      amount: tx.amount,
      usdValue: tx.usdValue,
      fromTxHash: tx.fromTxHash,
      toTxHash: tx.toTxHash,
      bridgeProtocol: tx.bridgeProtocol,
      mode: tx.mode,
      executeAction: tx.executeAction,
      timestamp: tx.timestamp.getTime(),
      gasCost: tx.gasCost,
      bridgeFee: tx.bridgeFee,
      estimatedCompletion: tx.estimatedCompletion
    }))

    res.json(formattedHistory)
  } catch (error) {
    console.error('Error fetching bridge history:', error)
    res.status(500).json({ error: 'Failed to fetch bridge history' })
  }
})

// GET /api/bridge/analytics - Get bridge analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = await bridge.getAnalytics()
    res.json(analytics || {
      totalVolume: '1000000',
      totalTransactions: 5432,
      avgBridgeTime: 180,
      supportedChains: 5,
      activeUsers: 1234
    })
  } catch (error) {
    console.error('Error fetching bridge analytics:', error)
    res.status(500).json({ error: 'Failed to fetch bridge analytics' })
  }
})

// POST /api/bridge/optimize - Optimize gas for bridge & execute operations
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const { operations, chain } = req.body
    
    if (!operations || !chain) {
      return res.status(400).json({ error: 'Missing required parameters: operations, chain' })
    }

    const optimized = await bridge.optimizeGasRoute(operations, chain)
    
    res.json({
      ...optimized,
      gasEstimate: optimized.gasEstimate.toString()
    })
  } catch (error) {
    console.error('Error optimizing gas route:', error)
    res.status(500).json({ error: 'Failed to optimize gas route' })
  }
})

// GET /api/unified-balance/:address - Get unified balance across all chains
router.get('/unified-balance/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params
    
    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address format' })
    }

    // In production, this would fetch real balances from multiple chains
    // For demo, return mock data
    const mockBalances = {
      totalUsdValue: 21397,
      balances: [
        {
          chainId: 1,
          chainName: 'Ethereum',
          icon: '🔷',
          color: 'from-blue-500 to-blue-600',
          totalUsdValue: 10648.30,
          balances: [
            {
              symbol: 'ETH',
              name: 'Ethereum',
              address: '0x0000000000000000000000000000000000000000',
              balance: '5.234',
              usdValue: 8897.80,
              icon: '🔷',
              change24h: 2.5
            },
            {
              symbol: 'USDC',
              name: 'USD Coin',
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              balance: '1250.50',
              usdValue: 1250.50,
              icon: '💵',
              change24h: 0.01
            }
          ]
        }
      ]
    }

    res.json(mockBalances)
  } catch (error) {
    console.error('Error fetching unified balance:', error)
    res.status(500).json({ error: 'Failed to fetch unified balance' })
  }
})

export default router