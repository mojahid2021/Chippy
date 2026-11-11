import { cn } from "@/lib/utils"

/** Chippy's mark: a sun-yellow chat chip with a wink. Uses brand tokens so it follows the theme. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7 shrink-0", className)}>
      <path d="M16 3c7.7 0 13 4.9 13 11.6 0 6.7-5.3 11.6-13 11.6-1.4 0-2.7-.2-3.9-.5L6 28.5l1.4-5.4C4.6 21 3 18 3 14.6 3 7.9 8.3 3 16 3Z" fill="var(--brand)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="11.5" cy="14" r="1.9" fill="var(--ink)" />
      <path d="M18.5 14.2c.9-1 2.6-1 3.5 0" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {!compact && <span className="font-display text-lg font-bold tracking-[-0.03em]">chippy</span>}
    </span>
  )
}
