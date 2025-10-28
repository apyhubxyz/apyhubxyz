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
      console.log("Starting Nexus SDK initialization...");
      
      if (sdk.isInitialized()) {
        console.log("Nexus is already initialized");
        setIsInitialized(true);
        setNexusSDK(sdk);
        return;
      }
      
      console.log("Getting wallet provider...");
      const provider = (await connector?.getProvider()) as EthereumProvider;
      if (!provider) {
        console.error("No wallet provider found. Make sure wallet is connected.");
        throw new Error("No provider found");
      }
      
      console.log("Provider obtained:", {
        isProvider: !!provider,
        hasRequest: typeof provider.request === 'function'
      });
      
      // Add timeout wrapper
      console.log("Initializing SDK with timeout...");
      const initPromise = sdk.initialize(provider);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SDK initialization timeout after 30s')), 30000)
      );
      
      await Promise.race([initPromise, timeoutPromise]);
      
      console.log("SDK initialized, setting state...");
      setNexusSDK(sdk);
      setIsInitialized(true);
      console.log("Nexus SDK initialized successfully!");
    } catch (error: any) {
      console.error("Error initializing Nexus SDK:", error);
      console.error("Error details:", error.message, error.stack);
      setIsInitialized(false);
      setNexusSDK(null);
      
      // Show user-friendly error
      if (error.message?.includes('timeout')) {
        console.error("SDK initialization timed out. This may be due to network issues or SDK configuration problems.");
      }
    }
  };

  const deinitializeNexus = async () => {
    try {
      if (!sdk.isInitialized()) throw new Error("Nexus is not initialized");
      await sdk.deinit();
      setNexusSDK(null);
      setIsInitialized(false);
    } catch (error) {
      console.error("Error deinitializing Nexus:", error);
    }
  };

  const attachEventHooks = () => {
    sdk.setOnAllowanceHook((data: OnAllowanceHookData) => {
      // Hook for showing user the allowances that need to be setup
      console.log("Allowance hook triggered:", data);
      allowanceRefCallback.current = data;
    });

    sdk.setOnIntentHook((data: OnIntentHookData) => {
      // Hook for showing user the intent, sources and fees
      console.log("Intent hook triggered:", data);
      intentRefCallback.current = data;
    });
  };

  const handleInit = useCallback(async () => {
    try {
      await initializeNexus();
      attachEventHooks();
    } catch (error) {
      console.error("Failed to initialize Nexus:", error);
    }
  }, []);

  useEffect(() => {
    // Auto-initialize when wallet is connected
    if (status === "connected" && connector) {
      console.log("Wallet connected, initializing Nexus SDK...");
      // Add a small delay to ensure wallet is fully connected
      setTimeout(() => {
        handleInit();
      }, 1000);
    }
    if (status === "disconnected") {
      console.log("Wallet disconnected, cleaning up Nexus SDK...");
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