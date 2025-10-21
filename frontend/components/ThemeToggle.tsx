'use client'

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/lib/darkmode'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="btn-hover bg-gradient-to-r from-brown-500 to-purple-500 text-white px-3 py-2 rounded-full flex items-center justify-center font-semibold shadow-lg hover:shadow-xl transition-shadow"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="w-5 h-5 text-white" />
      ) : (
        <SunIcon className="w-5 h-5 text-white" />
      )}
    </button>
  )
}
