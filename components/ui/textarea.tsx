import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-lg border border-border bg-card px-3 py-2 text-base shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/80 hover:border-input focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }