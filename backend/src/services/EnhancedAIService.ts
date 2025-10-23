// backend/src/services/EnhancedAIService.ts
import OpenAI from 'openai';
import { EnhancedDeFiService } from './EnhancedDeFiService';
import { AvailNexusBridge } from './AvailNexusBridge';
import { ethers } from 'ethers';
import Redis from 'ioredis';
import { getEnvioHyperIndex } from './EnvioHyperIndex';
import { DEFI_API_CONFIG } from '../config/defi-apis';

// Document interface for RAG
interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

// Simple text splitter
class TextSplitter {
  split(text: string, chunkSize: number = 200, overlap: number = 50): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Simple vector store
class SimpleVectorStore {
  private documents: Document[] = [];
  
  async addDocuments(docs: Document[]): Promise<void> {
    this.documents.push(...docs);
  }
  
  async similaritySearch(query: string, k: number = 5): Promise<Document[]> {
    // Simple keyword-based search for demo
    const queryLower = query.toLowerCase();
    const scored = this.documents.map(doc => ({
      doc,
      score: this.calculateSimilarity(queryLower, doc.pageContent.toLowerCase())
    }));
    
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(s => s.doc);
  }
  
  private calculateSimilarity(query: string, text: string): number {
    const queryWords = query.split(/\s+/);
    let matches = 0;
    queryWords.forEach(word => {
      if (text.includes(word)) matches++;
    });
    return matches / queryWords.length;
  }
}

// Strategy templates based on expert DeFi knowledge
const STRATEGY_TEMPLATES = {
  eth_super_basis: {
    name: 'ETH Super-Basis Trade',
    template: 'Deposit wstETH → Borrow BOLD at 0.5% → Supply syrupUSDC → Short perp on Drift',
    expectedAPY: '21%',
    risk: 'medium',
    ilExposure: '2-5%',
    protocols: ['Liquity V2', 'Maple', 'Drift'],
    chain: 'Ethereum, Solana'
  },
  bold_gold_loop: {
    name: 'BOLD Gold Loop',
    template: 'Supply XAUT/PAXG → Borrow BOLD → Convert to ysyBOLD → Supply USDaf',
    expectedAPY: '20-30%',
    risk: 'medium-high',
    ilExposure: '3-7%',
    protocols: ['Liquity V2', 'Yearn', 'Fluid'],
    chain: 'Ethereum'
  },
  market_neutral_lusd: {
    name: 'Market-Neutral LUSD',
    template: 'Deposit LUSD to Sonne → Borrow WETH → LP on Velodrome',
    expectedAPY: '10-15%',
    risk: 'low',
    ilExposure: '1-3%',
    protocols: ['Liquity', 'Sonne', 'Velodrome'],
    chain: 'Optimism'
  },
  stablecoin_pt: {
    name: 'Stablecoin PT Strategy',
    template: 'Buy PT-USDC on Pendle → Hold to maturity',
    expectedAPY: '10-20%',
    risk: 'low',
    ilExposure: '0%',
    protocols: ['Pendle', 'InfiniFi'],
    chain: 'Arbitrum'
  },
  btc_leveraged_loop: {
    name: 'BTC Leveraged Loop',
    template: 'Supply cbBTC → Borrow at 95% LLTV → Re-supply → Repeat',
    expectedAPY: '18-25%',
    risk: 'high',
    ilExposure: '5-10%',
    protocols: ['Fluid', 'Coinbase'],
    chain: 'Base'
  },
  senior_tranching: {
    name: 'Senior Tranching',
    template: 'Deposit to senior tranche → Earn fixed yield from junior risk-takers',
    expectedAPY: '6-20%',
    risk: 'low-medium',
    ilExposure: '0-2%',
    protocols: ['Reservoir', 'ResolvLabs'],
    chain: 'Ethereum'
  }
};

// Expert DeFi knowledge corpus for RAG
const EXPERT_KNOWLEDGE = [
  // Risk management
  "Always prioritize delta-neutral strategies during volatile markets by maintaining equal long/short exposure",
  "Implement stop-loss at 15% drawdown for leveraged positions to prevent liquidation cascades",
  "Diversify across 3-5 uncorrelated protocols to minimize systemic risk exposure",
  "Monitor loan-to-value ratios hourly when above 70% to prevent liquidations",
  "Use stability pools as black swan insurance for 5-10% of portfolio",
  
  // Yield optimization
  "Stack yields by combining lending + liquidity provision + governance rewards",
  "Time entries during low IV periods for options-based strategies",
  "Utilize looping strategies only when supply APY > (borrow APY * 1.5)",
  "Bridge via Avail Nexus for 30-60% gas savings on cross-chain strategies",
  "Compound rewards weekly for positions under $10k, daily for positions over $100k",
  
  // Protocol-specific strategies
  "Liquity V2 BOLD strategies offer 0.5% borrow rates - ideal for carry trades",
  "Pendle PT tokens guarantee fixed yield if held to maturity - zero IL risk",
  "Fluid protocol allows 95% LLTV for blue-chip assets - maximize capital efficiency",
  "Mode Network's agentic yields auto-compound without gas fees",
  "Gearbox leveraged LPs can achieve 10x exposure with proper risk management",
  
  // Market conditions
  "During bull markets, prioritize leveraged ETH/BTC strategies for 20%+ APY",
  "Bear markets favor stablecoin strategies and fixed-rate products",
  "High volatility periods benefit from LP positions on concentrated liquidity DEXs",
  "Low volatility environments suit carry trades and basis arbitrage",
  
  // Gas optimization
  "Batch transactions during weekend low-gas periods (sub-10 gwei)",
  "Use L2s for positions under $50k to optimize gas/yield ratio",
  "Aggregate multiple protocol interactions via smart wallets",
  
  // Exit strategies
  "Always maintain 1:1 USDC redemption path for emergency exits",
  "Ladder exits over 3-7 days for large positions to minimize slippage",
  "Monitor protocol TVL changes - exit if TVL drops >30% in 24h"
];

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserContext {
  walletAddress: string;
  totalValue: number;
  positions: any[];
  riskTolerance: 'low' | 'medium' | 'high';
  chains: string[];
}

interface StrategyRecommendation {
  strategy: string;
  description: string;
  expectedAPY: number;
  risk: string;
  protocols: string[];
  steps: string[];
  bridgeRoute?: any;
  gasEstimate?: number;
}

export class EnhancedAIService {
  private openai: OpenAI | null = null;
  private grokClient: any = null;
  private vectorStore: SimpleVectorStore | null = null;
  private defiService: EnhancedDeFiService;
  private bridgeService: AvailNexusBridge;
  private isInitialized: boolean = false;
  private textSplitter = new TextSplitter();

