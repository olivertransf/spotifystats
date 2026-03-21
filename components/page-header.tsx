import { Badge } from "@/components/ui/badge";

export function PageHeader({
  title,
  description,
  periodLabel,
  children,
}: {
  title: string;
  description?: string;
  periodLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-5 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {periodLabel ? (
            <Badge
              variant="secondary"
              className="border border-border/80 bg-secondary/80 font-normal text-xs text-muted-foreground"
            >
              {periodLabel}
            </Badge>
          ) : null}
        </div>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex w-full min-w-0 max-w-full flex-col gap-3 overflow-visible lg:max-w-xl lg:shrink-0">
          {children}
        </div>
      ) : null}
    </div>
  );
}
