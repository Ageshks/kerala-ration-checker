"use server";

/**
 * Server Action: force-fetch the latest stock snapshot for an ARD number.
 * Browsers never call the upstream sites — they only invoke this action, which
 * runs entirely on the Next.js server through the scraper layer.
 */

import { revalidatePath } from "next/cache";
import { refreshStock } from "@/services/scrapers/eposScraper";
import { buildAvailability } from "@/lib/availability";
import { ScrapeError, isScrapeError } from "@/services/errors";
import { isValidArd } from "@/services/search";
import type { AvailabilityResult } from "@/services/scrapers/types";

export type RefreshAvailabilityResult =
  | { ok: true; data: AvailabilityResult }
  | { ok: false; error: string };

export async function refreshAvailability(
  ardNumber: string
): Promise<RefreshAvailabilityResult> {
  try {
    if (!isValidArd(ardNumber)) {
      return {
        ok: false,
        error: "ARD Number must be 7 or 8 digits (e.g. 1875002).",
      };
    }

    const fresh = await refreshStock(ardNumber);
    revalidatePath(`/store/${ardNumber}/availability`);
    return { ok: true, data: buildAvailability(fresh) };
  } catch (err) {
    revalidatePath(`/store/${ardNumber}/availability`);
    if (isScrapeError(err)) {
      return { ok: false, error: err.userMessage };
    }
    if (err instanceof ScrapeError) {
      return { ok: false, error: err.userMessage };
    }
    return {
      ok: false,
      error:
        "Unable to retrieve the latest ration availability information at the moment. Please try again later.",
    };
  }
}