import type { Metadata } from 'next'
// Temporarily disabled Google Fonts due to network issues during build
// import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/providers'
import { Toaster } from 'react-hot-toast'
import AIChatbot from '@/components/AIChatbot'
import { ThemeScript } from './theme-script'

// Using system fonts as fallback
// const inter = Inter({
//   subsets: ['latin'],
//   variable: '--font-inter',
// })

// const poppins = Poppins({
//   weight: ['300', '400', '500', '600', '700', '800', '900'],
//   subsets: ['latin'],
//   variable: '--font-poppins',
// })

export const metadata: Metadata = {
  title: 'Apyhub - Decentralized APY Aggregator',
  description: 'Discover the best APY rates across DeFi protocols. Maximize your yields with real-time data and smart analytics.',
  keywords: 'DeFi, APY, yield farming, cryptocurrency, blockchain, staking, liquidity',
  authors: [{ name: 'Apyhub Team' }],
  openGraph: {
    title: 'Apyhub - Decentralized APY Aggregator',
    description: 'Discover the best APY rates across DeFi protocols.',
    url: 'https://apyhub.xyz',
    siteName: 'Apyhub',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apyhub - Decentralized APY Aggregator',
    description: 'Discover the best APY rates across DeFi protocols.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <div className="relative min-h-screen">
            {/* Animated gradient orbs for depth and movement */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              {/* Top right orb - purple accent */}
              <div className="absolute -top-40 -right-40 w-96 h-96 opacity-30 dark:opacity-20">
                <div className="w-full h-full bg-gradient-to-br from-purple-200 via-purple-300 to-pink-200 dark:from-purple-800 dark:via-purple-900 dark:to-pink-900 rounded-full blur-3xl animate-pulse-slow"></div>
              </div>
              
              {/* Bottom left orb - brown/orange accent */}
              <div className="absolute -bottom-40 -left-40 w-96 h-96 opacity-30 dark:opacity-20">
                <div className="w-full h-full bg-gradient-to-tr from-orange-200 via-brown-200 to-amber-200 dark:from-orange-900 dark:via-brown-900 dark:to-amber-900 rounded-full blur-3xl animate-float"></div>
              </div>
              
              {/* Center floating orb - mixed colors */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] opacity-20 dark:opacity-10">
                <div className="w-full h-full bg-gradient-to-r from-rose-200 via-purple-200 to-indigo-200 dark:from-rose-900 dark:via-purple-900 dark:to-indigo-900 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
              </div>

              {/* Additional smaller accent orbs */}
              <div className="absolute top-1/4 right-1/3 w-64 h-64 opacity-25 dark:opacity-15">
                <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-orange-200 dark:from-yellow-900 dark:to-orange-900 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
              </div>
              
              <div className="absolute bottom-1/3 left-1/4 w-48 h-48 opacity-25 dark:opacity-15">
                <div className="w-full h-full bg-gradient-to-tl from-teal-200 to-cyan-200 dark:from-teal-900 dark:to-cyan-900 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }}></div>
              </div>
            </div>
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              className: '',
              style: {
                background: 'rgb(var(--background-start-rgb))',
                color: 'rgb(var(--foreground-rgb))',
              },
            }}
          />
          <AIChatbot />
        </Providers>
      </body>
    </html>
  )
}