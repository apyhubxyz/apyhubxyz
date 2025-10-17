'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiMenu, HiX } from 'react-icons/hi'
import { FaWallet } from 'react-icons/fa'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // might want to move these to a config file later
  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Protocols', href: '#protocols' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'About', href: '#about' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-brown-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold gradient-text">Apyhub</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <motion.a
                key={link.name}
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-brown-800 dark:text-brown-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {link.name}
              </motion.a>
            ))}
            
            {/* Connect wallet btn - need to integrate web3 */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="btn-hover bg-gradient-to-r from-brown-500 to-purple-500 text-white px-6 py-2 rounded-full flex items-center space-x-2 hover:shadow-lg transition-all"
            >
              <FaWallet />
              <span>Connect Wallet</span>
            </motion.button>
          </div>

          {/* Hamburger menu for mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-brown-800 dark:text-brown-100"
          >
            {isMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-brown-200 dark:border-brown-800"
          >
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-brown-800 dark:text-brown-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <button className="bg-gradient-to-r from-brown-500 to-purple-500 text-white px-6 py-2 rounded-full flex items-center justify-center space-x-2">
                <FaWallet />
                <span>Connect Wallet</span>
              </button>
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  )
}

export default Header