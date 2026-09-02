/**
 * eposScraper — reads public data from the Kerala AePDS / ePOS portal
 * (epos.kerala.gov.in).
 *
 * The portal exposes public AJAX endpoints (no login) that return HTML
 * fragments. We parse them with Cheerio. All requests are made from the
 * Next.js server only, are rate-limited and cached.
 *
 * Public endpoints used:
 *  - POST afso_fps_details.action  (dist_code)          -> AFSO office list
 *  - POST fps_aso_details.action   (dist_code, office)  -> ration shop list
 *  - POST FPS_Status_Details.jsp   (fps_id)             -> ARD details + stock
 *  - POST fps_stock.action         (fps_id, month, year)-> stock register
 */

import { TTL, SOURCES } from "@/lib/constants";
import { cached, cacheStoredAt, cacheDelete } from "@/services/cache";
import { postFormText } from "@/services/http";
import { ScrapeError } from "@/services/errors";
import { districtByCode } from "@/services/data/districts";
import { parseOffices, parseRationShops, parseArdIdentity } from "@/services/scrapers/rationShopParser";
import { parseStockTable } from "@/services/scrapers/stockParser";
import type {
  Office,
  RationShop,
  StoreDetails,
  StockSnapshot,
} from "@/services/scrapers/types";

const BASE = SOURCES.epos;

function cacheKey(parts: string[]): string {
  return ["epos", ...parts].join(":");
}

/** List of AFSO offices (taluk level) for a district. Cached 24h. */
export async function getOffices(districtCode: string): Promise<Office[]> {
  const district = districtByCode(districtCode);
  if (!district) {
    throw new ScrapeError("INVALID_INPUT", `Unknown district code ${districtCode}`);
  }

  return cached<Office[]>(cacheKey(["offices", districtCode]), TTL.OFFICES, async () => {
    const html = await postFormText(`${BASE}/afso_fps_details.action`, {
      dist_code: districtCode,
    });
    const offices = parseOffices(html);
    if (offices.length === 0) {
      throw new ScrapeError(
        "PARSE_ERROR",
        "Office list returned no rows — ePOS layout may have changed",
        BASE
      );
    }
    return offices;
  });
}

/** Ration shops for one office. Cached 24h. */
export async function getShops(
  districtCode: string,
  officeCode: string,
  officeName?: string
): Promise<RationShop[]> {
  const district = districtByCode(districtCode);
  if (!district) {
    throw new ScrapeError("INVALID_INPUT", `Unknown district code ${districtCode}`);
  }

  const resolvedOfficeName = officeName ?? (await resolveOfficeName(districtCode, officeCode));

  return cached<RationShop[]>(
    cacheKey(["shops", districtCode, officeCode]),
    TTL.SHOPS,
    async () => {
      const html = await postFormText(`${BASE}/fps_aso_details.action`, {
        dist_code: districtCode,
        office_code: officeCode,
      });
      const shops = parseRationShops(html, districtCode, district.name, resolvedOfficeName);
      if (shops.length === 0) {
        throw new ScrapeError(
          "PARSE_ERROR",
          "Shop list returned no rows — ePOS layout may have changed",
          BASE
        );
      }
      return shops;
    }
  );
}

async function resolveOfficeName(districtCode: string, officeCode: string): Promise<string> {
  const offices = await getOffices(districtCode);
  return offices.find((o) => o.code === officeCode)?.name ?? `Office ${officeCode}`;
}
/**
 * Full store details for an ARD number: identity block + current-month stock.
 * Identity is cached 24h; stock is cached 30 minutes.
 */
export async function getStoreDetails(ardNumber: string): Promise<StoreDetails> {
  const identity = await cached(cacheKey(["identity", ardNumber]), TTL.STORE_DETAILS, async () => {
    const html = await postFormText(`${BASE}/FPS_Status_Details.jsp`, {
      fps_id: ardNumber,
    });
    const parsed = parseArdIdentity(html);
    if (!parsed) {
      throw new ScrapeError("NOT_FOUND", `No ARD details returned for ${ardNumber}`, BASE);
    }
    return parsed;
  });

  const stock = await getStock(ardNumber);

  // Best-effort join with the office listing to enrich the store card.
  let shopMetadata: RationShop | null = null;
  try {
    const districtCode = districtCodeOf(identity.district);
    if (districtCode) {
      const offices = await getOffices(districtCode);
      const office = offices.find((o) => o.name === identity.office);
      if (office) {
        const shops = await getShops(districtCode, office.code, office.name);
        shopMetadata = shops.find((s) => s.ardNumber === ardNumber) ?? null;
      }
    }
  } catch {
    shopMetadata = null; // enrichment is optional
  }

  return { identity, stock, shopMetadata };
}

/** Latest stock snapshot for an ARD (cached 30 min). */
export async function getStock(ardNumber: string): Promise<StockSnapshot> {
  const key = cacheKey(["stock", ardNumber]);
  return cached<StockSnapshot>(key, TTL.STOCK, async () => {
    const html = await postFormText(`${BASE}/FPS_Status_Details.jsp`, {
      fps_id: ardNumber,
    });
    const { commodities, month, year } = parseStockTable(html, ardNumber);
    return {
      ardNumber,
      month,
      year,
      commodities,
      fetchedAt: new Date().toISOString(),
      source: BASE,
    };
  });
}

/** Explicit month stock register via fps_stock.action. Cached 30 min. */
export async function getStockRegister(
  ardNumber: string,
  month: number,
  year: number
): Promise<StockSnapshot> {
  const key = cacheKey(["register", ardNumber, String(month), String(year)]);
  return cached<StockSnapshot>(key, TTL.STOCK, async () => {
    const html = await postFormText(`${BASE}/fps_stock.action`, {
      fps_id: ardNumber,
      month,
      year,
    });
    const { commodities, month: monthName, year: yearNum } = parseStockTable(html, ardNumber, {
      month,
      year,
    });
    return {
      ardNumber,
      month: monthName,
      year: yearNum,
      commodities,
      fetchedAt: new Date().toISOString(),
      source: BASE,
    };
  });
}

/** Force a fresh stock read for an ARD (used by the refresh server action). */
export async function refreshStock(ardNumber: string): Promise<StockSnapshot> {
  cacheDelete(cacheKey(["stock", ardNumber]));
  return getStock(ardNumber);
}

export function stockFetchedAt(ardNumber: string): number | undefined {
  return cacheStoredAt(cacheKey(["stock", ardNumber]));
}

/** Map an ePOS district display name to its district code. */
function districtCodeOf(districtName: string): string {
  const map: Record<string, string> = {
    Thiruvananthapuram: "11",
    Kollam: "12",
    Pathanamthitta: "13",
    Alappuzha: "14",
    Kottayam: "15",
    Idukki: "16",
    Ernakulam: "17",
    Thrissur: "18",
    Palakkad: "19",
    Malappuram: "20",
    Kozhikkodu: "21",
    Kozhikode: "21",
    Wayanad: "22",
    Kannur: "23",
    Kasargodu: "24",
    Kasaragod: "24",
  };
  const key = districtName.trim().replace(/\s+/g, "");
  return map[key] ?? "";
}