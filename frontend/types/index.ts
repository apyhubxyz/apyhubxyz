// Type definitions for the app
// TODO: Consider using codegen for these from backend schemas

export interface Protocol {
  id: string
  name: string
  chain: string
  tvl: string
  logo?: string
  website?: string
  audited: boolean
}

export interface Pool {
  id: string
  protocolId: string
  asset: string
  apy: number
  tvl: string
  risk: 'low' | 'medium' | 'high'
  lastUpdated: Date
}

export interface UserPosition {
  poolId: string
  amount: number
  earnings: number
  startDate: Date
}

export interface Stats {
  totalValueLocked: string
  protocolCount: number
  activeUsers: number
  avgApy: number
}

// Navigation types
export interface NavLink {
  name: string
  href: string
  external?: boolean
}

// Form types for newsletter
export interface NewsletterFormData {
  email: string
}

// Wallet connection state
export interface WalletState {
  connected: boolean
  address?: string
  chainId?: number
  balance?: string
}

// API response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  timestamp: number
}

// Feature flags type
export interface FeatureFlags {
  walletConnect: boolean
  liveData: boolean
  newsletter: boolean
  darkMode: boolean
}