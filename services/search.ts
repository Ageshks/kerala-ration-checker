/**
 * search — orchestrates the different lookup paths against the official
 * sources. All functions run server-side only.
 *
 * Lookup paths:
 *  - searchByArd          -> store details for one ARD number
 *  - searchByPincode      -> pincode resolved via India Post API -> shops
 *  - searchByRegion       -> district + office (taluk/region) -> shops
 *  - searchSupplyco       -> Supplyco / Maveli outlet catalogue
 */

import { cached, cacheDelete } from "@/services/cache";
import { getJson } from "@/services/http";
import { ScrapeError, isScrapeError } from "@/services/errors";
import { TTL, SOURCES, PINCODE_RADIUS_KM } from "@/lib/constants";
import { normalize, levenshtein } from "@/lib/utils";
import { geocodePlace, haversineKm, type GeoPoint } from "@/services/geo";
import { districtByCode, districtByName, FALLBACK_OFFICES } from "@/services/data/districts";
import { getOffices, getShops, getStoreDetails } from "@/services/scrapers/eposScraper";
import { searchOutlets } from "@/services/scrapers/supplycoScraper";
import type {
  Office,
  PincodeLocation,
  RationShop,
  ShopWithRank,
  StoreDetails,
  SupplycoOutlet,
} from "@/services/scrapers/types";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export function isValidArd(value: string): boolean {
  return /^\d{7,8}$/.test(value.trim());
}

export function isValidPincode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

export const ARD_INVALID_MSG =
  "ARD Number must be 7 or 8 digits (e.g. 1875002).";
export const PINCODE_INVALID_MSG =
  "Pincode must be a 6-digit number (e.g. 680001).";

// ---------------------------------------------------------------------------
// Pincode -> location via the public India Post API
// ---------------------------------------------------------------------------

interface PostalResponse {
  Message?: string;
  Status?: string;
  PostOffice?: Array<{
    Name: string;
    District: string;
    Division: string;
    Block: string;
    Region: string;
    State: string;
    Pincode: string;
  }>;
}

export async function resolvePincode(pincode: string): Promise<PincodeLocation> {
  return cached<PincodeLocation>(`postal:pincode:${pincode}`, TTL.PINCODE, async () => {
    const res = await getJson<PostalResponse[]>(
      `${SOURCES.indiaPost}/pincode/${pincode}`,
      { timeoutMs: 10_000, retries: 1 }
    );

    const [first] = res ?? [];
    const offices = first?.PostOffice ?? [];
    if (first?.Status !== "Success" || offices.length === 0) {
      throw new ScrapeError(
        "NOT_FOUND",
        `India Post has no entry for pincode ${pincode}`
      );
    }

    return {
      pincode,
      postOfficeNames: [...new Set(offices.map((o) => o.Name))],
      district: offices[0].District,
      division: offices[0].Division,
      block: offices[0].Block,
      region: offices[0].Region,
    };
  });
}

// ---------------------------------------------------------------------------
// District / office resolution
// ---------------------------------------------------------------------------

function officesFor(districtCode: string): Promise<Office[]> {
  return getOffices(districtCode).catch(() => FALLBACK_OFFICES[districtCode] ?? []);
}

/**
 * Every ration shop in a district, merged across all its taluk offices and
 * deduplicated by ARD. Cached 24h — the first build walks every office (paced
 * by the polite rate limiter), later uses are instant. Shared by the keyword
 * search and the pincode radius filter.
 */
async function districtShopIndex(districtCode: string): Promise<RationShop[]> {
  return cached<RationShop[]>(`search:districtIndex:${districtCode}`, TTL.SHOPS, async () => {
    const offices = await officesFor(districtCode);
    const merged = new Map<string, RationShop>();
    for (const office of offices) {
      try {
        const list = await getShops(districtCode, office.code, office.name);
        for (const s of list) if (!merged.has(s.ardNumber)) merged.set(s.ardNumber, s);
      } catch {
        // Skip offices that fail; the rest still form a usable index.
      }
    }
    return [...merged.values()];
  });
}

/** Pick the best-matching office for a location string (taluk / block / post office). */
function bestMatchOffice(offices: Office[], hints: string[]): Office | null {
  if (offices.length === 0) return null;

  const normalizedHints = hints.map(normalize).filter(Boolean);
  if (normalizedHints.length === 0) return offices[0];

  let best: Office | null = null;
  let bestScore = -Infinity;

  for (const office of offices) {
    const officeNorm = normalize(office.name);
    for (const hint of normalizedHints) {
      if (officeNorm.includes(hint)) {
        const score = 1000 + hint.length; // exact containment wins
        if (score > bestScore) {
          bestScore = score;
          best = office;
        }
      }
    }
  }

  if (best) return best;

  // Fuzzy fallback: smallest edit distance against the first hint.
  let minDist = Infinity;
  for (const office of offices) {
    const d = levenshtein(normalize(office.name), normalizedHints[0]);
    if (d < minDist) {
      minDist = d;
      best = office;
    }
    if (d === 0) break;
  }
  return best !== null && minDist <= 3 ? best : offices[0];
}

