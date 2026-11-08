import React from 'react';
import { X } from 'lucide-react';

export function ParchmentCard({ children, className = '', hoverEffect = false, borderStyle = 'default' }) {
  const borderClasses =
    {
      default: 'border border-[#35443a] bg-[#17211d]',
      ornate: 'border border-[#ccd5ae]/40 bg-[#17211d] shadow-[0_0_20px_rgba(204,213,174,0.08)]',
      gold: 'border border-[#d4a373]/40 bg-[#17211d] shadow-[0_0_20px_rgba(212,163,115,0.08)]',
      subtle: 'border border-[#35443a]/70 bg-[#17211d]/70',
    }[borderStyle] || 'border border-[#35443a] bg-[#17211d]';

  return (
    <div
      className={`rounded-2xl p-6 relative overflow-hidden transition-all duration-300 text-[#f1f2e9] ${borderClasses} ${
        hoverEffect ? 'hover:-translate-y-1 hover:border-[#ccd5ae]/70 hover:shadow-xl' : 'shadow-sm'
      } ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }) {
  const variants =
    {
      neutral: 'bg-[#1c2923] text-[#a9b3a8] border-[#35443a]',
      gold: 'bg-[#d4a373]/15 text-[#d4a373] border-[#d4a373]/40',
      bronze: 'bg-[#d4a373]/15 text-[#d4a373] border-[#d4a373]/40',
      beige: 'bg-[#e9edc9]/15 text-[#e9edc9] border-[#e9edc9]/40',
      cornsilk: 'bg-[#fefae0]/15 text-[#fefae0] border-[#fefae0]/35',
      papaya: 'bg-[#faedcd]/15 text-[#faedcd] border-[#faedcd]/40',
      maroon: 'bg-[#da7770]/15 text-[#da7770] border-[#da7770]/40',
      success: 'bg-[#ccd5ae]/15 text-[#ccd5ae] border-[#ccd5ae]/40',
      warning: 'bg-[#faedcd]/15 text-[#faedcd] border-[#faedcd]/40',
      danger: 'bg-[#da7770]/15 text-[#da7770] border-[#da7770]/40',
      info: 'bg-[#e9edc9]/10 text-[#fefae0] border-[#ccd5ae]/30',
    }[variant] || 'bg-[#1c2923] text-[#a9b3a8] border-[#35443a]';

  const sizes =
    {
      xs: 'text-[10px] px-2 py-0.5 font-mono',
      sm: 'text-xs px-2.5 py-1 font-mono',
      md: 'text-sm px-3 py-1.5 font-mono',
    }[size] || 'text-xs px-2.5 py-1 font-mono';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border uppercase tracking-wider ${variants} ${sizes} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  tag,
  title,
  subtitle,
  centered = false,
  className = '',
}) {
  return (
    <div className={`space-y-3 ${centered ? 'text-center max-w-3xl mx-auto' : ''} ${className}`}>
      {tag && (
        <div className="inline-flex items-center space-x-2">
          <span className="w-5 h-[1px] bg-[#ccd5ae]" />
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#ccd5ae]">
            {tag}
          </span>
          <span className="w-5 h-[1px] bg-[#d4a373]" />
        </div>
      )}
      <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#fefae0] tracking-tight leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-[#a9b3a8] leading-relaxed font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function AlertBanner({ type = 'info', title, message, action, onClose }) {
  const styles =
    {
      info: 'bg-[#17211d] border-[#ccd5ae]/45 text-[#fefae0]',
      success: 'bg-[#17211d] border-[#ccd5ae] text-[#e9edc9]',
      warning: 'bg-[#17211d] border-[#faedcd] text-[#faedcd]',
      danger: 'bg-[#17211d] border-[#da7770] text-[#da7770]',
    }[type] || 'bg-[#17211d] border-[#ccd5ae]/45 text-[#fefae0]';

  return (
    <div className={`rounded-xl border p-4 mb-4 flex items-start justify-between gap-3 shadow-lg ${styles}`}>
      <div className="space-y-1">
        {title && <h5 className="font-semibold text-sm">{title}</h5>}
        {message && <p className="text-xs sm:text-sm leading-normal opacity-90">{message}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss alert"
            className="p-1 text-[#a9b3a8] hover:text-[#fefae0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md', text = 'Loading preservation data...' }) {
  const sizeClasses =
    {
      sm: 'w-5 h-5 border-2',
      md: 'w-8 h-8 border-[3px]',
      lg: 'w-12 h-12 border-4',
    }[size] || 'w-8 h-8 border-[3px]';

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses} border-[#35443a] border-t-[#ccd5ae] rounded-full animate-spin`}
      />
      {text && (
        <p className="text-xs uppercase tracking-wider text-[#a9b3a8] font-mono font-medium">
          {text}
        </p>
      )}
    </div>
  );
}
