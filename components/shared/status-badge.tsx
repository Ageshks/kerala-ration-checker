"use client";

import type { AvailabilityStatus } from "@/services/scrapers/types";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/shared/language-provider";

const STATUS_META: Record<
  AvailabilityStatus,
  { variant: "success" | "warning" | "destructive" | "muted"; dot: string; aria: string }
> = {
  available: { variant: "success", dot: "🟢", aria: "Available" },
  limited: { variant: "warning", dot: "🟡", aria: "Limited stock" },
  out: { variant: "destructive", dot: "🔴", aria: "Out of stock" },
  "no-data": { variant: "muted", dot: "⚪", aria: "No data" },
};

export function StatusBadge({ status }: { status: AvailabilityStatus }) {
  const { lang } = useLanguage();
  const meta = STATUS_META[status];
  const label =
    status === "available"
      ? t("available", lang)
      : status === "limited"
        ? t("limitedStock", lang)
        : status === "out"
          ? t("outOfStock", lang)
          : "No Data";

  return (
    <Badge variant={meta.variant} className="gap-1 text-sm">
      <span aria-hidden="true">{meta.dot}</span>
      <span aria-label={meta.aria}>{label}</span>
    </Badge>
  );
}