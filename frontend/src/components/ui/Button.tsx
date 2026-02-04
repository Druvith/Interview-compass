import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', fullWidth, children, ...props }, ref) => {
    
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return "bg-[var(--accent)] text-[var(--text-main)] border-[var(--accent)] font-bold hover:bg-[#ff451a]";
        case 'danger':
          return "bg-transparent border-[var(--error)] text-[var(--error)] hover:bg-[rgba(255,51,0,0.1)]";
        case 'ghost':
          return "bg-transparent border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-hover)]";
        default: // secondary
          return "bg-transparent border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--surface-hover)] hover:border-[var(--text-main)]";
      }
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={clsx(
          "px-5 py-3 text-[11px] uppercase tracking-wider font-mono border flex items-center justify-center gap-2 transition-colors",
          getVariantStyles(),
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);