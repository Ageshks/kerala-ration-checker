"use client";

import { useMemo, useState } from "react";
import { ShopCard } from "@/components/shared/shop-card";
import { Input } from "@/components/ui/input";
import { normalize } from "@/lib/utils";
import { useLanguage } from "@/components/shared/language-provider";
import type { ShopWithRank } from "@/services/scrapers/types";

type SortMode = "nearest" | "cards" | "ard";

const PAGE = 60;

/**
 * Client-side result explorer: filter by dealer/ARD/licence/taluk and sort —
 * all in-memory, zero extra requests to the government servers.
 */
export function ResultsToolbar({
  shops,
  showDistance = false,
}: {
  shops: ShopWithRank[];
  showDistance?: boolean;
}) {
  const { lang } = useLanguage();
  const [filter, setFilter] = useState("");
  const [taluk, setTaluk] = useState("all");
  const [sort, setSort] = useState<SortMode>(showDistance ? "nearest" : "cards");
  const [visible, setVisible] = useState(PAGE);

  const taluks = useMemo(() => {
    const set = new Set<string>();
    for (const s of shops) if (s.officeName) set.add(s.officeName);
    return [...set].sort();
  }, [shops]);

  const filtered = useMemo(() => {
    const nf = normalize(filter);
    let list = shops;
    if (taluk !== "all") list = list.filter((s) => s.officeName === taluk);
    if (nf) {
      list = list.filter(
        (s) =>
          normalize(s.ardNumber).includes(nf) ||
          normalize(s.ownerName).includes(nf) ||
          normalize(s.licenseNumber).includes(nf) ||
          normalize(s.officeName).includes(nf)
      );
    }
    const sorted = [...list];
    if (sort === "nearest") {
      sorted.sort(
        (a, b) =>
          (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
      );
    } else if (sort === "cards") {
      sorted.sort((a, b) => b.totalCards - a.totalCards);
    } else {
      sorted.sort((a, b) => a.ardNumber.localeCompare(b.ardNumber));
    }
    return sorted;
  }, [shops, filter, taluk, sort]);

  const shown = filtered.slice(0, visible);

  return (
    <div>
      <div className="flex flex-col gap-2 rounded-xl border bg-white p-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setVisible(PAGE);
          }}
          placeholder={
            lang === "ml"
              ? "ഉടമയുടെ പേര് / ARD / ലൈസൻസ് ഫിൽട്ടർ ചെയ്യുക…"
              : "Filter by dealer name, ARD or licence…"
          }
          aria-label={lang === "ml" ? "ഫിൽട്ടർ" : "Filter results"}
          className="h-11 flex-1"
        />
        <select
          value={taluk}
          onChange={(e) => {
            setTaluk(e.target.value);
            setVisible(PAGE);
          }}
          aria-label={lang === "ml" ? "താലൂക്ക് തിരഞ്ഞെടുക്കുക" : "Filter by taluk / office"}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800"
        >
          <option value="all">
            {lang === "ml" ? `എല്ലാ താലൂക്കുകളും (${shops.length})` : `All taluks (${shops.length})`}
          </option>
          {taluks.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          aria-label={lang === "ml" ? "ക്രമീകരിക്കുക" : "Sort results"}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800"
        >
          {showDistance && (
            <option value="nearest">{lang === "ml" ? "📍 ഏറ്റവും അടുത്തത്" : "📍 Nearest first"}</option>
          )}
          <option value="cards">
            {lang === "ml" ? "ഏറ്റവും കൂടുതൽ റേഷൻ കാർഡുകൾ" : "Most ration cards"}
          </option>
          <option value="ard">{lang === "ml" ? "ARD നമ്പർ" : "ARD number"}</option>
        </select>
      </div>

      <p className="mt-3 text-sm text-muted-foreground" role="status">
        {filtered.length === shops.length
          ? lang === "ml"
            ? `${shops.length} കടകൾ`
            : `${shops.length} shops`
          : lang === "ml"
            ? `${shops.length}-ൽ ${filtered.length} കടകൾ ചേരുന്നു`
            : `${filtered.length} of ${shops.length} shops match`}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {lang === "ml"
            ? "ഫിൽട്ടറുമായി ചേരുന്ന കടകളില്ല. ഫിൽട്ടർ മാറ്റി നോക്കൂ."
            : "No shops match your filter. Clear it or pick another taluk."}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((shop) => (
            <ShopCard key={shop.ardNumber} shop={shop} />
          ))}
        </div>
      )}

      {filtered.length > shown.length && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE)}
            className="rounded-lg border-2 border-blue-700 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            {lang === "ml"
              ? `${filtered.length}-ൽ ${Math.min(PAGE, filtered.length - shown.length)} കൂടുതൽ കാണിക്കുക`
              : `Show ${Math.min(PAGE, filtered.length - shown.length)} more of ${filtered.length}`}
          </button>
        </div>
      )}
    </div>
  );
}