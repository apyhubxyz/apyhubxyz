'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNexus } from '@avail-project/nexus-widgets';
import type { EthereumProvider } from '@avail-project/nexus-core';

/**
 * WalletBridge Component
 *
 * This is a CRITICAL component that forwards the connected wallet's EIP-1193 provider
 * to the Nexus SDK. Without this, bridge flows will not initialize and transactions
 * cannot be executed.
 *
 * This component must be placed inside NexusProvider in the component tree.
 *
 * How it works:
 * 1. Monitors wallet connection status via wagmi's useAccount()
 * 2. When wallet connects, gets the EIP-1193 provider from the connector
 * 3. Forwards that provider to Nexus SDK via setProvider()
 * 4. This allows Nexus to execute cross-chain transactions
 *
 * @see https://docs.availproject.org/docs/build-with-avail/Nexus/avail-nexus-widgets-quickstart
 */
export function WalletBridge() {
  const { connector, isConnected } = useAccount();
  const { setProvider } = useNexus();

  useEffect(() => {
    async function syncProvider() {
      if (isConnected && connector?.getProvider) {
        try {
          console.log('WalletBridge: Wallet connected, getting provider...');
          const provider = await connector.getProvider();
          
          if (provider) {
            console.log('WalletBridge: Provider obtained, forwarding to Nexus SDK');
            // This is the critical step - forward wallet provider to Nexus
            // Cast to EthereumProvider as wagmi provider is compatible
            setProvider(provider as unknown as EthereumProvider);
            console.log('WalletBridge: Provider successfully forwarded to Nexus');
          } else {
            console.warn('WalletBridge: Provider is null');
          }
        } catch (error) {
          console.error('WalletBridge: Error getting provider:', error);
        }
      }
    }
    
    syncProvider();
  }, [isConnected, connector, setProvider]);

  // This component doesn't render anything - it's a bridge component
  return null;
}