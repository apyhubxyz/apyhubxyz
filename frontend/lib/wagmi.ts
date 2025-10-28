import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  avalanche,
  scroll,
  bsc
} from 'wagmi/chains'
import { createStorage } from 'wagmi'

// Additional chains that might not be in wagmi/chains yet
// Define them manually if needed
const sophon = {
  id: 50104,
  name: 'Sophon',
  network: 'sophon',
  nativeCurrency: {
    decimals: 18,
    name: 'Sophon',
    symbol: 'SOPH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.sophon.xyz'] },
    public: { http: ['https://rpc.sophon.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Sophon Explorer', url: 'https://explorer.sophon.xyz' },
  },
}

const kaia = {
  id: 8217,
  name: 'Kaia',
  network: 'kaia',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'KAIA',
  },
  rpcUrls: {
    default: { http: ['https://public-en-cypress.klaytn.net'] },
    public: { http: ['https://public-en-cypress.klaytn.net'] },
  },
  blockExplorers: {
    default: { name: 'Kaia Explorer', url: 'https://scope.klaytn.com' },
  },
}

const hyperEVM = {
  id: 999,
  name: 'HyperEVM',
  network: 'hyperevm',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.hyperevm.com'] },
    public: { http: ['https://rpc.hyperevm.com'] },
  },
  blockExplorers: {
    default: { name: 'HyperEVM Explorer', url: 'https://explorer.hyperevm.com' },
  },
}

// Avail Nexus supported mainnet chains
export const config = getDefaultConfig({
  appName: 'Apyhub - Nexus Bridge',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [
    mainnet,       // Ethereum (1)
    optimism,      // Optimism (10)
    bsc,           // BNB Chain (56)
    polygon,       // Polygon (137)
    arbitrum,      // Arbitrum (42161)
    avalanche,     // Avalanche (43114)
    base,          // Base (8453)
    scroll,        // Scroll (534352)
    kaia,          // Kaia (8217)
    sophon,        // Sophon (50104)
    hyperEVM,      // HyperEVM (999)
  ] as any,
  ssr: true,
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: 'wagmi.wallet',
  }),
})
