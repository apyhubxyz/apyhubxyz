'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit'
import { config } from './wagmi'
import { ThemeProvider, useTheme } from './darkmode'
import { NexusProvider } from '@avail-project/nexus-widgets'
import { WalletBridge } from '@/components/WalletBridge'
import { NexusErrorBoundary } from '@/components/NexusErrorBoundary'
import { useState } from 'react'
import '@rainbow-me/rainbowkit/styles.css'

function RainbowKitWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  
  const customTheme: Theme = {
    blurs: {
      modalOverlay: 'blur(4px)',
    },
    colors: {
      accentColor: theme === 'dark' ? '#a0553d' : '#a0553d',
      accentColorForeground: '#FFFFFF',
      actionButtonBorder: theme === 'dark' ? 'rgba(160, 85, 61, 0.3)' : 'rgba(160, 85, 61, 0.2)',
      actionButtonBorderMobile: theme === 'dark' ? 'rgba(160, 85, 61, 0.3)' : 'rgba(160, 85, 61, 0.2)',
      actionButtonSecondaryBackground: theme === 'dark' ? 'rgba(160, 85, 61, 0.1)' : 'rgba(160, 85, 61, 0.05)',
      closeButton: theme === 'dark' ? '#6c3a2e' : '#834536',
      closeButtonBackground: theme === 'dark' ? 'rgba(160, 85, 61, 0.1)' : 'rgba(160, 85, 61, 0.05)',
      connectButtonBackground: theme === 'dark' ? '#3a1c17' : '#FFFFFF',
      connectButtonBackgroundError: '#FF494A',
      connectButtonInnerBackground: theme === 'dark' ? 'linear-gradient(135deg, #3a1c17, #33153d)' : 'linear-gradient(135deg, #fdf8f6, #faf7fc)',
      connectButtonText: theme === 'dark' ? '#f9f0e9' : '#3a1c17',
      connectButtonTextError: '#FF494A',
      connectionIndicator: '#30E000',
      downloadBottomCardBackground: theme === 'dark' ? 'linear-gradient(135deg, #3a1c17, #33153d)' : 'linear-gradient(135deg, #fdf8f6, #faf7fc)',
      downloadTopCardBackground: theme === 'dark' ? 'linear-gradient(135deg, #3a1c17, #33153d)' : 'linear-gradient(135deg, #fdf8f6, #faf7fc)',
      error: '#FF494A',
      generalBorder: theme === 'dark' ? 'rgba(160, 85, 61, 0.2)' : 'rgba(160, 85, 61, 0.1)',
      generalBorderDim: theme === 'dark' ? 'rgba(160, 85, 61, 0.1)' : 'rgba(160, 85, 61, 0.05)',
      menuItemBackground: theme === 'dark' ? 'rgba(160, 85, 61, 0.1)' : 'rgba(160, 85, 61, 0.05)',
      modalBackdrop: 'rgba(0, 0, 0, 0.5)',
      modalBackground: theme === 'dark' ? '#3a1c17' : '#FFFBF5',
      modalBorder: theme === 'dark' ? 'rgba(160, 85, 61, 0.3)' : 'rgba(160, 85, 61, 0.2)',
      modalText: theme === 'dark' ? '#f9f0e9' : '#3a1c17',
      modalTextDim: theme === 'dark' ? 'rgba(249, 240, 233, 0.5)' : 'rgba(58, 28, 23, 0.5)',
      modalTextSecondary: theme === 'dark' ? '#e9c2a7' : '#6c3a2e',
      profileAction: theme === 'dark' ? '#3a1c17' : '#FFFBF5',
      profileActionHover: theme === 'dark' ? 'rgba(160, 85, 61, 0.2)' : 'rgba(160, 85, 61, 0.1)',
      profileForeground: theme === 'dark' ? '#3a1c17' : '#FFFBF5',
      selectedOptionBorder: 'rgba(160, 85, 61, 0.5)',
      standby: theme === 'dark' ? '#8c49a5' : '#8c49a5',
    },
    fonts: {
      body: 'Inter, system-ui, -apple-system, sans-serif',
    },
    radii: {
      actionButton: '12px',
      connectButton: '12px',
      menuButton: '12px',
      modal: '16px',
      modalMobile: '16px',
    },
    shadows: {
      connectButton: theme === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(160, 85, 61, 0.1)',
      dialog: '0 8px 32px rgba(0, 0, 0, 0.1)',
      profileDetailsAction: '0 2px 6px rgba(0, 0, 0, 0.05)',
      selectedOption: '0 2px 6px rgba(0, 0, 0, 0.05)',
      selectedWallet: '0 2px 6px rgba(0, 0, 0, 0.05)',
      walletLogo: '0 2px 16px rgba(0, 0, 0, 0.05)',
    },
  }

  return (
    <RainbowKitProvider theme={customTheme}>
      <NexusErrorBoundary>
        <NexusProvider
          config={{
            debug: false,        // Set to true only for verbose logs in development
            network: 'mainnet',  // CRITICAL: Must be 'mainnet' for production
          }}
        >
          {/* WalletBridge forwards wallet provider to Nexus - CRITICAL for bridge functionality */}
          <WalletBridge />
          {children}
        </NexusProvider>
      </NexusErrorBoundary>
    </RainbowKitProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWrapper>
            {children}
          </RainbowKitWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
