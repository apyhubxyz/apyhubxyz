/**
 * Bridge Transaction Storage
 * 
 * Manages bridge transaction history in localStorage
 * Provides CRUD operations for transaction tracking
 */

export interface StoredBridgeTransaction {
  id: string;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  fromChain: {
    id: number;
    name: string;
    icon: string;
    explorer: string;
  };
  toChain: {
    id: number;
    name: string;
    icon: string;
    explorer: string;
  };
  token: {
    symbol: string;
    name: string;
    icon: string;
  };
  amount: string;
  usdValue: number;
  fromTxHash: string;
  toTxHash?: string;
  bridgeProtocol: string;
  mode: 'bridge' | 'bridge-execute';
  executeAction?: string;
  timestamp: number;
  estimatedCompletion?: number;
  gasCost: string;
  bridgeFee: string;
}

const STORAGE_KEY = 'apyhub_bridge_history';
const MAX_TRANSACTIONS = 50;

export class BridgeStorage {
  static getTransactions(address: string): StoredBridgeTransaction[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}_${address.toLowerCase()}`);
      if (!data) return [];
      
      const transactions = JSON.parse(data);
      return transactions.sort((a: StoredBridgeTransaction, b: StoredBridgeTransaction) => 
        b.timestamp - a.timestamp
      );
    } catch (error) {
      return [];
    }
  }

  static addTransaction(address: string, transaction: StoredBridgeTransaction): void {
    try {
      const existing = this.getTransactions(address);
      const updated = [transaction, ...existing];
      const trimmed = updated.slice(0, MAX_TRANSACTIONS);
      
      localStorage.setItem(
        `${STORAGE_KEY}_${address.toLowerCase()}`,
        JSON.stringify(trimmed)
      );
    } catch (error) {
      // Silently handle storage errors
    }
  }
}