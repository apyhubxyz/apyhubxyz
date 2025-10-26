// backend/src/services/RAGService.ts
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

/**
 * Document structure for RAG
 */
interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    strategy?: string;
    asset?: string;
    risk?: string;
    protocols?: string[];
    apy?: string;
    tags?: string[];
    citations?: string[];
    documentId?: string;
    type?: string;
    [key: string]: any; // Allow additional metadata
  };
  embedding?: number[];
}

/**
 * Training data structure from JSONL files
 */
interface TrainingExample {
  prompt: string;
  response: string;
  tags?: string[];
  citations?: string[];
}

/**
 * RAG Service for DeFi Strategy Knowledge
 * Uses OpenAI embeddings for semantic search
 */
export class RAGService {
  private openai: OpenAI | null = null;
  private documents: RAGDocument[] = [];
  private isInitialized: boolean = false;
  private trainingDataPath: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ RAG Service: OpenAI initialized');
    } else {
      console.warn('⚠️ RAG Service: OpenAI API key not configured');
    }

    // Path to training data (private backend directory)
    this.trainingDataPath = path.join(__dirname, '../..', 'data', 'training');
  }

  /**
   * Initialize RAG system with training data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('ℹ️ RAG Service already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing RAG Service...');

      // Load training documents
      await this.loadTrainingDocuments();

      // Generate embeddings if OpenAI available
      if (this.openai && this.documents.length > 0) {
        await this.generateEmbeddings();
      }

      this.isInitialized = true;
      console.log(`✅ RAG Service initialized with ${this.documents.length} documents`);
    } catch (error) {
      console.error('❌ Failed to initialize RAG Service:', error);
      this.isInitialized = true; // Continue without RAG
    }
  }

  /**
   * Load training documents from train-ai folder
   */
  private async loadTrainingDocuments(): Promise<void> {
    const documents: RAGDocument[] = [];

    try {
      // 1. Load markdown corpus
      const corpusPath = path.join(this.trainingDataPath, 'defi_rag_corpus.md');
      if (fs.existsSync(corpusPath)) {
        const corpusContent = fs.readFileSync(corpusPath, 'utf-8');
        const chunks = this.splitMarkdownIntoChunks(corpusContent);
        
        chunks.forEach((chunk, idx) => {
          documents.push({
            id: `corpus-${idx}`,
            content: chunk.content,
            metadata: {
              source: 'defi_rag_corpus',
              strategy: chunk.strategy,
              ...chunk.metadata
            }
          });
        });
        
        console.log(`📄 Loaded ${chunks.length} chunks from corpus`);
      }

      // 2. Load Q&A pairs
      const qaPairsPath = path.join(this.trainingDataPath, 'defi_qa_pairs.jsonl');
      if (fs.existsSync(qaPairsPath)) {
        const qaLines = fs.readFileSync(qaPairsPath, 'utf-8').split('\n').filter(l => l.trim());
        
        qaLines.forEach((line, idx) => {
          try {
            const qa = JSON.parse(line);
            documents.push({
              id: `qa-${idx}`,
              content: `Q: ${qa.prompt}\nA: ${qa.response}`,
              metadata: {
                source: 'qa_pairs',
                tags: qa.tags || []
              }
            });
          } catch (e) {
            // Skip invalid JSON
          }
        });
        
        console.log(`💬 Loaded ${qaLines.length} Q&A pairs`);
      }

      // 3. Load training examples
      const trainingPath = path.join(this.trainingDataPath, 'training_qa.jsonl');
      if (fs.existsSync(trainingPath)) {
        const trainingLines = fs.readFileSync(trainingPath, 'utf-8').split('\n').filter(l => l.trim());
        
        trainingLines.forEach((line, idx) => {
          try {
            const example: TrainingExample = JSON.parse(line);
            documents.push({
              id: `training-${idx}`,
              content: `${example.prompt}\n\n${example.response}`,
              metadata: {
                source: 'training_examples',
                tags: example.tags || [],
                citations: example.citations || []
              }
            });
          } catch (e) {
            // Skip invalid JSON
          }
        });
        
        console.log(`📚 Loaded ${trainingLines.length} training examples`);
      }

      // 4. Load RAG documents
      const ragDocsPath = path.join(this.trainingDataPath, 'rag_documents.jsonl');
      if (fs.existsSync(ragDocsPath)) {
        const ragLines = fs.readFileSync(ragDocsPath, 'utf-8').split('\n').filter(l => l.trim());
        
        ragLines.forEach((line, idx) => {
          try {
            const doc = JSON.parse(line);
            // Split large PDF documents into smaller chunks
            const chunks = this.splitTextIntoChunks(doc.text, 500);
            chunks.forEach((chunk, chunkIdx) => {
              documents.push({
                id: `${doc.id}-chunk-${chunkIdx}`,
                content: chunk,
                metadata: {
                  source: doc.source || 'rag_documents',
                  documentId: doc.id
                }
              });
            });
          } catch (e) {
            // Skip invalid JSON
          }
        });
        
        console.log(`📖 Loaded ${ragLines.length} RAG documents`);
      }

      this.documents = documents;
      console.log(`✅ Total documents loaded: ${documents.length}`);

    } catch (error) {
      console.error('Error loading training documents:', error);
      throw error;
    }
  }

  /**
   * Split markdown content into structured chunks
   */
  private splitMarkdownIntoChunks(markdown: string): Array<{
    content: string;
    strategy?: string;
    metadata: any;
  }> {
    const chunks: Array<{ content: string; strategy?: string; metadata: any }> = [];
    
    // Split by ## headers (chunks)
    const sections = markdown.split(/^## /m).filter(s => s.trim());
    
    sections.forEach(section => {
      const lines = section.split('\n');
      const header = lines[0];
      const content = lines.slice(1).join('\n').trim();
      
      if (!content) return;
      
      // Extract strategy name and metadata from header
      const strategyMatch = header.match(/Chunk \d+ — (.+?)(?:\(|$)/);
      const strategy = strategyMatch ? strategyMatch[1].trim() : undefined;
      
      // Extract metadata
      const metadata: any = { type: 'strategy_chunk' };
      
      if (content.includes('Risk')) {
        const riskMatch = content.match(/Risk[s]?: ([^;]+)/);
        if (riskMatch) metadata.risk = riskMatch[1].trim();
      }
      
      if (content.includes('APR')) {
        const apyMatch = content.match(/(\d+\.?\d*)% APR/);
        if (apyMatch) metadata.apy = apyMatch[1];
      }

      chunks.push({
        content: `${header}\n${content}`,
        strategy,
        metadata
      });
    });
    
    return chunks;
  }

  /**
   * Split text into chunks of specified size
   */
  private splitTextIntoChunks(text: string, chunkSize: number = 500): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }

  /**
   * Generate OpenAI embeddings for all documents
   */
  private async generateEmbeddings(): Promise<void> {
    if (!this.openai) return;

    console.log('🔄 Generating embeddings for documents...');
    
    try {
      // Process in batches to avoid rate limits
      const batchSize = 50;
      let processed = 0;

      for (let i = 0; i < this.documents.length; i += batchSize) {
        const batch = this.documents.slice(i, i + batchSize);
        
        const embeddings = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch.map(doc => doc.content.substring(0, 8000)) // Limit to 8K tokens
        });

        // Assign embeddings to documents
        batch.forEach((doc, idx) => {
          doc.embedding = embeddings.data[idx].embedding;
        });

        processed += batch.length;
        console.log(`   Progress: ${processed}/${this.documents.length} documents embedded`);
        
        // Small delay to avoid rate limits
        if (i + batchSize < this.documents.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('✅ Embeddings generated successfully');
    } catch (error) {
      console.error('Error generating embeddings:', error);
      // Continue without embeddings (fallback to keyword search)
    }
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(query: string, topK: number = 5): Promise<RAGDocument[]> {
    await this.initialize();

    if (!this.openai || this.documents.length === 0) {
      console.warn('⚠️ RAG not available, using keyword search');
      return this.keywordSearch(query, topK);
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query
      });

      const queryVector = queryEmbedding.data[0].embedding;

      // Calculate cosine similarity with all documents
      const scored = this.documents
        .filter(doc => doc.embedding)
        .map(doc => ({
          doc,
          score: this.cosineSimilarity(queryVector, doc.embedding!)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return scored.map(s => s.doc);
    } catch (error) {
      console.error('Semantic search error:', error);
      return this.keywordSearch(query, topK);
    }
  }

  /**
   * Fallback keyword-based search
   */
  private keywordSearch(query: string, topK: number = 5): RAGDocument[] {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/);
    
    const scored = this.documents.map(doc => {
      const contentLower = doc.content.toLowerCase();
      let score = 0;
      
      keywords.forEach(keyword => {
        const occurrences = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
        score += occurrences;
      });
      
      return { doc, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.doc);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get enhanced strategy recommendations using RAG
   */
  async getStrategyRecommendation(
    query: string,
    userContext: {
      asset?: string;
      riskTolerance?: 'low' | 'medium' | 'high';
      capital?: number;
    }
  ): Promise<{
    strategies: string[];
    reasoning: string;
    relevantKnowledge: string[];
  }> {
    await this.initialize();

    // Enhance query with user context
    const enhancedQuery = this.buildEnhancedQuery(query, userContext);

    // Retrieve relevant documents
    const relevantDocs = await this.semanticSearch(enhancedQuery, 10);

    // Extract strategies and knowledge
    const strategies = this.extractStrategies(relevantDocs, userContext);
    const knowledge = relevantDocs.map(doc => doc.content.substring(0, 200));

    // Build reasoning
    const reasoning = this.buildReasoning(relevantDocs, userContext);

    return {
      strategies,
      reasoning,
      relevantKnowledge: knowledge
    };
  }

  /**
   * Build enhanced query with context
   */
  private buildEnhancedQuery(query: string, userContext: any): string {
    let enhanced = query;

    if (userContext.asset) {
      enhanced += ` ${userContext.asset}`;
    }

    if (userContext.riskTolerance) {
      enhanced += ` ${userContext.riskTolerance} risk`;
    }

    if (userContext.capital) {
      if (userContext.capital < 10000) {
        enhanced += ' small capital';
      } else if (userContext.capital > 100000) {
        enhanced += ' large capital whale';
      }
    }

    return enhanced;
  }

  /**
   * Extract strategies from relevant documents
   */
  private extractStrategies(docs: RAGDocument[], userContext: any): string[] {
    const strategies: string[] = [];
    
    docs.forEach(doc => {
      // Extract strategy information
      if (doc.metadata.strategy) {
        strategies.push(doc.metadata.strategy);
      }
      
      // Parse strategies from content
      const strategyMatches = doc.content.match(/Strategy[:]?\s*([^.\n]+)/gi);
      if (strategyMatches) {
        strategyMatches.forEach(match => {
          const strategy = match.replace(/Strategy[:]?\s*/i, '').trim();
          if (strategy && !strategies.includes(strategy)) {
            strategies.push(strategy);
          }
        });
      }
    });

    // Filter by risk tolerance
    if (userContext.riskTolerance === 'low') {
      return strategies.filter(s => 
        !s.toLowerCase().includes('leverage') &&
        !s.toLowerCase().includes('loop') &&
        !s.toLowerCase().includes('degen')
      );
    }

    return strategies.slice(0, 5);
  }

  /**
   * Build reasoning from documents
   */
  private buildReasoning(docs: RAGDocument[], userContext: any): string {
    const insights: string[] = [];

    docs.forEach(doc => {
      // Extract key insights
      const sentences = doc.content.split(/[.!?]\s+/);
      sentences.forEach(sentence => {
        if (
          sentence.includes('APR') ||
          sentence.includes('APY') ||
          sentence.includes('risk') ||
          sentence.includes('yield')
        ) {
          if (sentence.length < 150 && sentence.length > 20) {
            insights.push(sentence.trim());
          }
        }
      });
    });

    // Deduplicate and limit
    const uniqueInsights = [...new Set(insights)].slice(0, 5);
    
    return uniqueInsights.join('. ') + '.';
  }

  /**
   * Get context for AI chat using RAG
   */
  async getChatContext(userQuery: string, topK: number = 5): Promise<string> {
    await this.initialize();

    const relevantDocs = await this.semanticSearch(userQuery, topK);
    
    if (relevantDocs.length === 0) {
      return 'No specific strategy knowledge available.';
    }

    const context = relevantDocs
      .map((doc, idx) => {
        const source = doc.metadata.source || 'Unknown';
        const strategy = doc.metadata.strategy || '';
        const content = doc.content.substring(0, 300);
        
        return `[${idx + 1}] ${strategy ? `Strategy: ${strategy}` : source}\n${content}`;
      })
      .join('\n\n---\n\n');

    return `RELEVANT DEFI KNOWLEDGE:\n\n${context}`;
  }

  /**
   * Extract specific strategy details
   */
  async getStrategyDetails(strategyName: string): Promise<{
    name: string;
    steps: string[];
    protocols: string[];
    risks: string[];
    expectedAPY: string;
    examples: string[];
  } | null> {
    await this.initialize();

    const docs = await this.semanticSearch(strategyName, 3);
    
    if (docs.length === 0) return null;

    const details = {
      name: strategyName,
      steps: this.extractSteps(docs),
      protocols: this.extractProtocols(docs),
      risks: this.extractRisks(docs),
      expectedAPY: this.extractAPY(docs),
      examples: docs.map(d => d.content.substring(0, 200))
    };

    return details;
  }

  /**
   * Extract steps from documents
   */
  private extractSteps(docs: RAGDocument[]): string[] {
    const steps: string[] = [];
    
    docs.forEach(doc => {
      const stepMatches = doc.content.match(/(?:Step \d+:|►|➢|-)\s*([^.\n]+)/gi);
      if (stepMatches) {
        stepMatches.forEach(match => {
          const step = match.replace(/(?:Step \d+:|►|➢|-)\s*/gi, '').trim();
          if (step && step.length > 10) {
            steps.push(step);
          }
        });
      }
    });

    return [...new Set(steps)].slice(0, 8);
  }

  /**
   * Extract protocols from documents
   */
  private extractProtocols(docs: RAGDocument[]): string[] {
    const protocols = new Set<string>();
    
    // Common DeFi protocol patterns
    const protocolPatterns = [
      'Liquity', 'Aave', 'Compound', 'Morpho', 'Euler', 'Pendle',
      'Maple', 'Drift', 'Infinifi', 'Resolv', 'Reservoir',
      'Gearbox', 'Fluid', 'Yearn', 'Contango', 'Gauntlet',
      'Stream', 'Silo', 'Velodrome', 'Curve', 'Balancer'
    ];

    docs.forEach(doc => {
      protocolPatterns.forEach(protocol => {
        if (new RegExp(protocol, 'i').test(doc.content)) {
          protocols.add(protocol);
        }
      });

      // Also extract from metadata
      if (doc.metadata.protocols) {
        doc.metadata.protocols.forEach((p: string) => protocols.add(p));
      }
    });

    return Array.from(protocols).slice(0, 5);
  }

  /**
   * Extract risks from documents
   */
  private extractRisks(docs: RAGDocument[]): string[] {
    const risks: string[] = [];
    
    docs.forEach(doc => {
      const riskMatches = doc.content.match(/(?:Risk[s]?|Mitigat(?:e|ion)[s]?):\s*([^.\n]+)/gi);
      if (riskMatches) {
        riskMatches.forEach(match => {
          const risk = match.replace(/(?:Risk[s]?|Mitigat(?:e|ion)[s]?):\s*/gi, '').trim();
          if (risk && risk.length > 10) {
            risks.push(risk);
          }
        });
      }
    });

    return [...new Set(risks)].slice(0, 5);
  }

  /**
   * Extract APY information
   */
  private extractAPY(docs: RAGDocument[]): string {
    for (const doc of docs) {
      const apyMatch = doc.content.match(/(\d+\.?\d*-?\d*\.?\d*)%\s*APR|APY/);
      if (apyMatch) {
        return `${apyMatch[1]}%`;
      }
    }
    return 'Variable';
  }

  /**
   * Get all available strategies
   */
  async getAllStrategies(): Promise<Array<{
    name: string;
    description: string;
    asset: string;
    risk: string;
  }>> {
    await this.initialize();

    const strategies = new Map<string, any>();

    this.documents.forEach(doc => {
      if (doc.metadata.strategy) {
        const name = doc.metadata.strategy;
        if (!strategies.has(name)) {
          strategies.set(name, {
            name,
            description: doc.content.substring(0, 200),
            asset: doc.metadata.asset || 'Multi-asset',
            risk: doc.metadata.risk || 'Medium'
          });
        }
      }
    });

    return Array.from(strategies.values());
  }

  /**
   * Search for strategies by criteria
   */
  async searchStrategies(criteria: {
    asset?: string;
    minAPY?: number;
    maxRisk?: string;
    protocols?: string[];
  }): Promise<RAGDocument[]> {
    await this.initialize();

    let query = 'DeFi yield strategy';
    
    if (criteria.asset) {
      query += ` ${criteria.asset}`;
    }
    
    if (criteria.maxRisk) {
      query += ` ${criteria.maxRisk} risk`;
    }
    
    if (criteria.minAPY) {
      query += ` ${criteria.minAPY}% APY`;
    }
    
    if (criteria.protocols && criteria.protocols.length > 0) {
      query += ` ${criteria.protocols.join(' ')}`;
    }

    return await this.semanticSearch(query, 10);
  }

  /**
   * Get statistics about loaded knowledge
   */
  getStats(): {
    totalDocuments: number;
    withEmbeddings: number;
    sources: Record<string, number>;
    isInitialized: boolean;
  } {
    const sources: Record<string, number> = {};
    
    this.documents.forEach(doc => {
      const source = doc.metadata.source || 'unknown';
      sources[source] = (sources[source] || 0) + 1;
    });

    return {
      totalDocuments: this.documents.length,
      withEmbeddings: this.documents.filter(d => d.embedding).length,
      sources,
      isInitialized: this.isInitialized
    };
  }
}

export default RAGService;