import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

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
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased">
        <div className="relative min-h-screen">
          {/* Bg gradient orbs for that nice depth effect */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brown-300 opacity-20 rounded-full blur-3xl"></div>
            {/* center orb - might be too much? keeping it for now */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400 opacity-10 rounded-full blur-3xl"></div>
          </div>
          {children}
        </div>
      </body>
    </html>
  )
}