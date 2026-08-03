import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Finding } from "@/lib/newsletter/validate";
import type { Lang } from "@/lib/newsletter/types";

interface Props {
  findings: Finding[];
  onDismiss: (id: string) => void;
  onDismissAll: (ids: string[]) => void;
  onJump: (lang: Lang, itemId: string) => void;
}

export function ChecksPanel({ findings, onDismiss, onDismissAll, onJump }: Props) {
  const errors = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warning");
  const dismissible = findings.filter((finding) => finding.dismissible);
  // Errors block a good PDF, so show them straight away; warnings stay folded.
  const [open, setOpen] = useState(errors.length > 0);

  if (findings.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">All checks passed.</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {errors.length} {errors.length === 1 ? "error" : "errors"}, {warnings.length}{" "}
            {warnings.length === 1 ? "warning" : "warnings"}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {dismissible.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={() => onDismissAll(dismissible.map((finding) => finding.id))}
          >
            Ignore all warnings
          </Button>
        )}
      </div>

      {open && (
        <ul className="mt-3 space-y-1.5">
          {[...errors, ...warnings].map((finding) => (
            <li
              key={finding.id}
              className={`flex items-start gap-2 rounded-lg border p-2 text-xs ${
                finding.severity === "error"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border bg-muted/40"
              }`}
            >
              <span className="min-w-0 flex-1 leading-relaxed">{finding.message}</span>
              {finding.lang && finding.itemId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 shrink-0 px-2 text-xs"
                  onClick={() => onJump(finding.lang!, finding.itemId!)}
                >
                  Fix
                </Button>
              )}
              {finding.dismissible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  aria-label="Dismiss warning"
                  onClick={() => onDismiss(finding.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
