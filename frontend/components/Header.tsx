'use client'

import { useState } from 'react'
import { HiMenu, HiX } from 'react-icons/hi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Navigation links
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Pools', href: '/pools' },
    { name: 'Portfolio', href: '/portfolio' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Clickable to home */}
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <div className="bg-gradient-to-br from-brown-500 to-purple-500 p-1 rounded-xl shadow-sm">
              <Image src="/logo.png" alt="Apyhub Logo" width={33} height={33} className="rounded-lg" />
            </div>
            <span className="text-xl font-bold gradient-text">Apyhub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-brown-800 dark:text-brown-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Connect Wallet */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted
                const connected = ready && account && chain

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="btn-hover bg-gradient-to-r from-brown-500 to-purple-500 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow text-sm"
                          >
                            Connect Wallet
                          </button>
                        )
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="bg-red-500 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow text-sm"
                          >
                            Wrong Network
                          </button>
                        )
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="glass border border-brown-300 dark:border-brown-700 text-brown-800 dark:text-brown-100 px-4 py-2.5 rounded-full font-semibold hover:bg-brown-50 dark:hover:bg-brown-900 transition-colors text-sm flex items-center gap-2"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 20,
                                  height: 20,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 20, height: 20 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="btn-hover bg-gradient-to-r from-brown-500 to-purple-500 text-white px-4 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow text-sm"
                          >
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ''}
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          </div>

          {/* Mobile Navigation Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Theme Toggle - Always visible on mobile */}
            <ThemeToggle />
            
            {/* Connect Wallet - Always visible on mobile */}
            <div>
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted
                  const connected = ready && account && chain

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="btn-hover bg-gradient-to-r from-brown-500 to-purple-500 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow text-sm"
                            >
                              Connect Wallet
                            </button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="bg-red-500 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow text-sm"
                            >
                              Wrong Network
                            </button>
                          )
                        }

                        return (
                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="btn-hover bg-gradient-to-r from-brown-500 to-purple-500 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow text-sm"
                          >
                            {account.displayName}
                          </button>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>
            </div>
            
            {/* Hamburger menu for navigation links only */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-brown-800 dark:text-brown-100 p-1"
            >
              {isMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu - Only navigation links */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-brown-200 dark:border-brown-800">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-brown-800 dark:text-brown-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium px-4"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header