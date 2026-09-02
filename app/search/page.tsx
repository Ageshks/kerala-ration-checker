import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { searchByPincode, searchByRegion, searchSupplyco, searchByKeyword } from "@/services/search";
import { isValidArd, isValidPincode, ARD_INVALID_MSG, PINCODE_INVALID_MSG } from "@/services/search";
import { isScrapeError } from "@/services/errors";
import { OutletCard } from "@/components/shared/outlet-card";
import { ErrorState, EmptyState } from "@/components/shared/error-state";
import { ResultsToolbar } from "@/components/shared/results-toolbar";
import { SearchForm } from "@/components/shared/search-form";

export const metadata: Metadata = {
  title: "Search Results",
};

export const dynamic = "force-dynamic";
/** Serverless hosts: allow time for polite, cold scrapes of government servers. */
export const maxDuration = 60;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const type = first(params.type) || "pincode";
  const q = first(params.q);
  const district = first(params.district);
  const office = first(params.office);

  return (
    <div className="container-max py-8">
      <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Search Results</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live results from official Kerala Government and Supplyco public sources.
      </p>

      <div className="mt-6 max-w-3xl">
        <SearchForm />
      </div>

      <div className="mt-10">
        <Suspense fallback={<SearchFallback />}>
          <Results type={type} q={q} district={district} office={office} />
        </Suspense>
      </div>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-xl border bg-slate-100" />
      ))}
    </div>
  );
}

