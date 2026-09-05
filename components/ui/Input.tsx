'use client';

import { cn } from '@/utils/cn';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
}

export function Input({ label, error, hint, className, id, suffix, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  const inputEl = (
    <input
      id={inputId}
      {...props}
      className={cn(
        'h-11 w-full rounded-xl px-4 text-sm text-neutral-900 outline-none transition-all duration-150',
        'placeholder:text-neutral-400',
        suffix ? 'pr-10' : '',
        error ? 'border-red-400' : '',
        className
      )}
      style={{
        background: '#f4f4f2',
        border: `1px solid ${error ? '#f87171' : '#dedcd7'}`,
        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.10), inset 0 1px 2px rgba(0,0,0,0.07)',
        ...props.style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = '#ffffff';
        e.currentTarget.style.border = '1px solid #8b8881';
        e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.08), 0 0 0 3px rgba(23,22,20,0.15)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = '#f4f4f2';
        e.currentTarget.style.border = `1px solid ${error ? '#f87171' : '#dedcd7'}`;
        e.currentTarget.style.boxShadow = 'inset 0 2px 5px rgba(0,0,0,0.10), inset 0 1px 2px rgba(0,0,0,0.07)';
        props.onBlur?.(e);
      }}
    />
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium" style={{ color: '#55534e' }}>
          {label}
        </label>
      )}
      {suffix ? (
        <div className="relative">
          {inputEl}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {suffix}
          </div>
        </div>
      ) : inputEl}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: '#6e6b65' }}>{hint}</p>}
    </div>
  );
}
