'use client'

import { useState, useRef, useEffect } from 'react'
import { useAccount } from 'wagmi'
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import apiClient from '@/lib/api'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIChatbot() {
  const { address } = useAccount()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI investment advisor. I can help you find the best APY opportunities based on your preferences and risk tolerance. How can I help you today?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(`session_${Date.now()}`)
  
  // Ensure component is client-side mounted
  useEffect(() => {
    setMounted(true)
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await apiClient.ai.chat({
        messages: [...messages, userMessage],
        walletAddress: address,
        sessionId: sessionId.current,
      })

      // The response is already unwrapped by axios interceptor
      const messageContent = response?.data?.message || response?.message || 'I apologize, but I couldn\'t generate a response. Please try again.'
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: messageContent,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Chat error:', error)
      
      // More detailed error handling
      let errorContent = 'Sorry, I encountered an error. Please try again.'
      if (error?.message?.includes('404')) {
        errorContent = 'AI service endpoint not found. Please check the backend configuration.'
      } else if (error?.message?.includes('network')) {
        errorContent = 'Network error. Please check if the backend server is running.'
      }
      
      toast.error('Failed to get AI response')
      const errorMessage: Message = {
        role: 'assistant',
        content: errorContent,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = async (question: string) => {
    setInput(question)
    // Wait for next tick to ensure input is set
    setTimeout(() => {
      handleSend()
    }, 0)
  }

  const quickQuestions = [
    'What are the top 5 pools with the highest APY?',
    'Show me low-risk stablecoin pools',
    'What are the best loopable opportunities?',
    'Compare USDC pools across different protocols',
  ]

  // Don't render until client-side mounted
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Floating Button with inline styles for reliability */}
      {!isOpen && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #9333ea 0%, #6b21a8 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '50%',
            boxShadow: '0 10px 25px rgba(147, 51, 234, 0.3)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Open AI Chat"
          type="button"
        >
          <SparklesIcon style={{ width: '28px', height: '28px' }} />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '12px',
            height: '12px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
          }}></span>
        </button>
      )}

      {/* Chat Window with higher z-index and inline critical styles */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 10000,
            width: '384px',
            height: '600px',
            maxHeight: '80vh',
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <SparklesIcon className="w-6 h-6" />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span>
              </div>
              <div>
                <div className="font-semibold">AI Investment Advisor</div>
                <div className="text-xs text-purple-200">Powered by OpenAI</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
              type="button"
              aria-label="Close chat"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <SparklesIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">AI</span>
                    </div>
                  )}
                  <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-4 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mt-4 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-4 mb-2">{children}</h3>,
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium underline">
                            {children}
                          </a>
                        ),
                        table: ({ children }) => <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">{children}</table>,
                        thead: ({ children }) => <thead className="bg-gray-100 dark:bg-gray-700">{children}</thead>,
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => <tr className="border-b border-gray-300 dark:border-gray-600">{children}</tr>,
                        th: ({ children }) => <th className="px-4 py-2 text-left font-semibold">{children}</th>,
                        td: ({ children }) => <td className="px-4 py-2">{children}</td>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 pb-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick questions:</div>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about pools, APYs, strategies..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            {address && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