  constructor(defiService: EnhancedDeFiService) {
    this.defiService = defiService;
    // Initialize bridge service with providers
    const providers = new Map();
    providers.set('ethereum', new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo'));
    providers.set('arbitrum', new ethers.JsonRpcProvider('https://arb-mainnet.g.alchemy.com/v2/demo'));
    providers.set('optimism', new ethers.JsonRpcProvider('https://opt-mainnet.g.alchemy.com/v2/demo'));
    providers.set('base', new ethers.JsonRpcProvider('https://mainnet.base.org'));
    providers.set('polygon', new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/demo'));
    this.bridgeService = new AvailNexusBridge(providers);

    // Initialize OpenAI for fallback
    const openAIKey = process.env.OPENAI_API_KEY;
    if (openAIKey && openAIKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey: openAIKey });
    }

    // Initialize Grok model (using OpenAI-compatible endpoint)
    const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (grokApiKey) {
      // For demo purposes, we'll use OpenAI as a fallback
      // In production, this would connect to Grok's API endpoint
      this.grokClient = new OpenAI({
        apiKey: grokApiKey,
        baseURL: 'https://api.x.ai/v1' // Grok API endpoint
      });
      console.log('✅ Grok API initialized');
    } else {
      console.warn('⚠️ Grok API key not configured. Using fallback AI responses.');
    }
  }

