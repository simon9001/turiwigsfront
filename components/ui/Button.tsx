'use client';

import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const sizes = {
  sm: 'h-8 px-4 text-xs rounded-lg',
  md: 'h-11 px-6 text-sm rounded-xl',
  lg: 'h-13 px-8 text-base rounded-xl',
};

/* Flat surfaces, one border, no inset highlights. The gradients and bevels
   here were built for the metallic gold treatment and have nothing to sit on
   now that the palette is neutral. */
const variants = {
  primary: 'bg-ink text-white border border-ink hover:bg-[#33302b]',
  secondary: 'bg-paper text-ink border border-line-2 hover:bg-sand hover:border-ink',
  ghost: 'bg-transparent text-slate border border-transparent hover:bg-mist hover:text-ink',
  danger: 'text-white border',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      style={
        variant === 'danger'
          ? { background: 'var(--alert)', borderColor: 'var(--alert)', ...style }
          : style
      }
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
