/**
 * Availability classification: converts raw stock quantities from the ePOS
 * stock register into user-friendly statuses.
 *
 *  - quantity === 0                      -> Out of Stock
 *  - 0 < quantity < commodity threshold  -> Limited Stock
 *  - quantity >= commodity threshold     -> Available
 */

import { COMMODITY_ALIASES, STOCK_THRESHOLDS } from "@/lib/constants";
import type {
  AvailabilityItem,
  AvailabilityResult,
  AvailabilityStatus,
  CommodityStock,
  StockSnapshot,
} from "@/services/scrapers/types";

function normalizeCommodity(name: string): string {
  return name.trim().toLowerCase();
}

export function commodityThreshold(commodity: string): number {
  const key = normalizeCommodity(commodity);
  return STOCK_THRESHOLDS[key] ?? STOCK_THRESHOLDS.default ?? 50;
}

export function commodityDisplayName(commodity: string): string {
  const key = normalizeCommodity(commodity);
  return COMMODITY_ALIASES[key] ?? commodity;
}

export function classifyAvailability(quantity: number, commodity: string): AvailabilityStatus {
  if (!Number.isFinite(quantity) || quantity <= 0) return "out";
  return quantity >= commodityThreshold(commodity) ? "available" : "limited";
}

export function parseAvailabilityRow(row: CommodityStock): AvailabilityItem {
  // Upstream registers occasionally contain small negative balances (data
  // entry artifacts). Stock on hand can never be negative, so clamp to 0.
  const quantity = Math.max(0, row.closingBalance);
  return {
    commodity: row.commodity,
    displayName: commodityDisplayName(row.commodity),
    unit: row.unit || "Kgs",
    quantity,
    threshold: commodityThreshold(row.commodity),
    status: classifyAvailability(quantity, row.commodity),
  };
}

/** Build a friendly availability result from a raw stock snapshot. */
export function buildAvailability(snapshot: StockSnapshot): AvailabilityResult {
  const items = snapshot.commodities.map(parseAvailabilityRow);
  return {
    ardNumber: snapshot.ardNumber,
    month: snapshot.month,
    year: snapshot.year,
    fetchedAt: snapshot.fetchedAt,
    items,
  };
}