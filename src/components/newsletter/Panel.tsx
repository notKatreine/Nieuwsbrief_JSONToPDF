import type { ReactNode } from "react";

interface PanelProps {
  step?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

/** Editor panel with a tinted header strip so section boundaries are obvious. */
export function Panel({ step, title, action, children }: PanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b-2 border-border bg-muted/60 px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
          {step && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {step}
            </span>
          )}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
