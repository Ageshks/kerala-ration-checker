import Link from "next/link";
import type { ShopWithRank } from "@/services/scrapers/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function mapsUrl(shop: ShopWithRank): string | null {
  if (shop.latitude === null || shop.longitude === null) return null;
  return `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`;
}

function distanceLabel(shop: ShopWithRank): string | null {
  if (typeof shop.distanceKm !== "number" || !shop.nearestPostOffice) return null;
  const km = shop.distanceKm < 10 ? shop.distanceKm.toFixed(1) : String(Math.round(shop.distanceKm));
  return `≈ ${km} km from ${shop.nearestPostOffice}`;
}

export function ShopCard({ shop }: { shop: ShopWithRank }) {
  const address = mapsUrl(shop);
  const distance = distanceLabel(shop);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span aria-hidden="true">🏪</span>
            Government Ration Shop
          </CardTitle>
          <Badge variant={shop.status === "Active" ? "success" : "muted"}>
            {shop.status === "Active" ? "Active" : shop.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">ARD Number: {shop.ardNumber}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-1.5 text-sm">
        <p>
          <span className="font-medium">Location:</span>{" "}
          {shop.districtName}
          {shop.officeName ? ` / ${shop.officeName}` : ""}
        </p>
        {distance && (
          <p className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <span aria-hidden="true">📍</span> {distance}
          </p>
        )}
        <p>
          <span className="font-medium">Owner:</span> {shop.ownerName || "—"}
        </p>
        <p>
          <span className="font-medium">Cards:</span> {shop.totalCards.toLocaleString()}
        </p>
        <p>
          <span className="font-medium">License:</span> {shop.licenseNumber || "—"}
        </p>
        {shop.mobileMasked && (
          <p>
            <span className="font-medium">Phone:</span> {shop.mobileMasked}{" "}
            <span className="text-xs text-muted-foreground">(masked on ePOS)</span>
          </p>
        )}
        {address && (
          <a
            href={address}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-700 underline-offset-2 hover:underline"
          >
            📍 Open in Google Maps
          </a>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Link href={`/store/${shop.ardNumber}`} className={buttonVariants({ size: "sm" })}>
          Check Availability
        </Link>
        <Link
          href={`/store/${shop.ardNumber}#contact`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          Contact Store
        </Link>
      </CardFooter>
    </Card>
  );
}