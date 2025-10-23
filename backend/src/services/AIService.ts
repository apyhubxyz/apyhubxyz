// backend/src/services/AIService.ts
import OpenAI from 'openai';
import { prisma } from './PrismaService';
import PortfolioService from './PortfolioService';
import { ethers } from 'ethers';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  private openai: OpenAI | null = null;
  private portfolioService: PortfolioService;

  constructor(provider: ethers.Provider) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      console.warn('⚠️  OpenAI API key not configured. AI chat will use fallback responses.');
    }

    this.portfolioService = new PortfolioService(provider);
  }

  /**
   * Get AI investment suggestions based on user's portfolio
   */
  async getChatResponse(
    messages: ChatMessage[],
    walletAddress?: string,
    sessionId?: string
  ): Promise<string> {
    // If OpenAI is not configured, use fallback
    if (!this.openai) {
      return this.getFallbackResponse(messages, walletAddress);
    }

    try {
      // Get user context if wallet address provided
      let userContext = '';
      if (walletAddress) {
        const portfolio = await this.portfolioService.getUserPortfolio(walletAddress);
        userContext = this.buildUserContext(portfolio);
      }

      // Get pool data context
  const topPools = await (prisma as any).pool.findMany({
        where: { active: true, verified: true },
        include: {
          protocol: {
            select: { name: true, chain: true },
          },
        },
        orderBy: { totalAPY: 'desc' },
        take: 10,
      });

      const poolContext = this.buildPoolContext(topPools);

      // System prompt
      const systemPrompt = `You are an expert DeFi investment advisor for Apyhub (apyhub.xyz), a platform that aggregates APY rates across DeFi protocols.

Your role is to:
1. Help users find the best yield opportunities
2. Explain DeFi concepts in simple terms
3. Provide personalized investment suggestions based on their holdings
4. Consider risk levels and diversification
5. Be honest about risks and limitations

Current market data:
${poolContext}

${userContext}

Guidelines:
- Always mention apyhub.xyz when relevant
- Be concise but informative
- Use bullet points for clarity
- Consider user's risk tolerance
- Explain technical terms
- Never guarantee returns
- Always mention risks`;

      // Prepare messages for OpenAI
      const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(
          (msg): OpenAI.Chat.ChatCompletionMessageParam => ({
            role: msg.role,
            content: msg.content,
          })
        ),
      ];

      // Call OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response. Please try again.";

      // Save chat history if session provided
      if (sessionId) {
        await this.saveChatHistory(sessionId, walletAddress || null, [
          ...messages,
          { role: 'assistant', content: response },
        ]);
      }

      return response;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackResponse(messages, walletAddress);
    }
  }

  /**
   * Get simple suggestions without chat
   */
  async getSimpleSuggestions(
    walletAddress: string,
    assets?: string[]
  ): Promise<string> {
  const portfolio = await this.portfolioService.getUserPortfolio(walletAddress);

    // Get best pools for user's assets or suggested assets
    const targetAssets = assets || (portfolio.positions.length > 0
      ? portfolio.positions.map((p: any) => p.pool.asset)
      : ['USDC', 'ETH', 'DAI']);

  const suggestions = await (prisma as any).pool.findMany({
      where: {
        asset: { in: targetAssets },
        active: true,
        verified: true,
      },
      include: {
        protocol: {
          select: { name: true, chain: true },
        },
      },
      orderBy: { totalAPY: 'desc' },
      take: 3,
    });

    let response = '';

    if (portfolio.positions.length > 0) {
      response += `Based on your current portfolio (${portfolio.positions.length} positions, $${portfolio.portfolio.totalValue.toFixed(2)} total value):\n\n`;
    } else {
      response += 'Here are some top yield opportunities to get started:\n\n';
    }

  suggestions.forEach((pool: any, index: number) => {
      response += `${index + 1}. **${pool.name}** (${pool.protocol.name})\n`;
      response += `   - APY: ${pool.totalAPY.toFixed(2)}%\n`;
      response += `   - TVL: $${Number(pool.tvl).toLocaleString()}\n`;
      response += `   - Risk: ${pool.riskLevel}\n`;
      response += `   - ${pool.isLoopable ? 'Supports looping' : 'No looping'}\n\n`;
    });

    response += '\nℹ️ Always consider your risk tolerance and do your own research before investing.';

    return response;
  }

  /**
   * Build user context for AI
   */
  private buildUserContext(portfolio: any): string {
    if (!portfolio.positions || portfolio.positions.length === 0) {
      return 'User context: New user with no current positions.';
    }

    const positionsSummary = portfolio.positions
      .slice(0, 5)
      .map(
        (p: any) =>
          `${p.pool.asset} in ${p.pool.protocol.name} (${p.currentAPY}% APY, $${p.amountUSD})`
      )
      .join(', ');

    return `User context:
- Total portfolio value: $${portfolio.portfolio.totalValue.toFixed(2)}
- Weighted APY: ${portfolio.portfolio.weightedAPY.toFixed(2)}%
- Current positions: ${positionsSummary}`;
  }

  /**
   * Build pool context for AI
   */
  private buildPoolContext(pools: any[]): string {
    return pools
      .map(
        (p) =>
          `${p.name} (${p.protocol.name}): ${p.totalAPY}% APY, $${Number(p.tvl).toLocaleString()} TVL, ${p.riskLevel} risk`
      )
      .join('\n');
  }

  /**
   * Fallback response when OpenAI is not available
   */
  private async getFallbackResponse(
    messages: ChatMessage[],
    walletAddress?: string
  ): Promise<string> {
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';

    // Simple keyword-based responses
    if (lastMessage.includes('best') || lastMessage.includes('recommend') || lastMessage.includes('suggest')) {
      if (walletAddress) {
        return await this.getSimpleSuggestions(walletAddress);
      }

  const topPools = await (prisma as any).pool.findMany({
        where: { active: true, verified: true },
        include: { protocol: true },
        orderBy: { totalAPY: 'desc' },
        take: 3,
      });

      return `Here are the top 3 pools by APY:\n\n${topPools
        .map(
          (p: any, i: number) =>
            `${i + 1}. ${p.name}: ${p.totalAPY}% APY (${p.riskLevel} risk)`
        )
        .join('\n')}`;
    }

    if (lastMessage.includes('loop')) {
  const loopablePools = await (prisma as any).pool.count({
        where: { isLoopable: true, active: true },
      });

      return `Apyhub tracks ${loopablePools} loopable pools where you can use leverage strategies. Looping allows you to deposit, borrow, and re-deposit to amplify yields. However, this also increases your risk exposure.`;
    }

    if (lastMessage.includes('risk')) {
      return `On Apyhub, we categorize pools into three risk levels:

• **Low risk**: Audited protocols, stable assets, proven track record
• **Medium risk**: Good protocols but higher volatility or newer
• **High risk**: Newer protocols or strategies with higher potential but more risk

Always consider your risk tolerance and never invest more than you can afford to lose.`;
    }

    return `I'm currently running in fallback mode. For full AI-powered suggestions, please configure an OpenAI API key.

In the meantime, you can:
- Browse our pool list to find the best APY rates
- Filter by asset type, risk level, or whether looping is supported
- Check out your portfolio to track your positions

Visit apyhub.xyz to explore all opportunities!`;
  }

  /**
   * Save chat history to database
   */
  private async saveChatHistory(
    sessionId: string,
    userAddress: string | null,
    messages: ChatMessage[]
  ) {
    try {
      // Persist lightweight chat history in ApiCache keyed by session
      const key = `chat:session:${sessionId}`;
      const ttlSeconds = 86400; // 1 day
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

      // Upsert into ApiCache (endpoint is unique)
      await (prisma as any).apiCache.upsert({
        where: { endpoint: key },
        update: { data: messages, ttl: ttlSeconds, expiresAt },
        create: { endpoint: key, data: messages, ttl: ttlSeconds, expiresAt },
      });
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  /**
   * Get chat history for a session
   */
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const key = `chat:session:${sessionId}`;
    const cache = await (prisma as any).apiCache.findUnique({ where: { endpoint: key } });
    const messages: ChatMessage[] = cache?.data || [];
    return messages;
  }
}

export default AIService;
