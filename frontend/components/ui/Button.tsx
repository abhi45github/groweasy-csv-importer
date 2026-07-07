'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-ink hover:brightness-110 shadow-soft border border-primary/40',
  accent:
    'bg-accent text-accent-ink hover:brightness-105 shadow-soft border border-accent/50 font-semibold',
  secondary:
    'bg-surface text-ink border border-line hover:bg-surface-2 hover:border-faint',
  ghost: 'bg-transparent text-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-[0.95rem] gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-xl py-3.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium tracking-tight',
        'transition-all duration-200 ease-out active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
