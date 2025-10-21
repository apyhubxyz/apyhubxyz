'use client'

import { motion } from 'framer-motion'
import { FaGithub, FaDiscord, FaTwitter, FaTelegram, FaMedium } from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  const footerLinks = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Protocols', href: '#protocols' },
      { name: 'Benefits', href: '#benefits' },
      { name: 'Roadmap', href: '#' },
    ],
    Resources: [
      { name: 'Documentation', href: '#' },
      { name: 'API', href: '#' },
      { name: 'Tutorials', href: '#' },
      { name: 'Blog', href: '#' },
    ],
    Company: [
      { name: 'About', href: '#about' },
      { name: 'Team', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#' },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'Disclaimer', href: '#' },
    ],
  }

  const socialLinks = [
    { icon: <FaGithub />, href: 'https://github.com/apyhubxyz', label: 'GitHub' },
    { icon: <FaTelegram />, href: 'https://t.me/apyhubxyz', label: 'Telegram' },
  ]

  return (
    <footer id="about" className="bg-gradient-to-b from-transparent to-brown-50 dark:to-brown-950 pt-20 pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Logo and description */}
          <div className="col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <Link href="/" className="flex items-center space-x-2 mb-4 cursor-pointer w-fit">
                <div className="bg-gradient-to-br from-brown-500 to-purple-500 p-1 rounded-xl shadow-sm">
                  <Image src="/logo.png" alt="Apyhub Logo" width={33} height={33} className="rounded-lg" />
                </div>
                <span className="text-xl font-bold gradient-text">Apyhub</span>
              </Link>
              <p className="text-brown-600 dark:text-brown-300 leading-relaxed">
                Your gateway to maximizing DeFi yields. Discover, compare, and optimize 
                your investments across multiple protocols.
              </p>
            </motion.div>

            {/* Social links */}
            <div className="flex space-x-3">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gradient-to-br from-brown-200 to-purple-200 dark:from-brown-800 dark:to-purple-800 rounded-lg flex items-center justify-center text-brown-700 dark:text-brown-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Footer links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-brown-800 dark:text-brown-100 mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-brown-600 dark:text-brown-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 mb-12 border border-brown-200/20 dark:border-brown-800/20"
        >
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-brown-800 dark:text-brown-100 mb-2">
                Stay Updated
              </h3>
              <p className="text-brown-600 dark:text-brown-300">
                Get the latest updates on new features, protocols, and yield opportunities.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-brown-200 dark:border-brown-700 text-brown-800 dark:text-brown-100 placeholder-brown-400 dark:placeholder-brown-500 focus:outline-none focus:border-purple-500"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-brown-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div className="border-t border-brown-200 dark:border-brown-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-brown-600 dark:text-brown-300 text-sm text-center md:text-left">
              © 2025 Apyhub. All rights reserved. Built with ❤️ for the DeFi community.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="https://apyhub.xyz" className="text-brown-600 dark:text-brown-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                apyhub.xyz
              </a>
              <span className="text-brown-400">•</span>
              <span className="text-brown-600 dark:text-brown-300">
                Powered by Web3
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer