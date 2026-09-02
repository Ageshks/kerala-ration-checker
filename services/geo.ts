/**
 * geo — tiny server-side geocoding helper.
 *
 * Uses the public OpenStreetMap Nominatim API to resolve place names (e.g.
 * the post offices belonging to a pincode) to coordinates. Results are cached
 * for 30 days and requests are politely rate-limited (1 req/s per their usage
 * policy). Geocoding is strictly best-effort: on any failure it returns null
 * and search results simply keep their original order. The browser never
 * talks to Nominatim directly.
 */

import { SOURCES, TTL } from "@/lib/constants";
import { cached } from "@/services/cache";
import { getJson } from "@/services/http";
import { normalize } from "@/lib/utils";

export interface GeoPoint {
  lat: number;
  lng: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/** Geocode a place name within a Kerala district. Cached 30 days. */
export async function geocodePlace(name: string, district: string): Promise<GeoPoint | null> {
  const key = `geo:${normalize(name)}:${normalize(district)}`;
  return cached<GeoPoint | null>(key, TTL.GEO, async () => {
    try {
      const q = encodeURIComponent(`${name}, ${district}, Kerala, India`);
      const res = await getJson<NominatimResult[]>(
        `${SOURCES.nominatim}/search?q=${q}&format=jsonv2&limit=1&countrycodes=in`,
        { timeoutMs: 10_000, retries: 0 }
      );
      const first = res?.[0];
      if (!first) return null;
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    } catch {
      return null; // best effort — proximity ranking simply stays off
    }
  });
}

/** Great-circle distance between two coordinates in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
