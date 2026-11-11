import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/** Styled native <select>: keeps mobile pickers and form semantics, matches Input. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        data-slot="native-select"
        className="h-9 w-full appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-base shadow-xs outline-none transition-[border-color,box-shadow] hover:border-input focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-brand/60 disabled:opacity-60"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { NativeSelect }
