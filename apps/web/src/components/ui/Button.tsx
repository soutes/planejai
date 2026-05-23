'use client'

import { LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'ghost' | 'danger' | 'secondary'

interface ButtonProps {
  children: React.ReactNode
  variant?: Variant
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  Icon?: LucideIcon
  size?: 'sm' | 'md'
  style?: React.CSSProperties
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  Icon,
  size = 'md',
  style,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`af-btn af-btn--${variant}`}
      style={{
        padding: size === 'sm' ? '6px 14px' : undefined,
        fontSize: size === 'sm' ? '12px' : undefined,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2} />}
      {children}
    </button>
  )
}
