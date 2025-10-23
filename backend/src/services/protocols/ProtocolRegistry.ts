// Protocol Registry - Central registry for all DeFi protocols
import { ProtocolAdapter, ProtocolInfo, ChainId } from './ProtocolAdapter';
import { ethers } from 'ethers';
import Redis from 'ioredis';
import PrismaService from '../PrismaService';

export class ProtocolRegistry {
  private adapters: Map<string, ProtocolAdapter> = new Map();
  private protocols: Map<string, ProtocolInfo> = new Map();
  
  // Removed static mock protocol lists. Registry will operate without pre-seeded data.
  
  constructor(
    private provider: ethers.Provider,
    private redis?: Redis
  ) {
    this.initializeProtocols();
  }
  
  private initializeProtocols(): void {
    // No-op: protocols will be sourced dynamically (DB/Envio) by consumers as needed
    this.protocols.clear();
    console.log(`✅ ProtocolRegistry initialized (no static mocks)`);
  }
  
  // Get protocol info
  getProtocolInfo(protocolId: string): ProtocolInfo | undefined {
    return this.protocols.get(protocolId);
  }
  
  // Get all protocols
  getAllProtocols(): ProtocolInfo[] {
    return Array.from(this.protocols.values());
  }
  
  // Get protocols by chain
  getProtocolsByChain(chain: ChainId): ProtocolInfo[] {
    return this.getAllProtocols().filter(p => p.chains.includes(chain));
  }
  
  // Get protocols by category
  getProtocolsByCategory(category: string): ProtocolInfo[] {
    return this.getAllProtocols().filter(p => p.categories.includes(category as any));
  }
  
  // Register an adapter
  registerAdapter(protocolId: string, adapter: ProtocolAdapter): void {
    this.adapters.set(protocolId, adapter);
  }
  
  // Get adapter for protocol
  getAdapter(protocolId: string): ProtocolAdapter | undefined {
    return this.adapters.get(protocolId);
  }
  
  // Get protocol statistics
  getStatistics(): {
    totalProtocols: number;
    totalTVL: number;
    chainDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
    auditedProtocols: number;
  } {
    // Without static data, return minimal statistics.
    // If needed, routes can compute DB-backed stats explicitly.
    return {
      totalProtocols: 0,
      totalTVL: 0,
      chainDistribution: {},
      categoryDistribution: {},
      auditedProtocols: 0,
    };
  }
}

export default ProtocolRegistry;