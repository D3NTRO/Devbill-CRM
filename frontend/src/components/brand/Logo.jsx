import { useLocation } from 'react-router-dom'
import { useTimerStore } from '../../store/timerStore'

const MONOGRAM_SIZE = 32

function Monogram({ size = MONOGRAM_SIZE, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="6" fill="#6366F1" />
      <path d="M5 7h3a9 9 0 0 1 0 18h-3z" fill="#fff" />
      <path d="M19 7h3a4 4 0 0 1 0 8h-3v2h3a4 4 0 0 1 0 8h-3z" fill="#fff" />
      <circle cx="28" cy="5" r="2.5" fill="#10B981" />
    </svg>
  )
}

function Dot() {
  const { isRunning } = useTimerStore()
  const location = useLocation()
  const isTimeTracker = location.pathname === '/time-tracker'

  if (!isRunning || isTimeTracker) return null

  return (
    <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse ml-0.5" />
  )
}

export function LogoIcon({ size = 28, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Monogram size={size} />
    </span>
  )
}

export function LogoHorizontal({ size = 28, showTagline = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Monogram size={size} />
      <span className="flex flex-col">
        <span className="text-lg md:text-xl font-bold text-indigo-600 leading-tight flex items-center">
          DevBill
          <Dot />
        </span>
        {showTagline && (
          <span className="text-[10px] text-gray-400 leading-tight tracking-wide uppercase">
            Freelancer CRM
          </span>
        )}
      </span>
    </span>
  )
}