async function Results({
  type,
  q,
  district,
  office,
}: {
  type: string;
  q: string;
  district: string;
  office: string;
}) {
  // ARD lookups redirect to the store page. redirect() must stay OUTSIDE the
  // try/catch below: it works by throwing NEXT_REDIRECT, which our catch would
  // otherwise swallow and render as a search error.
  if (type === "ard") {
    if (!q) {
      return <ErrorState title="Missing ARD Number" message="Please enter an ARD number." />;
    }
    if (!isValidArd(q)) {
      return <ErrorState title="Invalid ARD Number" message={ARD_INVALID_MSG} />;
    }
    redirect(`/store/${q}`);
  }

  try {
    // --- Pincode lookup. ---
    if (type === "pincode") {
      if (!q) {
        return <ErrorState title="Missing Pincode" message="Please enter a pincode." />;
      }
      if (!isValidPincode(q)) {
        return <ErrorState title="Invalid Pincode" message={PINCODE_INVALID_MSG} />;
      }
      const { location, shops, office: matchedOffice, geoRadiusKm } = await searchByPincode(q);

      return (
        <div className="space-y-6">
          <LocationSummary
            title={`Ration shops near pincode ${location.pincode}`}
            meta={`${location.district}${matchedOffice ? ` / ${matchedOffice.name} taluk` : ""} · ${shops.length} shops found`}
            hint={
              geoRadiusKm
                ? `Shops within ≈ ${geoRadiusKm} km of your pincode's post offices (${location.postOfficeNames.join(", ")}), sorted nearest first`
                : `Post offices: ${location.postOfficeNames.join(", ")}`
            }
          />
          {shops.length === 0 ? (
            <EmptyState message="No ration shops could be matched in this area yet. Try searching by district or ARD number." />
          ) : (
            <ResultsToolbar shops={shops} showDistance />
          )}
        </div>
      );
    }

    // --- Region lookup ---
    if (type === "region") {
      if (!district && q) {
        // try to interpret q as an office/region name + optional district
        const byQ = await searchByRegionHint(q);
        if (!byQ) {
          return (
            <ErrorState title="Region not found" message="Please select a district and region." />
          );
        }
        return (
          <div className="space-y-6">
            <LocationSummary title={`Ration shops in ${byQ.officeName}`} meta={byQ.districtName} />
          {byQ.shops.length === 0 ? (
            <EmptyState message="No ration shops found for this region." />
          ) : (
            <ResultsToolbar shops={byQ.shops} />
          )}
          </div>
        );
      }
      if (!district) {
        return (
          <ErrorState title="Missing District" message="Please select a district to search." />
        );
      }

      const result = await searchByRegion(district, office || undefined);
      return (
        <div className="space-y-6">
          <LocationSummary
            title={`Ration shops in ${result.districtName}`}
            meta={`${result.office ? `Region: ${result.office.name}` : "Region selected"} · ${result.shops.length} shops found`}
          />
          {result.shops.length === 0 ? (
            <EmptyState message="No ration shops found for this region." />
          ) : (
            <ResultsToolbar shops={result.shops} />
          )}
        </div>
      );
    }

    // --- Name / keyword lookup across a district. ---
    if (type === "keyword") {
      if (!district) {
        return (
          <ErrorState
            title="Missing District"
            message="Please choose a district for the name / keyword search."
          />
        );
      }
      if (!q) {
        return (
          <ErrorState
            title="Missing Keyword"
            message="Enter a dealer name, place or ARD number to search."
          />
        );
      }
      const { districtName, shops, matchedArd } = await searchByKeyword(district, q);
      return (
        <div className="space-y-6">
          {matchedArd && (
            <div className="rounded-xl border-2 border-green-600 bg-green-50 p-5">
              <h2 className="text-lg font-bold text-green-900">
                ✅ Exact ARD match found: {matchedArd}
              </h2>
              <p className="mt-1 text-sm text-green-800">
                This ARD number is registered with Kerala Civil Supplies. Open the store to see
                its district, dealer and live stock details.
              </p>
              <a
                href={`/store/${matchedArd}`}
                className="mt-3 inline-block rounded-lg bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800"
              >
                Open store {matchedArd} →
              </a>
            </div>
          )}
          <LocationSummary
            title={`Shops matching “${q}” in ${districtName}`}
            meta={`${shops.length} ${shops.length === 1 ? "shop" : "shops"} found · searched by owner name, ARD, licence and taluk`}
          />
          {shops.length === 0 && !matchedArd ? (
            <EmptyState message={`No ration shops in ${districtName} matched “${q}”. Try another spelling, or search by pincode.`} />
          ) : shops.length === 0 ? null : (
            <ResultsToolbar shops={shops} />
          )}
        </div>
      );
    }

    // --- Supplyco outlet lookup ---
    if (type === "supplyco") {
      const outlets = await searchSupplyco({
        query: q,
        district: q,
        pincode: isValidPincode(q) ? q : undefined,
      });
      return (
        <div className="space-y-6">
          <LocationSummary
            title="Supplyco / Maveli Stores"
            meta={q ? `Matching “${q}”` : "All stores"}
          />
          {outlets.length === 0 ? (
            <EmptyState message="No Supplyco outlets matched your search. Try another name or district." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {outlets.map((o) => (
                <OutletCard key={o.outletId} outlet={o} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <ErrorState title="Unknown search type" message="Please use one of the search options." />
    );
  } catch (err) {
    if (isScrapeError(err)) {
      // For "not found" / "invalid input" the specific message (e.g.
      // "Pincode 110001 is not in Kerala (Central Delhi)") is more helpful
      // than the generic kind-based copy. All messages are server-authored.
      const specific =
        err.kind === "NOT_FOUND" || err.kind === "INVALID_INPUT" ? err.message : err.userMessage;
      return <ErrorState title="Search Error" message={specific} />;
    }
    return (
      <ErrorState
        title="Search Error"
        message="Unable to retrieve the latest ration availability information at the moment. Please try again later."
      />
    );
  }
}

async function searchByRegionHint(q: string) {
  // "district:18 region:Chalakkudy" or "district:18"
  const trimmed = q.trim();
  const match = trimmed.match(/^district:(\d{2})(?:\s+region:(.+))?$/i);
  if (match) {
    const districtCode = match[1];
    const officeName = match[2]?.trim();
    const result = await searchByRegion(districtCode, undefined, officeName);
    return {
      districtName: result.districtName,
      officeName: result.office?.name ?? result.districtName,
      shops: result.shops,
    };
  }
  return null;
}

function LocationSummary({ title, meta, hint }: { title: string; meta: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm font-medium text-blue-700">{meta}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

