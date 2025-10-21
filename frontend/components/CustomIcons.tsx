export const PoolIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 7C3 7 6.5 9 12 9C17.5 9 21 7 21 7"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M3 12C3 12 6.5 14 12 14C17.5 14 21 12 21 12"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M3 17C3 17 6.5 19 12 19C17.5 19 21 17 21 17"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.5"/>
  </svg>
)

export const ChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 18L8 13L12 16L21 7"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="21" cy="7" r="2" fill="currentColor"/>
    <path 
      d="M3 18V21H21"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
)

export const VaultIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect 
      x="3" y="6" width="18" height="14" rx="2"
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M7 6V4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6"
      stroke="currentColor" 
      strokeWidth="2"
    />
    <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 12V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const LoopIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M17 3L21 7L17 11"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M21 7H9C6.79086 7 5 8.79086 5 11V13"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M7 21L3 17L7 13"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M3 17H15C17.2091 17 19 15.2091 19 13V11"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
)

export const GemIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M6 3L3 9L12 21L21 9L18 3H6Z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
    <path 
      d="M3 9H21"
      stroke="currentColor" 
      strokeWidth="2" 
    />
    <path 
      d="M12 3L9 9L12 21L15 9L12 3Z"
      stroke="currentColor" 
      strokeWidth="1"
      opacity="0.5"
    />
  </svg>
)

export const RewardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 2L14.09 8.26L21 9.27L16.5 13.14L17.82 20L12 16.77L6.18 20L7.5 13.14L3 9.27L9.91 8.26L12 2Z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/>
  </svg>
)

export const SeedIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 22V12"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M12 12C12 8.68629 14.6863 6 18 6C18 9.31371 15.3137 12 12 12Z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 12C12 8.68629 9.31371 6 6 6C6 9.31371 8.68629 12 12 12Z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
    <path 
      d="M8 22H16"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
)

export const SearchIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle 
      cx="10" cy="10" r="7"
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M15 15L21 21"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.3"/>
  </svg>
)