/**
 * Global constants: cache TTLs, availability thresholds and official
 * contact numbers. Keep thresholds small-friendly and clearly labelled.
 */

// ---------------------------------------------------------------------------
// Cache TTLs (milliseconds) — see /services/cache.ts for the memory cache.
// ---------------------------------------------------------------------------
export const TTL = {
  /** Ration store detail lookups (ARD -> store). Refresh daily. */
  STORE_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
  /** Live stock figures. Refresh every 30 minutes. */
  STOCK: 30 * 60 * 1000, // 30 minutes
  /** List of AFSO offices (taluk level) per district. Refresh daily. */
  OFFICES: 24 * 60 * 60 * 1000,
  /** List of ration shops per office. Refresh daily. */
  SHOPS: 24 * 60 * 60 * 1000,
  /** Supplyco outlet catalogue. Refresh daily. */
  OUTLETS: 24 * 60 * 60 * 1000,
  /** Pincode -> location resolution via India Post API. */
  PINCODE: 60 * 60 * 1000, // 1 hour
  /** Generic search results. */
  SEARCH: 60 * 60 * 1000, // 1 hour
  /** Geocoded place coordinates (post offices don't move). */
  GEO: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// ---------------------------------------------------------------------------
// Availability thresholds (in the quantity units used by the ePOS portal).
// A commodity with quantity >= its threshold is "Available"; > 0 but below
// the threshold is "Limited Stock"; quantity 0 is "Out of Stock".
// ---------------------------------------------------------------------------
export const STOCK_THRESHOLDS: Record<string, number> = {
  rice: 250,
  "raw rice": 250,
  "boiled rice": 250,
  "matta rice": 250,
  "free rr": 250,
  "free br": 250,
  "pmgkay wheat": 250,
  "pmgkay rr": 250,
  wheat: 150,
  atta: 100,
  sugar: 50,
  koil: 25,
  kerosene: 25,
  "flood koil": 25,
  ragi: 25,
  "ragi powder": 25,
  "red gram dal": 50,
  "toor dal": 50,
  "palm oil": 50,
  default: 50,
};

/** Longer TTL for the cache keys that hold commodity metadata. */
export const COMMODITY_ALIASES: Record<string, string> = {
  "raw rice": "Rice (Raw)",
  "boiled rice": "Rice (Boiled)",
  "matta rice": "Rice (Matta)",
  "free rr": "Rice (Free RR)",
  "free br": "Rice (Free BR)",
  "pmgkay wheat": "Wheat (PMGKAY)",
  "pmgkay rr": "Rice (PMGKAY RR)",
  koil: "Kerosene (Koil)",
  "flood koil": "Kerosene (Flood)",
  atta: "Atta",
  sugar: "Sugar",
  wheat: "Wheat",
  ragi: "Ragi",
  "ragi powder": "Ragi Powder",
  "red gram dal": "Red Gram Dal",
  "toor dal": "Toor Dal",
  "palm oil": "Palm Oil",
};

// ---------------------------------------------------------------------------
// Official contact numbers (Kerala Civil Supplies).
// ---------------------------------------------------------------------------
export const HELPLINE_PHONE = "1800-425-1550";
export const HELPLINE_TEL = "18004251550";
export const TOLL_FREE = "1967";
export const CIVIL_SUPPLIES_CONTACT = "Commissionerate of Civil Supplies, Public Office Complex, Museum PO, Thiruvananthapuram";

// ---------------------------------------------------------------------------
// Official data sources.
// ---------------------------------------------------------------------------
export const SOURCES = {
  epos: "https://epos.kerala.gov.in",
  supplyco: "https://www.supplycokerala.com",
  indiaPost: "https://api.postalpincode.in",
  /** OpenStreetMap Nominatim — used to locate pincode post offices (server-side only). */
  nominatim: "https://nominatim.openstreetmap.org",
} as const;

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 KeralaRationChecker/1.0";

export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Pincode searches include every ration shop whose official coordinates lie
 * within this straight-line distance of any of the pincode's post offices.
 * Covers pincode areas that straddle taluk borders without pulling in the
 * whole district.
 */
export const PINCODE_RADIUS_KM = 8;

// ---------------------------------------------------------------------------
// Rate limiting policy — politeness towards government servers.
// ---------------------------------------------------------------------------
export const RATE_LIMITS: Record<string, { minIntervalMs: number; maxPerMinute: number }> = {
  "epos.kerala.gov.in": { minIntervalMs: 1200, maxPerMinute: 25 },
  "supplycokerala.com": { minIntervalMs: 2500, maxPerMinute: 15 },
  "api.postalpincode.in": { minIntervalMs: 400, maxPerMinute: 60 },
  "nominatim.openstreetmap.org": { minIntervalMs: 1100, maxPerMinute: 40 },
};