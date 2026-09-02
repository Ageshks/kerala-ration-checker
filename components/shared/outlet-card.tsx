import type { SupplycoOutlet } from "@/services/scrapers/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function addressOf(o: SupplycoOutlet): string {
  return [o.address1, o.address2, o.address3].filter(Boolean).join(", ");
}

function mapsUrl(o: SupplycoOutlet): string | null {
  if (o.latitude !== null && o.longitude !== null) return `https://www.google.com/maps?q=${o.latitude},${o.longitude}`;
  const addr = addressOf(o);
  if (addr) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  return null;
}

export function OutletCard({ outlet }: { outlet: SupplycoOutlet }) {
  const map = mapsUrl(outlet);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span aria-hidden="true">🛒</span>
            {outlet.name}
          </CardTitle>
          <Badge variant="secondary">{outlet.outletType}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {outlet.districtName}
          {outlet.pinCode ? ` · ${outlet.pinCode}` : ""}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-1.5 text-sm">
        <p className="text-muted-foreground">{addressOf(outlet) || "Address not available"}</p>
        {outlet.phone && (
          <p>
            <span className="font-medium">Phone:</span>{" "}
            <a className="text-blue-700 underline-offset-2 hover:underline" href={`tel:${outlet.phone}`}>
              +91 {outlet.phone}
            </a>
          </p>
        )}
        {outlet.email && (
          <p className="text-muted-foreground">
            <span className="font-medium text-slate-700">Email:</span> {outlet.email}
          </p>
        )}
        {outlet.depot && <p className="text-muted-foreground">Depot: {outlet.depot}</p>}
        {map && (
          <a
            href={map}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-700 underline-offset-2 hover:underline"
          >
            📍 Open in Google Maps
          </a>
        )}
      </CardContent>
    </Card>
  );
}