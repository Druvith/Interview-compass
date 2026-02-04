import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          "bg-black border border-[var(--border)] text-[var(--text-main)] p-3 font-mono text-xs outline-none w-full focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]",
          className
        )}
        {...props}
      />
    );
  }
);
