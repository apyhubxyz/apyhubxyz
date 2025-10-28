'use client';

import { BridgeButton } from '@avail-project/nexus-widgets';
import type { SUPPORTED_CHAINS_IDS, SUPPORTED_TOKENS } from '@avail-project/nexus-core';
import { FaExchangeAlt } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { motion } from 'framer-motion';

/**
 * BridgeTriggerButton Component
 * 
 * A wrapper around the official Avail Nexus BridgeButton widget.
 * The BridgeButton handles all bridge functionality automatically:
 * - Opens the bridge modal
 * - Manages token selection
 * - Handles approvals/allowances
 * - Executes cross-chain transactions
 * - Shows transaction status
 * 
 * @see https://docs.availproject.org/docs/build-with-avail/Nexus/avail-nexus-widgets-quickstart
 */
export function BridgeTriggerButton() {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-dark rounded-3xl p-8 border border-purple-200 dark:border-purple-800/50 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <HiSparkles className="text-purple-500" />
            <span className="text-sm font-medium text-brown-800 dark:text-brown-200">
              Powered by Avail Nexus
            </span>
          </div>
          <h2 className="text-2xl font-bold text-brown-900 dark:text-brown-100 mb-2">
            Cross-Chain Bridge
          </h2>
          <p className="text-brown-600 dark:text-brown-400 text-sm">
            Bridge assets across multiple blockchains with optimal routes
          </p>
        </div>

        {/* Official Nexus BridgeButton Widget */}
        <BridgeButton>
          {({ onClick, isLoading }) => (
            <button
              onClick={onClick}
              disabled={isLoading}
              className={`
                w-full py-4 rounded-2xl font-bold text-white transition-all duration-300
                ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brown-500 to-purple-500 hover:from-brown-600 hover:to-purple-600 shadow-xl hover:shadow-2xl transform hover:-translate-y-1'
                }
              `}
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading Bridge...
                  </>
                ) : (
                  <>
                    <FaExchangeAlt />
                    Open Bridge
                  </>
                )}
              </span>
            </button>
          )}
        </BridgeButton>

        {/* Info Section */}
        <div className="mt-6 p-4 rounded-xl glass border border-purple-200 dark:border-purple-800/50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brown-600 dark:text-brown-400">Supported Networks</span>
              <span className="text-brown-900 dark:text-brown-100 font-medium">11 Mainnets</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brown-600 dark:text-brown-400">Bridge Fee</span>
              <span className="text-brown-900 dark:text-brown-100 font-medium">Very Low</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brown-600 dark:text-brown-400">Estimated Time</span>
              <span className="text-brown-900 dark:text-brown-100 font-medium">3-5 minutes</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 rounded-xl glass">
            <div className="text-purple-500 mb-1">⚡</div>
            <div className="text-brown-700 dark:text-brown-300 font-medium">Fast</div>
          </div>
          <div className="p-3 rounded-xl glass">
            <div className="text-purple-500 mb-1">🔒</div>
            <div className="text-brown-700 dark:text-brown-300 font-medium">Secure</div>
          </div>
          <div className="p-3 rounded-xl glass">
            <div className="text-purple-500 mb-1">💰</div>
            <div className="text-brown-700 dark:text-brown-300 font-medium">Low Fees</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * PrefilledBridgeButton Component
 *
 * Example of using BridgeButton with prefilled parameters.
 * This locks the bridge to specific token/amount/destination.
 */
export function PrefilledBridgeButton({
  chainId,
  token,
  amount,
}: {
  chainId?: SUPPORTED_CHAINS_IDS;
  token?: SUPPORTED_TOKENS;
  amount?: string;
}) {
  return (
    <BridgeButton
      prefill={{
        chainId,
        token,
        amount,
      }}
    >
      {({ onClick, isLoading }) => (
        <button
          onClick={onClick}
          disabled={isLoading}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Bridging...' : `Bridge ${amount || ''} ${token || ''}`}
        </button>
      )}
    </BridgeButton>
  );
}