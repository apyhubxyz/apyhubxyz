// Mock implementation of Nexus Bridge for testing
export class MockNexusBridge {
  private isInit = false;

  async initialize(provider: any): Promise<void> {
    console.log('Mock Nexus Bridge initialized');
    this.isInit = true;
    return Promise.resolve();
  }

  isInitialized(): boolean {
    return this.isInit;
  }

  async bridge(params: {
    token: string;
    amount: string;
    chainId: number;
  }): Promise<{
    success: boolean;
    txHash?: string;
    explorerUrl?: string;
    error?: string;
  }> {
    console.log('Mock bridge called with params:', params);
    
    // Simulate bridge transaction
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        resolve({
          success: true,
          txHash: mockTxHash,
          explorerUrl: `https://etherscan.io/tx/${mockTxHash}`
        });
      }, 2000);
    });
  }

  setOnIntentHook(callback: Function) {
    console.log('Mock intent hook set');
  }

  setOnAllowanceHook(callback: Function) {
    console.log('Mock allowance hook set');
  }

  async deinit(): Promise<void> {
    console.log('Mock Nexus Bridge deinitialized');
    this.isInit = false;
    return Promise.resolve();
  }
}