// ---------------------------------------------------------------------------
// Lookup paths
// ---------------------------------------------------------------------------

/** Direct ARD lookup -> full store details. */
export async function searchByArd(ard: string): Promise<StoreDetails> {
  const clean = ard.trim();
  if (!isValidArd(clean)) {
    throw new ScrapeError("INVALID_INPUT", ARD_INVALID_MSG);
  }
  return getStoreDetails(clean);
}

/**
 * Geocode the pincode's post offices into distance-measuring anchors.
 * Server-side via Nominatim (cached 30 days, rate-limited). Strictly
 * best-effort: on failure the list is empty and proximity features turn off.
 */
async function geocodeAnchors(
  location: PincodeLocation,
  districtName: string
): Promise<{ name: string; point: GeoPoint }[]> {
  const anchorNames = location.postOfficeNames.slice(0, 5);
  const anchorPoints = await Promise.all(anchorNames.map((n) => geocodePlace(n, districtName)));
  const points: { name: string; point: GeoPoint }[] = [];
  anchorNames.forEach((name, i) => {
    const p = anchorPoints[i];
    if (p) points.push({ name, point: p });
  });
  return points;
}

/**
 * Annotate shops with their straight-line distance to the nearest anchor and
 * sort nearest-first. Shops without official coordinates keep their original
 * position (null distance sorts last, chips are hidden).
 */
function rankByProximity(
  shops: RationShop[],
  points: { name: string; point: GeoPoint }[]
): ShopWithRank[] {
  if (points.length === 0) return shops;
  if (!shops.some((s) => s.latitude !== null && s.longitude !== null)) return shops;

  return shops
    .map((shop): ShopWithRank => {
      if (shop.latitude === null || shop.longitude === null) {
        return { ...shop, distanceKm: null, nearestPostOffice: null };
      }
      let bestKm = Number.POSITIVE_INFINITY;
      let bestName: string | null = null;
      for (const { name, point } of points) {
        const km = haversineKm(shop.latitude, shop.longitude, point.lat, point.lng);
        if (km < bestKm) {
          bestKm = km;
          bestName = name;
        }
      }
      return { ...shop, distanceKm: bestKm, nearestPostOffice: bestName };
    })
    .sort(
      (a, b) =>
        (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
    );
}

/**
 * Pincode lookup -> ration shops near the pincode.
 *
 * Strategy: geocode the pincode's post offices (server-side), then keep every
 * shop in the district whose OFFICIAL coordinates lie within
 * PINCODE_RADIUS_KM of any of those post offices. This correctly handles
 * pincodes that straddle taluk borders without flooding the user with the
 * whole district, and needs no browser geolocation or map UI.
 *
 * If geocoding is unavailable, we degrade gracefully to the name-matched
 * taluk office only — never to an arbitrary set of offices.
 */
export async function searchByPincode(pincode: string): Promise<{
  location: PincodeLocation;
  shops: ShopWithRank[];
  office: Office | null;
  /** Straight-line radius actually applied, or null when geocoding failed. */
  geoRadiusKm: number | null;
}> {
  const clean = pincode.trim();
  if (!isValidPincode(clean)) {
    throw new ScrapeError("INVALID_INPUT", PINCODE_INVALID_MSG);
  }

  const location = await resolvePincode(clean);

  const district = districtByName(location.district);
  if (!district) {
    throw new ScrapeError(
      "NOT_FOUND",
      `Pincode ${clean} is not in Kerala (${location.district}).`
    );
  }

  const cacheKey = `search:pincode:${clean}`;
  return cached(cacheKey, TTL.SEARCH, async () => {
    const offices = await officesFor(district.code);
    const hints = [
      ...location.postOfficeNames,
      location.block,
      location.division,
      location.region,
    ].map((h) => h ?? "");
    const primary = bestMatchOffice(offices, hints);

    const anchors = await geocodeAnchors(location, district.name);
    if (anchors.length === 0) {
      // Geocoding unavailable: return only the name-matched taluk office.
      let fallback: RationShop[] = [];
      if (primary) {
        try {
          fallback = await getShops(district.code, primary.code, primary.name);
        } catch {
          fallback = [];
        }
      }
      return { location, shops: fallback, office: primary, geoRadiusKm: null };
    }

    // Keep shops inside the radius around any post office. Shops that lack
    // official coordinates are kept only when they belong to the name-matched
    // taluk office, so they are never silently lost.
    const index = await districtShopIndex(district.code);
    const radius = PINCODE_RADIUS_KM;
    const near = index.filter((s) => {
      if (s.latitude === null || s.longitude === null) {
        return primary !== null && s.officeCode === primary.code;
      }
      return anchors.some(({ point }) => haversineKm(s.latitude!, s.longitude!, point.lat, point.lng) <= radius);
    });

    const shops = rankByProximity(near, anchors);
    return { location, shops, office: primary, geoRadiusKm: radius };
  });
}

/**
 * Keyword lookup across a whole district: matches dealer/owner name, ARD
 * number, licence number or taluk/office name. ARD-shaped queries are
 * validated against the store lookup and returned via `matchedArd` so the UI
 * can jump straight to the store page.
 *
 * The merged district shop index is cached for 24h; the first search in a
 * district walks every taluk office (paced by the polite rate limiter), so it
 * can take a while — later searches are instant.
 */
export async function searchByKeyword(
  districtCode: string,
  query: string
): Promise<{ districtName: string; shops: ShopWithRank[]; matchedArd: string | null }> {
  const district = districtByCode(districtCode);
  if (!district) {
    throw new ScrapeError("INVALID_INPUT", `Unknown district code "${districtCode}".`);
  }
  const q = query.trim();
  if (q.length < 2) {
    throw new ScrapeError("INVALID_INPUT", "Please enter at least 2 characters to search.");
  }

  if (isValidArd(q)) {
    try {
      await getStoreDetails(q); // confirm the ARD exists before redirecting
      return { districtName: district.name, shops: [], matchedArd: q };
    } catch (err) {
      if (!isScrapeError(err) || err.kind !== "NOT_FOUND") throw err;
      // Unknown ARD — fall through to the keyword search below.
    }
  }

  const index = await districtShopIndex(district.code);

  const nq = normalize(q);
  const isExact = (s: RationShop) =>
    normalize(s.ardNumber) === nq ||
    normalize(s.ownerName) === nq ||
    normalize(s.licenseNumber) === nq;
  const matches = index.filter(
    (s) =>
      isExact(s) ||
      normalize(s.ownerName).includes(nq) ||
      normalize(s.ardNumber).includes(nq) ||
      normalize(s.licenseNumber).includes(nq) ||
      normalize(s.officeName).includes(nq) ||
      normalize(s.districtName).includes(nq)
  );
  matches.sort((a, b) => {
    const ea = isExact(a) ? 0 : 1;
    const eb = isExact(b) ? 0 : 1;
    if (ea !== eb) return ea - eb;
    return b.totalCards - a.totalCards;
  });

  return { districtName: district.name, shops: matches, matchedArd: null };
}

/** Region lookup (district + taluk/office) -> ration shops. */
export async function searchByRegion(
  districtCode: string,
  officeCode?: string,
  officeName?: string
): Promise<{
  districtName: string;
  offices: Office[];
  office: Office | null;
  shops: RationShop[];
}> {
  const district = districtByCode(districtCode);
  if (!district) {
    throw new ScrapeError("INVALID_INPUT", `Unknown district code "${districtCode}".`);
  }

  const offices = await officesFor(districtCode);
  if (officeCode) {
    const office = offices.find((o) => o.code === officeCode) ?? null;
    if (!office) {
      throw new ScrapeError("NOT_FOUND", `Office ${officeCode} not found in ${district.name}.`);
    }
    const shops = await getShops(districtCode, office.code, office.name);
    return { districtName: district.name, offices, office, shops };
  }

  if (officeName) {
    const office = bestMatchOffice(offices, [officeName]);
    if (!office) {
      throw new ScrapeError("NOT_FOUND", `Region "${officeName}" not found in ${district.name}.`);
    }
    const shops = await getShops(districtCode, office.code, office.name);
    return { districtName: district.name, offices, office, shops };
  }

  // District-level search: pick the first office to keep the request count low.
  const office = offices[0] ?? null;
  const shops = office ? await getShops(districtCode, office.code, office.name) : [];
  return { districtName: district.name, offices, office, shops };
}

/** Supplyco outlet search. */
export async function searchSupplyco(input: {
  query?: string;
  district?: string;
  pincode?: string;
}): Promise<SupplycoOutlet[]> {
  return searchOutlets(input);
}

/** Invalidate a cached ARD stock entry (used by the refresh action). */
export function invalidateArdStock(ard: string): void {
  cacheDelete(`epos:stock:${ard}`);
  cacheDelete(`epos:register:${ard}`);
}