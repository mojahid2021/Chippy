import { cn } from "@/lib/utils"

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] rounded-bl-[3px] bg-marigold text-sm font-extrabold text-ink">
        BD
      </span>
      {!compact && <span className="text-lg font-bold [font-stretch:115%]">BDChatPro</span>}
    </span>
  )
}
