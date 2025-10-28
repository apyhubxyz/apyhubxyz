"use client";
import { useCallback, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NexusSDK, type OnAllowanceHookData, type OnIntentHookData, type EthereumProvider } from '@avail-project/nexus-core';
import { useAccount } from 'wagmi';

interface NexusContextType {
  nexusSDK: NexusSDK | null;
  intentRefCallback: React.RefObject<OnIntentHookData | null>;
  allowanceRefCallback: React.RefObject<OnAllowanceHookData | null>;
  handleInit: () => Promise<void>;
  isInitialized: boolean;
}

const NexusContext = createContext<NexusContextType | null>(null);

export const NexusProvider = ({ children }: { children: React.ReactNode }) => {
  const sdk = useMemo(
    () =>
      new NexusSDK({
        network: "mainnet",
        debug: true,
      }),
    [],
  );
  
  const { status, connector } = useAccount();
  const [nexusSDK, setNexusSDK] = useState<NexusSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const intentRefCallback = useRef<OnIntentHookData | null>(null);
  const allowanceRefCallback = useRef<OnAllowanceHookData | null>(null);

  const initializeNexus = async () => {
    try {
      if (sdk.isInitialized()) {
        setIsInitialized(true);
        setNexusSDK(sdk);
        return;
      }

      const provider = (await connector?.getProvider()) as EthereumProvider;
      if (!provider) {
        throw new Error("No provider found");
      }

      // Add timeout wrapper
      const initPromise = sdk.initialize(provider);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SDK initialization timeout after 30s')), 30000)
      );

      await Promise.race([initPromise, timeoutPromise]);

      setNexusSDK(sdk);
      setIsInitialized(true);
    } catch (error: any) {
      setIsInitialized(false);
      setNexusSDK(null);
    }
  };

  const deinitializeNexus = async () => {
    try {
      if (!sdk.isInitialized()) throw new Error("Nexus is not initialized");
      await sdk.deinit();
      setNexusSDK(null);
      setIsInitialized(false);
    } catch (error) {
      // Silent error handling
    }
  };

  const attachEventHooks = () => {
    sdk.setOnAllowanceHook((data: OnAllowanceHookData) => {
      allowanceRefCallback.current = data;
    });

    sdk.setOnIntentHook((data: OnIntentHookData) => {
      intentRefCallback.current = data;
    });
  };

  const handleInit = useCallback(async () => {
    try {
      await initializeNexus();
      attachEventHooks();
    } catch (error) {
      // Silent error handling
    }
  }, []);

  useEffect(() => {
    // Auto-initialize when wallet is connected
    if (status === "connected" && connector) {
      // Add a small delay to ensure wallet is fully connected
      setTimeout(() => {
        handleInit();
      }, 1000);
    }
    if (status === "disconnected") {
      deinitializeNexus();
    }
  }, [status, connector]);

  const value = useMemo(
    () => ({
      nexusSDK,
      intentRefCallback,
      allowanceRefCallback,
      handleInit,
      isInitialized,
    }),
    [nexusSDK, handleInit, isInitialized],
  );

  return (
    <NexusContext.Provider value={value}>{children}</NexusContext.Provider>
  );
};

export function useNexus() {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error("useNexus must be used within a NexusProvider");
  }
  return context;
}