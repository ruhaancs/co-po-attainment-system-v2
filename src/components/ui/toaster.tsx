"use client";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 p-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full items-start justify-between gap-2 rounded-lg border p-4 shadow-lg backdrop-blur-md",
            t.variant === "destructive" && "border-destructive/50 bg-destructive/15 text-destructive",
            t.variant === "success" && "border-green-500/50 bg-green-500/15 text-green-100",
            t.variant === "default" && "border-border bg-card/95"
          )}
        >
          <div className="grid gap-1">
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && (
              <p className="text-sm opacity-90">{t.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
