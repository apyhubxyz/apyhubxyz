'use client'

import { motion } from 'framer-motion'
import { BsArrowRight } from 'react-icons/bs'
import { FaTelegram } from 'react-icons/fa'
import Link from 'next/link'

const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-brown-500 via-purple-500 to-brown-500 rounded-3xl opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
          
          {/* Floating elements */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-10 -right-10 w-40 h-40 border-4 border-white/10 rounded-3xl"
          />
          <motion.div
            animate={{ 
              rotate: [360, 0],
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-10 -left-10 w-32 h-32 border-4 border-white/10 rounded-full"
          />

          <div className="relative px-8 py-16 md:px-12 md:py-20 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              Start Your DeFi Journey
              <br />
              <span className="text-brown-200">Today</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg md:text-xl text-brown-100 mb-10 max-w-3xl mx-auto"
            >
              Join thousands of investors who are already maximizing their yields with Apyhub. 
              No registration required. Connect your wallet and start earning.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href="/pools">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-brown-800 px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center space-x-2 shadow-2xl hover:shadow-3xl transition-all"
                >
                  <span>Pools</span>
                  <BsArrowRight className="text-xl" />
                </motion.button>
              </Link>
            </motion.div>

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex justify-center items-center space-x-2"
            >
              <span className="text-brown-200 mr-4">Join our community:</span>
              <div className="flex space-x-4">
                <a
                  href="https://t.me/apyhubxyz"
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <FaTelegram />
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA