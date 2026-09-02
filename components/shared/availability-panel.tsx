"use client";

import { useState, useTransition } from "react";
import { refreshAvailability, type RefreshAvailabilityResult } from "@/app/actions/availability";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/shared/language-provider";
import type { AvailabilityResult } from "@/services/scrapers/types";

function formatQuantity(qty: number, unit: string): string {
  const n = Number.isFinite(qty) ? qty : 0;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
}

export function AvailabilityPanel({
  initial,
  ardNumber,
}: {
  initial: AvailabilityResult;
  ardNumber: string;
}) {
  const { lang } = useLanguage();
  const [data, setData] = useState<AvailabilityResult>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onRefresh() {
    setError(null);
    startTransition(async () => {
      const res: RefreshAvailabilityResult = await refreshAvailability(ardNumber);
      if (res.ok) {
        setData(res.data);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("lastUpdated", lang)}:{" "}
          <span className="font-semibold text-slate-800">
            {new Date(data.fetchedAt).toLocaleString(lang === "ml" ? "ml-IN" : "en-IN")}
          </span>
          <span className="ml-2">
            · {data.month} {data.year}
          </span>
        </p>
        <Button onClick={onRefresh} disabled={isPending} size="lg">
          {isPending ? t("refreshing", lang) : t("refresh", lang)}
        </Button>
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
          No stock register published for this shop yet. Stock figures appear once the
          government publishes the current month register.
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border bg-white">
          {data.items.map((item) => (
            <li key={item.commodity} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <StatusBadge status={item.status} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{item.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("quantity", lang)}:{" "}
                    {formatQuantity(item.quantity, item.unit)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Threshold: {formatQuantity(item.threshold, item.unit)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}