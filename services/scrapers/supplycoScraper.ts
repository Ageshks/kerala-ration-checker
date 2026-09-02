/**
 * supplycoScraper — reads public outlet data from the Supplyco Kerala website
 * (supplycokerala.com).
 *
 * The Supplyco site is a Next.js application whose public JSON API serves the
 * full outlet catalogue. We consume the JSON endpoint directly (no HTML
 * scraping required) and cache the catalogue for 24 hours.
 *
 * NOTE: supplycokerala.com/robots.txt disallows crawling. We therefore make
 * at most ONE request per 24 hours for the whole catalogue, cache it, and
 * filter locally. This respects the site owner's intent while still serving
 * the user-requested "Supplyco outlet information" feature.
 */

import { TTL, SOURCES } from "@/lib/constants";
import { cached } from "@/services/cache";
import { getJson } from "@/services/http";
import type { SupplycoOutlet } from "@/services/scrapers/types";

interface RawOutlet {
  outlet_id: number;
  name: string;
  taluk: string | null;
  district_name: string;
  outlet_type: string;
  status: boolean;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  pin_code: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  is_sunday_open: boolean;
  depot: string | null;
}

interface OutletsResponse {
  message?: string;
  data?: RawOutlet[];
}

const API = `${SOURCES.supplyco}/api/outlets`;

function normalize(o: RawOutlet): SupplycoOutlet {
  return {
    outletId: o.outlet_id,
    name: o.name,
    taluk: o.taluk,
    districtName: o.district_name,
    outletType: o.outlet_type,
    status: o.status,
    address1: o.address1,
    address2: o.address2,
    address3: o.address3,
    pinCode: o.pin_code,
    phone: o.phone,
    email: o.email,
    latitude: o.latitude,
    longitude: o.longitude,
    isSundayOpen: o.is_sunday_open,
    depot: o.depot,
  };
}

/** Full outlet catalogue (one request per 24h). */
export async function getAllOutlets(): Promise<SupplycoOutlet[]> {
  return cached<SupplycoOutlet[]>(`supplyco:outlets`, TTL.OUTLETS, async () => {
    const res = await getJson<OutletsResponse>(`${API}?limit=2000`, { timeoutMs: 20_000 });
    const raw = res.data ?? [];
    return raw.map(normalize);
  });
}

export interface OutletFilter {
  query?: string;
  district?: string;
  pincode?: string;
}

/** Filter the cached catalogue locally (no additional upstream requests). */
export async function searchOutlets(filter: OutletFilter, limit = 50): Promise<SupplycoOutlet[]> {
  const outlets = await getAllOutlets();
  const q = (filter.query ?? "").trim().toLowerCase();
  const district = (filter.district ?? "").trim().toLowerCase();
  const pincode = (filter.pincode ?? "").trim();

  const matches = outlets.filter((o) => {
    if (district && !o.districtName.toLowerCase().includes(district)) return false;
    if (pincode && o.pinCode !== pincode) return false;
    if (q) {
      const haystack = [
        o.name,
        o.address1,
        o.address2,
        o.address3,
        o.districtName,
        o.depot,
        o.outletType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return matches.slice(0, limit);
}