import { cn } from "@/lib/utils"

/** One header shape for every dashboard page: title, one-line purpose, actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-3xl tracking-[-0.03em] text-foreground">{title}</h1>
        {description && <p className="mt-1.5 max-w-[68ch] text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Empty or error state that always points to the next action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  body?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed bg-muted/50 px-6 py-14 text-center", className)}>
      {icon && <div className="mx-auto grid size-11 place-items-center rounded-xl bg-brand text-brand-foreground [&_svg]:size-5">{icon}</div>}
      <h2 className="mt-4 text-lg">{title}</h2>
      {body && <p className="mx-auto mt-1 max-w-[46ch] text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  )
}
