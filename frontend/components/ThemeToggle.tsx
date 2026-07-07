'use client';

import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={cn(
        'group relative inline-flex h-10 w-10 items-center justify-center rounded-xl',
        'border border-line bg-surface/70 backdrop-blur transition-colors hover:border-faint',
      )}
    >
      <span
        className={cn(
          'transition-opacity duration-300',
          !mounted && 'opacity-0',
        )}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -40, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="block"
        >
          {isDark ? (
            <Moon className="h-[1.15rem] w-[1.15rem] text-accent" strokeWidth={1.75} />
          ) : (
            <Sun className="h-[1.15rem] w-[1.15rem] text-warn" strokeWidth={1.75} />
          )}
        </motion.span>
      </span>
    </button>
  );
}
