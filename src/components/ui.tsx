import { ReactNode, ButtonHTMLAttributes } from 'react'

// ── Button ─────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  const variants = {
    primary: 'bg-cyan-500 text-white hover:bg-cyan-600 active:scale-[0.98] shadow-lg shadow-cyan-500/20',
    secondary: 'bg-ink-800 text-ink-100 border border-ink-700 hover:bg-ink-700 active:scale-[0.98]',
    ghost: 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/50',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`glass rounded-2xl ${hover ? 'glass-hover' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────

export function Badge({ children, color = 'default', className = '' }: { children: ReactNode; color?: 'default' | 'green' | 'amber' | 'red' | 'blue'; className?: string }) {
  const colors = {
    default: 'bg-ink-700/50 text-ink-300 border-ink-600/50',
    green: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    amber: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}

// ── ScoreRing ──────────────────────────────────────────────────────────────

export function ScoreRing({ score, size = 60, strokeWidth = 4, label }: { score: number; size?: number; strokeWidth?: number; label?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  const color = score >= 75 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} className="stroke-ink-700/50 fill-none" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          className={`fill-none ${color} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-display" style={{ color: 'currentColor' }}>{score}</span>
        <span className="text-[10px] text-ink-400 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-ink-800/50 flex items-center justify-center text-ink-500 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-ink-200 mb-1">{title}</h3>
      <p className="text-sm text-ink-400 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  )
}

// ── Input ──────────────────────────────────────────────────────────────────

export function Input({ label, error, className = '', ...props }: { label?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-ink-300 mb-1.5">{label}</label>}
      <input className="input-field" {...props} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }: { label?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-ink-300 mb-1.5">{label}</label>}
      <textarea className="input-field resize-none" {...props} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
