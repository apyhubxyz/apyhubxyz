'use client'

import { motion } from 'framer-motion'
import { FaCheckCircle } from 'react-icons/fa'

const Benefits = () => {
  const benefits = [
    {
      title: 'Save Time & Effort',
      description: 'No need to manually check multiple protocols. Get all the data you need in one place.',
      features: [
        'Automated data aggregation',
        'Real-time updates',
        'Historical tracking',
      ],
    },
    {
      title: 'Maximize Returns',
      description: 'Find the best yields for your assets with our advanced comparison tools.',
      features: [
        'Compare APY across protocols',
        'Risk-adjusted returns',
        'Yield optimization strategies',
      ],
    },
    {
      title: 'Reduce Risk',
      description: 'Make informed decisions with comprehensive risk analytics and protocol audits.',
      features: [
        'Security score ratings',
        'Audit verification',
        'Risk assessment tools',
      ],
    },
  ]

  return (
    <section id="benefits" className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-purple-500 font-semibold text-sm uppercase tracking-wider">Benefits</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            <span className="text-brown-800 dark:text-brown-100">Why Choose</span>{' '}
            <span className="gradient-text">Apyhub</span>
          </h2>
          <p className="text-lg text-brown-600 dark:text-brown-300 max-w-3xl mx-auto">
            Join thousands of DeFi investors who are already maximizing their yields with our platform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass p-8 rounded-2xl h-full border border-brown-200/20 dark:border-brown-800/20">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-brown-400 to-purple-400 rounded-full opacity-10 blur-xl"></div>
                
                <h3 className="text-2xl font-semibold text-brown-800 dark:text-brown-100 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-brown-600 dark:text-brown-300 mb-6 leading-relaxed">
                  {benefit.description}
                </p>
                
                <div className="space-y-3">
                  {benefit.features.map((feature) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3"
                    >
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span className="text-brown-700 dark:text-brown-200">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 glass rounded-3xl p-12 border border-brown-200/20 dark:border-brown-800/20"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">$2.5B+</div>
              <div className="text-brown-600 dark:text-brown-300">Total Value Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">50+</div>
              <div className="text-brown-600 dark:text-brown-300">DeFi Protocols</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">100K+</div>
              <div className="text-brown-600 dark:text-brown-300">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">99.9%</div>
              <div className="text-brown-600 dark:text-brown-300">Uptime</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Benefits