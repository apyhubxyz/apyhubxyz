'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import APYShowcase from '@/components/APYShowcase'
import Benefits from '@/components/Benefits'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration issues
  if (!mounted) return null

  return (
    <main className="relative">
      <Header />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Hero />
        <Features />
        <APYShowcase />
        <Benefits />
        <CTA />
      </motion.div>
      
      <Footer />
    </main>
  )
}