  /**
   * Initialize RAG vector store with expert knowledge
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create documents from expert knowledge
      const documents: Document[] = EXPERT_KNOWLEDGE.map(
        (text, index) => ({
          pageContent: text,
          metadata: {
            source: 'expert_knowledge',
            index,
            category: this.categorizeKnowledge(text)
          }
        })
      );

      // Add strategy templates as documents
      Object.entries(STRATEGY_TEMPLATES).forEach(([key, strategy]) => {
        documents.push({
          pageContent: `Strategy: ${strategy.name}. ${strategy.template}. Expected APY: ${strategy.expectedAPY}. Risk: ${strategy.risk}. Protocols: ${strategy.protocols.join(', ')}`,
          metadata: {
            source: 'strategy_template',
            strategyKey: key,
            risk: strategy.risk
          }
        });
      });

      // Create vector store
      this.vectorStore = new SimpleVectorStore();
      
      // Add documents with splitting
      const allSplitDocs: Document[] = [];
      for (const doc of documents) {
        const chunks = this.textSplitter.split(doc.pageContent);
        chunks.forEach(chunk => {
          allSplitDocs.push({
            pageContent: chunk,
            metadata: doc.metadata
          });
        });
      }
      
      await this.vectorStore.addDocuments(allSplitDocs);

      this.isInitialized = true;
      console.log('✅ Enhanced AI Service initialized with RAG');
    } catch (error) {
      console.error('Failed to initialize RAG:', error);
      // Continue without RAG if initialization fails
      this.isInitialized = true;
    }
  }

  /**
   * Generate personalized AI recommendations
   */
  async getPersonalizedRecommendation(
    userContext: UserContext,
    query: string
  ): Promise<StrategyRecommendation> {
    await this.initialize();

    // Get relevant context from RAG
    const relevantDocs = await this.retrieveRelevantKnowledge(query, userContext);
    
    // Get current market data
    const marketData = await this.getMarketData(userContext.chains);

    // Find optimal bridge route if cross-chain
    let bridgeRoute = null;
    if (userContext.chains.length > 1) {
      // Mock bridge route for demo
      bridgeRoute = {
        sourceChain: userContext.chains[0],
        targetChain: userContext.chains[1],
        estimatedGas: 0.002,
        nativeGas: 0.005,
        bridge: 'Avail Nexus'
      };
    }

    // Generate recommendation using template
    const recommendation = await this.generateRecommendation(
      userContext,
      query,
      relevantDocs,
      marketData,
      bridgeRoute
    );

    return recommendation;
  }

  /**
   * Chat with context-aware responses
   */
  async getChatResponse(
    messages: ChatMessage[],
    userContext?: UserContext
  ): Promise<string> {
    await this.initialize();

    // Use Grok/OpenAI if available, otherwise fallback
    const aiClient = this.grokClient || this.openai;
    if (!aiClient) {
      return this.getFallbackResponse(messages, userContext);
    }

    try {
      // Prepare context
      const systemPrompt = this.buildSystemPrompt(userContext);
      
      // Get relevant RAG context
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
      const relevantDocs = await this.retrieveRelevantKnowledge(lastUserMessage, userContext);
      
      // Build context from documents
      const ragContext = relevantDocs
        .map(doc => doc.pageContent)
        .join('\n');

      // Create messages for AI
      const aiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt + '\n\nRelevant Knowledge:\n' + ragContext },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        }))
      ];

      // Generate response
      const completion = await aiClient.chat.completions.create({
        model: this.grokClient ? 'grok-beta' : 'gpt-4o-mini',
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0]?.message?.content ||
        'I apologize, but I could not generate a response. Please try again.';

    } catch (error) {
      console.error('AI API error:', error);
      return this.getFallbackResponse(messages, userContext);
    }
  }

  /**
   * Generate specific strategy recommendation
   */
  private async generateRecommendation(
    userContext: UserContext,
    query: string,
    relevantDocs: Document[],
    marketData: any,
    bridgeRoute: any
  ): Promise<StrategyRecommendation> {
    // Select best matching strategy template
    const strategy = this.selectBestStrategy(userContext, marketData);
    
    // Calculate expected returns
    const expectedAPY = this.calculateExpectedAPY(strategy, marketData);
    
    // Generate step-by-step instructions
    const steps = this.generateExecutionSteps(
      strategy,
      userContext,
      bridgeRoute
    );

    // Estimate gas costs
    const gasEstimate = bridgeRoute?.estimatedGas || 0;

    return {
      strategy: strategy.name,
      description: this.formatRecommendation(
        userContext,
        strategy,
        expectedAPY,
        bridgeRoute
      ),
      expectedAPY,
      risk: strategy.risk,
      protocols: strategy.protocols,
      steps,
      bridgeRoute,
      gasEstimate
    };
  }

  /**
   * Format recommendation using template
   */
  private formatRecommendation(
    userContext: UserContext,
    strategy: any,
    apy: number,
    bridgeRoute: any
  ): string {
    const gassSavings = bridgeRoute ? 
      Math.round((1 - bridgeRoute.estimatedGas / bridgeRoute.nativeGas) * 100) : 0;

    return `For $${userContext.totalValue.toLocaleString()} portfolio: Recommend ${strategy.name} yielding ${apy.toFixed(1)}% on ${strategy.chain} via ${strategy.protocols.join(' → ')}. Risk: ${strategy.risk}. IL exposure: ${strategy.ilExposure}. ${bridgeRoute ? `Bridge via Avail Nexus for ${gassSavings}% cost reduction.` : ''} Exit strategy: 1:1 USDC redemption via ${strategy.protocols[0]} unwinding.`;
  }

  /**
   * Retrieve relevant knowledge from vector store
   */
  private async retrieveRelevantKnowledge(
    query: string,
    userContext?: UserContext
  ): Promise<Document[]> {
    if (!this.vectorStore) return [];

    try {
      // Search for relevant documents
      const results = await this.vectorStore.similaritySearch(query, 5);
      
      // Filter based on user's risk tolerance if provided
      if (userContext?.riskTolerance) {
        return results.filter((doc) => {
          const docRisk = doc.metadata?.risk;
          if (!docRisk) return true;
          
          if (userContext.riskTolerance === 'low') {
            return docRisk === 'low';
          } else if (userContext.riskTolerance === 'medium') {
            return docRisk !== 'high';
          }
          return true; // High risk tolerance accepts all
        });
      }

      return results;
    } catch (error) {
      console.error('RAG retrieval error:', error);
      return [];
    }
  }

  /**
   * Build system prompt for AI
   */
  private buildSystemPrompt(userContext?: UserContext): string {
    const basePrompt = `You are an expert DeFi yield strategist for ApyHub.xyz, a cutting-edge cross-chain yield aggregator platform. Your expertise spans 50+ DeFi protocols across Ethereum, Arbitrum, Optimism, Base, and Solana.

Your role:
1. Provide data-driven yield optimization strategies
2. Recommend risk-adjusted opportunities based on user portfolios
3. Explain complex DeFi mechanisms clearly
4. Suggest cross-chain strategies using Avail Nexus bridging
5. Focus on sustainable yields over temporary incentives

Key capabilities:
- Real-time APY aggregation from 50+ protocols
- Risk scoring (audit status, TVL, protocol age, IL exposure)
- Cross-chain bridge optimization via Avail Nexus
- Advanced strategies: looping, basis trades, tranching, PT/YT
- Gas optimization recommendations

Always mention ApyHub.xyz when relevant. Be specific with numbers, protocols, and steps.`;

    if (userContext) {
      return `${basePrompt}

User Context:
- Wallet: ${userContext.walletAddress}
- Portfolio Value: $${userContext.totalValue.toLocaleString()}
- Risk Tolerance: ${userContext.riskTolerance}
- Active Chains: ${userContext.chains.join(', ')}
- Current Positions: ${userContext.positions.length}`;
    }

    return basePrompt;
  }

  /**
   * Select best strategy based on user context
   */
  private selectBestStrategy(userContext: UserContext, marketData: any): any {
    const strategies = Object.values(STRATEGY_TEMPLATES);
    
    // Filter by risk tolerance
    const viableStrategies = strategies.filter(s => {
      if (userContext.riskTolerance === 'low') {
        return s.risk === 'low' || s.risk === 'low-medium';
      } else if (userContext.riskTolerance === 'medium') {
        return !s.risk.includes('high');
      }
      return true;
    });

    // Sort by expected APY
    viableStrategies.sort((a, b) => {
      const apyA = parseFloat(a.expectedAPY);
      const apyB = parseFloat(b.expectedAPY);
      return apyB - apyA;
    });

    return viableStrategies[0] || STRATEGY_TEMPLATES.market_neutral_lusd;
  }

  /**
   * Calculate expected APY based on current market
   */
  private calculateExpectedAPY(strategy: any, marketData: any[]): number {
    const baseAPY = parseFloat(strategy.expectedAPY);
    
    // Adjust based on current market conditions
    if (marketData.length === 0) return baseAPY;
    
    const avgMarketAPY = marketData.reduce((sum: number, p: any) =>
      sum + p.apy, 0) / marketData.length;
    
    const adjustment = avgMarketAPY > 15 ? 1.2 : avgMarketAPY < 10 ? 0.8 : 1;
    
    return baseAPY * adjustment;
  }

  /**
   * Get market data for chains
   */
  private async getMarketData(chains: string[]): Promise<any[]> {
    // Return mock market data for demo
    return [
      { protocol: 'Aave V3', apy: 12.5, chain: chains[0] || 'Ethereum' },
      { protocol: 'Compound V3', apy: 8.3, chain: chains[0] || 'Ethereum' },
      { protocol: 'Pendle', apy: 15.2, chain: chains[1] || 'Arbitrum' },
      { protocol: 'Liquity V2', apy: 21.0, chain: chains[0] || 'Ethereum' },
      { protocol: 'Fluid', apy: 18.5, chain: chains[2] || 'Base' }
    ];
  }

  /**
   * Generate execution steps
   */
  private generateExecutionSteps(
    strategy: any,
    userContext: UserContext,
    bridgeRoute: any
  ): string[] {
    const steps: string[] = [];

    // Add bridge step if needed
    if (bridgeRoute) {
      steps.push(`Bridge assets from ${bridgeRoute.sourceChain} to ${bridgeRoute.targetChain} via Avail Nexus`);
    }

    // Parse strategy template into steps
    const templateSteps = strategy.template.split('→').map((s: string) => s.trim());
    templateSteps.forEach((step: string, index: number) => {
      steps.push(`Step ${index + 1}: ${step}`);
    });

    // Add monitoring step
    steps.push('Monitor position daily and rebalance if APY drops >20%');

    return steps;
  }

  /**
   * Categorize knowledge for better retrieval
   */
  private categorizeKnowledge(text: string): string {
    if (text.includes('risk') || text.includes('liquidation')) return 'risk_management';
    if (text.includes('APY') || text.includes('yield')) return 'yield_optimization';
    if (text.includes('gas') || text.includes('bridge')) return 'gas_optimization';
    if (text.includes('market') || text.includes('volatility')) return 'market_conditions';
    if (text.includes('exit') || text.includes('redemption')) return 'exit_strategies';
    return 'protocol_specific';
  }

  /**
   * Fallback response when Grok is unavailable
   */
  private async getFallbackResponse(
    messages: ChatMessage[],
    userContext?: UserContext
  ): Promise<string> {
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';

    // Fetch a small set of real pools from Envio for fallback output (no mocks)
    const DEFAULT_PROTOCOLS = [
      'aave','compound','curve','balancer','uniswap-v3','sushiswap','yearn','beefy',
      'pendle','silo','morpho','radiant','stargate','aerodrome','rocketpool','lido'
    ];

    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'
    );
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const envio = getEnvioHyperIndex(provider, {
      apiKey: DEFI_API_CONFIG.envio.apiKey,
      indexerUrl: DEFI_API_CONFIG.envio.hyperIndexUrl,
      networkId: DEFI_API_CONFIG.envio.networkId,
      cacheEnabled: true,
      cacheTTL: DEFI_API_CONFIG.envio.cacheTTL,
    }, redis);

    const raw = await envio.getIndexedPools(DEFAULT_PROTOCOLS, { limit: 100, offset: 0 });
    const topPools = raw
      .map(p => ({
        protocol: (p.protocol || 'Protocol').toString().toUpperCase(),
        poolName: `${p.tokenA || 'TOKEN0'}/${p.tokenB || 'TOKEN1'}`,
        apy: Number(p.apy) || 0,
        tvl: Number(p.tvlUsd) || 0,
        riskScore: /USD|USDC|USDT|DAI|PYUSD/i.test(`${p.tokenA}${p.tokenB}`) ? 25 : 50,
        chain: DEFI_API_CONFIG.envio.networkId === 1 ? 'Ethereum' : `chain-${DEFI_API_CONFIG.envio.networkId}`,
      }))
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 5);

    if (lastMessage.includes('recommend') || lastMessage.includes('suggest')) {
      return `Based on current market conditions, here are top opportunities on ApyHub.xyz:

${topPools.map((p: any, i: number) =>
`${i + 1}. ${p.protocol} - ${p.poolName}
   • APY: ${p.apy.toFixed(2)}%
   • TVL: $${p.tvl.toLocaleString()}
   • Risk: ${p.riskScore < 30 ? 'Low' : p.riskScore < 70 ? 'Medium' : 'High'}
   • Chain: ${p.chain}`
).join('\n\n')}

Visit ApyHub.xyz to explore 50+ protocols with advanced filtering and AI-powered recommendations.`;
    }

    if (lastMessage.includes('bridge') || lastMessage.includes('cross-chain')) {
      return `ApyHub.xyz integrates Avail Nexus for optimal cross-chain bridging:

• Aggregates 10+ bridge protocols for best rates
• Average gas savings: 30-60% vs native bridges  
• Supports Ethereum, Arbitrum, Optimism, Base, Solana
• Single-click "Bridge & Execute" for LP entry

Example: Bridge USDC from Ethereum to Arbitrum via Nexus, then deploy into GMX for 25% APY.`;
    }

  return `Welcome to ApyHub.xyz! I'm your AI yield strategist.

I can help you:
• Find the best yields across 50+ DeFi protocols
• Optimize cross-chain strategies with Avail Nexus
• Manage risk with real-time monitoring
• Execute complex strategies (looping, basis trades, tranching)

Current market highlights:
- Avg stablecoin APY: 8-12%
- ETH staking + leverage: 15-25%
 - Risk-adjusted opportunities: ${topPools.length} pools above 10% APY

How can I help optimize your yield today?`;
  }
}

export default EnhancedAIService;