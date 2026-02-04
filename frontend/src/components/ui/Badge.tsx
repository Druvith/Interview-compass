import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface BadgeProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

export const Badge = ({ label, onRemove, className }: BadgeProps) => {
  return (
    <span
      className={clsx(
        "font-mono text-[10px] px-2 py-1 border border-[var(--border)] bg-black text-[var(--text-main)] flex items-center gap-2 transition-colors hover:border-[var(--text-muted)] cursor-default select-none",
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
};
