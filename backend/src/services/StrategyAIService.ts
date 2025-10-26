// backend/src/services/StrategyAIService.ts
import OpenAI from 'openai';
import RAGService from './RAGService';
import { ethers } from 'ethers';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserPortfolio {
  totalValue: number;
  positions: Array<{
    asset: string;
    protocol: string;
    amount: number;
    apy: number;
  }>;
  chains: string[];
}

interface StrategyResponse {
  strategy: string;
  reasoning: string;
  expectedAPY: string;
  riskLevel: string;
  protocols: string[];
  steps: string[];
  warnings: string[];
  alternatives: string[];
}

/**
 * AI Service with RAG capability for DeFi strategies
 * Uses training files from train-ai directory
 */
export class StrategyAIService {
  private openai: OpenAI | null = null;
  private ragService: RAGService;
  private isInitialized: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ Strategy AI Service: OpenAI initialized');
    } else {
      console.warn('⚠️ Strategy AI Service: OpenAI not configured, using fallback');
    }

    this.ragService = new RAGService();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Strategy AI Service...');
    await this.ragService.initialize();
    this.isInitialized = true;
    console.log('✅ Strategy AI Service ready');
  }

  /**
   * Get advanced strategies using RAG
   */
  async getAdvancedStrategy(
    query: string,
    portfolio?: UserPortfolio,
    riskTolerance: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<StrategyResponse> {
    await this.initialize();

    try {
      // Get relevant knowledge from RAG
      const ragContext = await this.ragService.getChatContext(query, 8);
      
      // Build complete context
      const userContext = this.buildUserContext(portfolio, riskTolerance);
      
      // Get recommendation from RAG
      const recommendation = await this.ragService.getStrategyRecommendation(query, {
        asset: this.detectAsset(query),
        riskTolerance,
        capital: portfolio?.totalValue || 5000
      });

      // If OpenAI available, enhance strategy with GPT
      if (this.openai) {
        return await this.enhanceWithGPT(
          query,
          ragContext,
          userContext,
          recommendation
        );
      }

      // Fallback: use RAG only
      return this.buildStrategyFromRAG(recommendation);
      
    } catch (error) {
      console.error('Error generating strategy:', error);
      return this.getFallbackStrategy(query, riskTolerance);
    }
  }

  /**
   * Smart chat with RAG context
   */
  async chat(
    messages: ChatMessage[],
    portfolio?: UserPortfolio
  ): Promise<string> {
    await this.initialize();

    const lastMessage = messages[messages.length - 1]?.content || '';

    // Get context from RAG
    const ragContext = await this.ragService.getChatContext(lastMessage, 5);

    if (!this.openai) {
      return this.getFallbackChat(lastMessage, ragContext);
    }

    try {
      const systemPrompt = this.buildChatSystemPrompt(portfolio, ragContext);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0]?.message?.content ||
        'I apologize, but I could not generate a response. Please try again.';

    } catch (error) {
      console.error('Chat error:', error);
      return this.getFallbackChat(lastMessage, ragContext);
    }
  }

  /**
   * Enhance strategy with GPT
   */
  private async enhanceWithGPT(
    query: string,
    ragContext: string,
    userContext: string,
    ragRecommendation: any
  ): Promise<StrategyResponse> {
    const prompt = `Based on the following expert DeFi knowledge and user context, provide a detailed yield strategy:

USER QUERY: ${query}

${ragContext}

${userContext}

RAG RECOMMENDATIONS:
${JSON.stringify(ragRecommendation, null, 2)}

Provide a comprehensive strategy with:
1. Main strategy name and description
2. Step-by-step execution plan
3. Expected APY with calculation breakdown
4. Risk factors and mitigation strategies
5. Alternative strategies
6. Exit strategy

Format as JSON with: strategy, reasoning, expectedAPY, riskLevel, protocols, steps, warnings, alternatives`;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert DeFi strategist. Provide detailed, actionable strategies.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response or use fallback
    try {
      return JSON.parse(response);
    } catch {
      return this.parseTextResponse(response);
    }
  }

  /**
   * Build strategy from RAG
   */
  private buildStrategyFromRAG(recommendation: any): StrategyResponse {
    return {
      strategy: recommendation.strategies[0] || 'Multi-Protocol Yield Strategy',
      reasoning: recommendation.reasoning,
      expectedAPY: '12-20%',
      riskLevel: 'Medium',
      protocols: ['Aave', 'Pendle', 'Morpho'],
      steps: [
        'Supply collateral to main protocol',
        'Borrow with safe LTV (under 70%)',
        'Deploy borrowed capital to high-yield strategy',
        'Monitor position daily',
        'Gradual exit to reduce slippage'
      ],
      warnings: [
        'Always keep LTV below 75%',
        'Check liquidation risk during high volatility',
        'Diversify across 3-5 protocols',
        'Have emergency exit plan'
      ],
      alternatives: recommendation.strategies.slice(1, 3)
    };
  }

  /**
   * Detect asset from query
   */
  private detectAsset(query: string): string | undefined {
    const queryLower = query.toLowerCase();
    
    const assetMap: Record<string, string> = {
      'eth': 'ETH',
      'ethereum': 'ETH',
      'btc': 'BTC',
      'bitcoin': 'BTC',
      'usdc': 'USDC',
      'usdt': 'USDT',
      'dai': 'DAI',
      'stable': 'Stables',
      'stablecoin': 'Stables'
    };

    for (const [key, value] of Object.entries(assetMap)) {
      if (queryLower.includes(key)) {
        return value;
      }
    }

    return undefined;
  }

  /**
   * Build user context
   */
  private buildUserContext(
    portfolio?: UserPortfolio,
    riskTolerance: string = 'medium'
  ): string {
    if (!portfolio) {
      return `Risk Tolerance: ${riskTolerance}\nNo current positions.`;
    }

    return `User Portfolio:
- Total Value: $${portfolio.totalValue.toLocaleString()}
- Positions: ${portfolio.positions.length}
- Active Chains: ${portfolio.chains.join(', ')}
- Risk Tolerance: ${riskTolerance}
- Current Holdings: ${portfolio.positions.map(p => `${p.amount} ${p.asset} in ${p.protocol} (${p.apy}% APY)`).join(', ')}`;
  }

  /**
   * Build system prompt for chat
   */
  private buildChatSystemPrompt(
    portfolio: UserPortfolio | undefined,
    ragContext: string
  ): string {
    return `You are an expert DeFi yield strategist for ApyHub.xyz.

You have access to expert knowledge from top DeFi strategists including:
- ETH Super-Basis strategies (~21% APY)
- BTC basis arbitrage using f(x) + Hyperliquid
- Stability pools for black swan protection
- Pendle PT fixed-rate strategies
- Leveraged looping techniques
- NAV checking and redemption tactics

${ragContext}

${portfolio ? this.buildUserContext(portfolio) : 'No user portfolio data.'}

Provide clear, actionable advice in English.
Always mention specific protocols, APY ranges, and risk factors.
Focus on sustainable strategies over temporary incentives.`;
  }

  /**
   * Parse text response to structured format
   */
  private parseTextResponse(text: string): StrategyResponse {
    const lines = text.split('\n');
    
    return {
      strategy: this.extractValue(text, 'strategy') || 'Custom DeFi Strategy',
      reasoning: this.extractValue(text, 'reasoning') || text.substring(0, 300),
      expectedAPY: this.extractValue(text, 'apy') || '10-15%',
      riskLevel: this.extractValue(text, 'risk') || 'Medium',
      protocols: this.extractProtocols(text),
      steps: this.extractSteps(text),
      warnings: this.extractWarnings(text),
      alternatives: this.extractAlternatives(text)
    };
  }

  /**
   * Extract value from text
   */
  private extractValue(text: string, key: string): string | null {
    const patterns: Record<string, RegExp> = {
      strategy: /(?:strategy)[:\s]+([^\n.]+)/i,
      reasoning: /(?:reasoning)[:\s]+([^\n]+(?:\n[^\n]+){0,2})/i,
      apy: /(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)%\s*(?:APY|APR)/i,
      risk: /(?:risk)[:\s]+(low|medium|high)/i
    };

    const pattern = patterns[key];
    if (!pattern) return null;

    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract protocols
   */
  private extractProtocols(text: string): string[] {
    const protocols = new Set<string>();
    const commonProtocols = [
      'Aave', 'Compound', 'Morpho', 'Euler', 'Pendle', 'Liquity',
      'Maple', 'Drift', 'Infinifi', 'Resolv', 'Reservoir', 'Fluid',
      'Gearbox', 'Yearn', 'Curve', 'Balancer', 'Uniswap', 'SushiSwap'
    ];

    commonProtocols.forEach(protocol => {
      if (new RegExp(protocol, 'i').test(text)) {
        protocols.add(protocol);
      }
    });

    return Array.from(protocols).slice(0, 5);
  }

  /**
   * Extract steps
   */
  private extractSteps(text: string): string[] {
    const steps: string[] = [];
    const stepPatterns = [
      /(?:step)\s*\d+[:\s]+([^.\n]+)/gi,
      /(?:►|➢|-)\s*([^.\n]+)/g
    ];

    stepPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const step = match[1].trim();
        if (step.length > 10 && step.length < 200) {
          steps.push(step);
        }
      }
    });

    return steps.length > 0 ? steps.slice(0, 8) : [
      'Supply initial assets',
      'Select appropriate protocol',
      'Execute strategy',
      'Monitor continuously',
      'Exit gradually'
    ];
  }

  /**
   * Extract warnings
   */
  private extractWarnings(text: string): string[] {
    const warnings: string[] = [];
    const warningPatterns = [
      /(?:risk|warning|caution)[:\s]+([^.\n]+)/gi,
      /(?:avoid|don't|never)[:\s]+([^.\n]+)/gi
    ];

    warningPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const warning = match[1].trim();
        if (warning.length > 15 && warning.length < 150) {
          warnings.push(warning);
        }
      }
    });

    return warnings.length > 0 ? warnings.slice(0, 5) : [
      'Manage LTV to avoid liquidation',
      'Diversify across multiple protocols',
      'Have exit strategy ready',
      'Check protocol security'
    ];
  }

  /**
   * Extract alternatives
   */
  private extractAlternatives(text: string): string[] {
    const alternatives: string[] = [];
    const altPattern = /(?:alternative|or)[:\s]+([^.\n]+)/gi;
    
    const matches = text.matchAll(altPattern);
    for (const match of matches) {
      const alt = match[1].trim();
      if (alt.length > 10 && alt.length < 100) {
        alternatives.push(alt);
      }
    }

    return alternatives.slice(0, 3);
  }

  /**
   * Fallback strategy
   */
  private getFallbackStrategy(
    query: string,
    riskTolerance: string
  ): StrategyResponse {
    const asset = this.detectAsset(query) || 'USDC';
    
    const strategies: Record<string, StrategyResponse> = {
      low: {
        strategy: 'Pendle Fixed-Rate Strategy',
        reasoning: 'Use Pendle PT to lock fixed rates without leverage. Suitable for conservative investors.',
        expectedAPY: '10-15%',
        riskLevel: 'Low',
        protocols: ['Pendle', 'Infinifi'],
        steps: [
          'Buy PT token from Pendle',
          'Hold until maturity',
          'Receive fixed yield',
          '1:1 exit to USDC'
        ],
        warnings: [
          'Avoid PTs near expiry',
          'Check exit liquidity'
        ],
        alternatives: ['Gauntlet Lend Aggregator', 'SummerFi USDC']
      },
      medium: {
        strategy: 'ETH Super-Basis (Liquity + Maple + Drift)',
        reasoning: 'Delta-neutral strategy using yield-bearing collateral + yield-bearing margin. ~21% yield with medium risk.',
        expectedAPY: '18-24%',
        riskLevel: 'Medium',
        protocols: ['Liquity', 'Maple', 'Drift'],
        steps: [
          'Supply wstETH on Liquity',
          'Borrow BOLD at fixed rate ~3.5%',
          'Convert to syrupUSDC',
          'Bridge to Solana',
          'Open 2x short on Drift'
        ],
        warnings: [
          'Rebalance if ETH pumps >30%',
          'Use delegate for loan management',
          'Monitor funding rate'
        ],
        alternatives: ['Reservoir Tranching', 'weETH Non-Leveraged Loop']
      },
      high: {
        strategy: 'Leveraged PT Loops (Morpho)',
        reasoning: 'Use PT as collateral with high LLTV (91-96.5%) for leverage. 40%+ yield with high risk.',
        expectedAPY: '35-50%',
        riskLevel: 'High',
        protocols: ['Pendle', 'Morpho', 'Contango'],
        steps: [
          'Buy PT (fixed rate)',
          'Use PT as collateral on Morpho',
          'Borrow USDC',
          'Repeat loop until LTV ~90%',
          'Use cheat loop to reduce fees'
        ],
        warnings: [
          'Oracle risk (Pendle AMM)',
          'Keep LTV below 90%',
          'Avoid entering near expiry',
          'Check exit liquidity'
        ],
        alternatives: ['BOLD Gold Loop', 'BTC Basis Arb']
      }
    };

    return strategies[riskTolerance] || strategies.medium;
  }

  /**
   * Fallback chat response
   */
  private getFallbackChat(query: string, ragContext: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('strategy')) {
      return `Based on available knowledge in the system:

${ragContext.substring(0, 500)}

For more precise strategies, use the /api/ai/strategy endpoint.

ApyHub.xyz analyzes 50+ protocols to find the best yield opportunities.`;
    }

    if (queryLower.includes('risk')) {
      return `Risk Management in DeFi:

📊 Risk Levels:
• Low: Pendle PT, Lend Aggregators, Stability Pools
• Medium: Basis Trades, Senior Tranches
• High: Leveraged Loops, Junior Tranches

🛡️ Key Points:
- Keep LTV below 75%
- Diversify across 3-5 protocols
- Always have exit strategy
- Check NAV before exit

${ragContext.substring(0, 300)}`;
    }

    return `Hello! I'm your ApyHub.xyz AI assistant 🤖

I can help you with:
• Finding best yields across 50+ protocols
• Advanced strategies (looping, basis trades, PT/YT)
• Risk management and portfolio optimization
• Bridge cost optimization with Avail Nexus

Some available strategies:
${ragContext.substring(0, 400)}

How can I help optimize your yield today?`;
  }

  /**
   * Get RAG service stats
   */
  async getStats(): Promise<any> {
    await this.initialize();
    return this.ragService.getStats();
  }

  /**
   * Search strategies by criteria
   */
  async searchStrategies(criteria: {
    asset?: string;
    minAPY?: number;
    maxRisk?: string;
    protocols?: string[];
  }): Promise<Array<{
    strategy: string;
    description: string;
    source: string;
  }>> {
    await this.initialize();

    const docs = await this.ragService.searchStrategies(criteria);
    
    return docs.map(doc => ({
      strategy: doc.metadata.strategy || 'DeFi Strategy',
      description: doc.content.substring(0, 250),
      source: doc.metadata.source
    }));
  }

  /**
   * Get all available strategies
   */
  async getAllStrategies(): Promise<any[]> {
    await this.initialize();
    return await this.ragService.getAllStrategies();
  }
}

export default StrategyAIService;