import { NextRequest, NextResponse } from "next/server";
import { getOffices } from "@/services/scrapers/eposScraper";
import { isScrapeError } from "@/services/errors";

/** Serverless hosts: allow time for a cold office-list fetch. */
export const maxDuration = 60;

/**
 * Server-side proxy: returns the AFSO office list for a district.
 * The browser never talks to epos.kerala.gov.in — it only reads this route.
 */
export async function GET(request: NextRequest) {
  const district = request.nextUrl.searchParams.get("district");

  if (!district || !/^\d{2}$/.test(district)) {
    return NextResponse.json({ error: "Invalid district code" }, { status: 400 });
  }

  try {
    const offices = await getOffices(district);
    return NextResponse.json({
      offices: offices.map((o) => ({
        code: o.code,
        name: o.name,
        shops: o.totalShops,
      })),
    });
  } catch (err) {
    if (isScrapeError(err)) {
      return NextResponse.json({ error: err.userMessage }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Unable to retrieve regions at the moment. Please try again later." },
      { status: 502 }
    );
  }
}