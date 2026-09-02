import * as cheerio from "cheerio";
import type { CommodityStock } from "@/services/scrapers/types";

function text(el: cheerio.Cheerio<any>): string {
  return el.text().replace(/\s+/g, " ").trim();
}

function toFloat(value: string): number {
  const n = parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function extractReferencePeriod(title: string): { month: string; year: number } {
  // Pattern 1: "for September-2026"
  let m = title.match(/for\s+([A-Za-z]+)[-'\u2019]?\s*(\d{4})/);
  if (m) {
    const monthName = m[1].charAt(0).toUpperCase() + m[1].slice(1);
    const monthIndex = MONTHS.findIndex((x) => x === monthName);
    if (monthIndex >= 0) return { month: monthName, year: parseInt(m[2], 10) };
  }
  // Pattern 2: "for August'2026"
  m = title.match(/([A-Za-z]+)['\u2019]\s?(\d{4})/);
  if (m) {
    const monthName = m[1].charAt(0).toUpperCase() + m[1].slice(1);
    const monthIndex = MONTHS.findIndex((x) => x === monthName);
    if (monthIndex >= 0) return { month: monthName, year: parseInt(m[2], 10) };
  }

  const now = new Date();
  return { month: MONTHS[now.getMonth()], year: now.getFullYear() };
}

/**
 * Parse a commodity stock table. Works for the full FPS_Status_Details.jsp
 * document (which contains several tables) and for the fps_stock.action
 * fragment. Both share the stock-register column layout:
 *   Sl.No | Commodity | Units | Alloted (Reg, Extra) | OB |
 *   Received (Reg, Extra, Moved) | Issued | CB        (11 cells per data row)
 *
 * The portal page also contains other tables with their own "Sl.No" headers
 * (Key Register Details, Allotment Details), so the stock table is identified
 * per-table and preferably by its title row ("ARD Stock Details <ard> for
 * <Month>-<Year>").
 */
export function parseStockTable(
  html: string,
  ardNumber: string,
  fallbackPeriod?: { month: number; year: number }
): { commodities: CommodityStock[]; month: string; year: number } {
  const $ = cheerio.load(html);

  interface Candidate {
    title: string;
    commodities: CommodityStock[];
    stockTitled: boolean;
  }
  const candidates: Candidate[] = [];

  $("table").each((_, tableEl) => {
    const rows = $(tableEl).find("tr");
    if (rows.length === 0) return;

    // Locate the header row of THIS table (first cell exactly "Sl.No").
    let headerIdx = -1;
    rows.each((i, rowEl) => {
      if (headerIdx >= 0) return false; // stop scanning
      const cells = $(rowEl).find("td, th");
      if (cells.length >= 5 && text(cells.eq(0)) === "Sl.No") {
        headerIdx = i;
      }
      return true;
    });
    if (headerIdx < 0) return;

    // Title row sits directly above the header on the portal layout.
    const title = headerIdx > 0 ? text($(rows.eq(headerIdx - 1))) : "";
    const stockTitled = /stock\s*details/i.test(title);

    const parsed: CommodityStock[] = [];
    rows.slice(headerIdx + 1).each((_, rowEl) => {
      const cells = $(rowEl).find("td");
      if (cells.length < 11) return; // skips grouped sub-header rows (5 cells) etc.
      const slNo = text(cells.eq(0));
      const commodity = text(cells.eq(1));
      if (!/^\d+$/.test(slNo) || !commodity || /^\d+(\.\d+)?$/.test(commodity)) return;
      parsed.push({
        commodity,
        unit: text(cells.eq(2)),
        allottedRegular: toFloat(text(cells.eq(3))),
        allottedExtra: toFloat(text(cells.eq(4))),
        openingBalance: toFloat(text(cells.eq(5))),
        receivedRegular: toFloat(text(cells.eq(6))),
        receivedExtra: toFloat(text(cells.eq(7))),
        receivedMoved: toFloat(text(cells.eq(8))),
        issued: toFloat(text(cells.eq(9))),
        closingBalance: toFloat(text(cells.eq(10))),
      });
    });

    if (parsed.length > 0) candidates.push({ title, commodities: parsed, stockTitled });
  });

  // Prefer the "ARD Stock Details ..." table; otherwise the richest table.
  const best = candidates.reduce<Candidate | null>((acc, c) => {
    if (!acc) return c;
    if (c.stockTitled && !acc.stockTitled) return c;
    if (c.stockTitled === acc.stockTitled && c.commodities.length > acc.commodities.length) {
      return c;
    }
    return acc;
  }, null);

  const period = best ? extractReferencePeriod(best.title) : null;
  const now = new Date();
  return {
    commodities: best?.commodities ?? [],
    month:
      period?.month ??
      (fallbackPeriod ? MONTHS[fallbackPeriod.month - 1] : undefined) ??
      MONTHS[now.getMonth()],
    year:
      period?.year ?? fallbackPeriod?.year ?? now.getFullYear(),
  };
}

export { extractReferencePeriod };