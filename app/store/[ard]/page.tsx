import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidArd, ARD_INVALID_MSG, nearestSupplycoContact, type OfficialStoreContact } from "@/services/search";
import { getStoreDetails } from "@/services/scrapers/eposScraper";
import { isScrapeError } from "@/services/errors";
import { ErrorState } from "@/components/shared/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HELPLINE_PHONE, HELPLINE_TEL, CIVIL_SUPPLIES_CONTACT, SOURCES } from "@/lib/constants";

export const dynamic = "force-dynamic";
/** Serverless hosts: allow time for polite, cold scrapes of government servers. */
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ ard: string }> }): Promise<Metadata> {
  const { ard } = await params;
  return {
    title: `Ration Store ${ard}`,
    description: `Government ration store details and stock availability for ARD ${ard}.`,
  };
}

export default async function StorePage({ params }: { params: Promise<{ ard: string }> }) {
  const { ard } = await params;

  if (!isValidArd(ard)) {
    return (
      <div className="container-max py-10">
        <ErrorState title="Invalid ARD Number" message={ARD_INVALID_MSG} />
      </div>
    );
  }

  let details;
  try {
    details = await getStoreDetails(ard);
  } catch (err) {
    if (isScrapeError(err)) {
      return (
        <div className="container-max py-10">
          <ErrorState
            title="Store information unavailable"
            message={err.userMessage}
            href="/search"
            linkLabel="Try another search"
          />
        </div>
      );
    }
    notFound();
  }

  const { identity } = details;

  // Dialable official contact fallback (nearest Supplyco outlet) — best-effort.
  const supplycoContact = await nearestSupplycoContact(
    identity.district,
    details.shopMetadata?.latitude ?? null,
    details.shopMetadata?.longitude ?? null
  );

  return (
    <div className="container-max py-8">
      <Link href="/search" className="text-sm font-medium text-blue-700 hover:underline">
        ← Back to Search
      </Link>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <span aria-hidden="true">🏪</span>
              Government Ration Shop
            </CardTitle>
            <Badge variant={identity.status === "Active" ? "success" : "muted"} className="text-sm">
              {identity.status}
            </Badge>
          </div>
          <p className="font-mono text-lg font-bold text-blue-800">ARD: {identity.ardNumber}</p>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <DetailList
            ownerName={details.shopMetadata?.ownerName}
            licenseNumber={details.shopMetadata?.licenseNumber}
            totalCards={details.shopMetadata?.totalCards}
            identity={identity}
          />

          <ContactBlock
            ardNumber={identity.ardNumber}
            mobileMasked={details.shopMetadata?.mobileMasked}
            lat={details.shopMetadata?.latitude}
            lng={details.shopMetadata?.longitude}
            supplycoContact={supplycoContact}
          />
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/store/${ard}/availability`} className={buttonVariants({ size: "xl" })}>
          📦 Check Availability
        </Link>
        <a href={`tel:${HELPLINE_TEL}`} className={buttonVariants({ size: "xl", variant: "success" })}>
          📞 Call Now
        </a>
        <a
          href="https://epos.kerala.gov.in/FPS_Status.jsp"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "xl", variant: "outline" })}
        >
          Official ePOS Page ↗
        </a>
      </div>

      <Separator className="my-8" />
    </div>
  );
}

function DetailList({
  ownerName,
  licenseNumber,
  totalCards,
  identity,
}: {
  ownerName?: string;
  licenseNumber?: string;
  totalCards?: number;
  identity: import("@/services/scrapers/types").ArdIdentity;
}) {
  return (
    <dl className="space-y-2 text-sm">
      {ownerName && <DetailRow label="Store Owner / Dealer" value={ownerName} />}
      <DetailRow label="District" value={identity.district} />
      <DetailRow label="Taluk / Region (Office)" value={identity.office} />
      {licenseNumber && <DetailRow label="License Number" value={licenseNumber} />}
      {totalCards !== undefined && totalCards > 0 && (
        <DetailRow label="Ration Cards" value={totalCards.toLocaleString()} />
      )}
      {identity.deviceId && <DetailRow label="ePOS Device Id" value={identity.deviceId} />}
      {identity.nominee1 && <DetailRow label="Nominee 1" value={identity.nominee1} />}
      {identity.nominee2 && <DetailRow label="Nominee 2" value={identity.nominee2} />}
    </dl>
  );
}

function ContactBlock({
  ardNumber,
  mobileMasked,
  lat,
  lng,
  supplycoContact,
}: {
  ardNumber: string;
  mobileMasked?: string | null;
  lat?: number | null;
  lng?: number | null;
  supplycoContact?: OfficialStoreContact | null;
}) {
  const mapsHref =
    lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <div id="contact" className="scroll-mt-20 space-y-3">
      {mobileMasked && (
        <p className="text-sm">
          <span className="font-medium">Mobile Number:</span> {mobileMasked}{" "}
          <span className="text-xs text-muted-foreground">
            (public portal masks the middle digits)
          </span>
        </p>
      )}
      {mapsHref && (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
        >
          📍 View on Google Maps
        </a>
      )}
      {lat != null && (
        <p className="text-xs text-muted-foreground">
          Coordinates: {lat.toFixed(6)}, {lng != null ? lng.toFixed(6) : "—"}
        </p>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Contact Ration Store</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Store Number (ARD):{" "}
          <span className="font-mono font-medium text-slate-900">{ardNumber}</span>
        </p>
        {supplycoContact ? (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-semibold text-green-900">
              Nearest official Supplyco contact
              {typeof supplycoContact.distanceKm === "number" && (
                <span className="ml-1 font-normal text-green-700">
                  · ≈ {supplycoContact.distanceKm} km away
                </span>
              )}
            </p>
            <p className="text-sm text-green-800">
              {supplycoContact.name}
              {supplycoContact.taluk ? `, ${supplycoContact.taluk}` : ""} ·{" "}
              {supplycoContact.districtName}
            </p>
            <a
              href={supplycoContact.telHref}
              className={`${buttonVariants({ size: "lg", variant: "success" })} mt-2 w-full sm:w-auto`}
            >
              📞 Call {supplycoContact.phone}
            </a>
          </div>
        ) : (
          <p className="mt-2 text-sm">
            The individual shop number is masked on the public portal — use the official
            helpline below.
          </p>
        )}
        <p className="mt-2 rounded-lg bg-blue-50 p-3">
          <span className="font-semibold text-blue-900">Civil Supplies Helpline</span>
          <br />
          <a className="text-lg font-bold text-blue-700 hover:underline" href={`tel:${HELPLINE_TEL}`}>
            {HELPLINE_PHONE}
          </a>
          <span className="ml-2 text-xs text-muted-foreground">(Toll free 1967)</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {CIVIL_SUPPLIES_CONTACT} · {SOURCES.epos}
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}