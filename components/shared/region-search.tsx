"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DISTRICTS } from "@/services/data/districts";
import { useLanguage } from "@/components/shared/language-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface RegionOption {
  code: string;
  name: string;
  shops: number;
}

export function RegionSearch({ className }: { className?: string }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [district, setDistrict] = useState("");
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [region, setRegion] = useState("");
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the district changes, fetch its office list from the server action.
  useEffect(() => {
    if (!district) {
      setRegions([]);
      setRegion("");
      return;
    }
    setLoadingRegions(true);
    setError(null);
    let cancelled = false;

    fetch(`/api/regions?district=${encodeURIComponent(district)}`)
      .then((res) => res.json())
      .then((data: { offices?: RegionOption[]; error?: string }) => {
        if (cancelled) return;
        if (data.error || !data.offices) {
          setError(data.error ?? "Failed to load regions");
          setRegions([]);
        } else {
          setRegions(data.offices);
          setRegion("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load regions. Please try again.");
          setRegions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRegions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!district) {
      setError(lang === "ml" ? "ദയവായി ഒരു ജില്ല തിരഞ്ഞെടുക്കുക." : "Please select a district.");
      return;
    }
    setError(null);
    const d = encodeURIComponent(district);
    const office = region ? `&office=${encodeURIComponent(region)}` : "";
    startTransition(() => {
      router.push(`/search?type=region&district=${d}${office}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-district" className="mb-1 block text-sm font-semibold text-slate-700">
            {lang === "ml" ? "ജില്ല" : "District"}
          </label>
          <Select
            id="reg-district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label={lang === "ml" ? "ജില്ല തിരഞ്ഞെടുക്കുക" : "Select district"}
          >
            <option value="">{lang === "ml" ? "ജില്ല തിരഞ്ഞെടുക്കുക" : "Select District"}</option>
            {DISTRICTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="reg-region" className="mb-1 block text-sm font-semibold text-slate-700">
            {lang === "ml" ? "താലൂക്ക് / പ്രദേശം" : "Taluk / Region"}
          </label>
          <Select
            id="reg-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            disabled={!district || loadingRegions}
            aria-label={lang === "ml" ? "താലൂക്ക് / പ്രദേശം തിരഞ്ഞെടുക്കുക" : "Select taluk / region"}
          >
            <option value="">
              {loadingRegions
                ? lang === "ml"
                  ? "ലോഡ് ചെയ്യുന്നു…"
                  : "Loading…"
                : lang === "ml"
                  ? "എല്ലാ പ്രദേശങ്ങളും"
                  : "All regions"}
            </option>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
                {r.shops > 0 ? ` (${r.shops})` : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <Button size="lg" type="submit" className="mt-3 w-full sm:w-auto">
        {lang === "ml" ? "റേഷൻ കടകൾ കാണുക" : "Show Ration Shops"}
      </Button>
    </form>
  );
}