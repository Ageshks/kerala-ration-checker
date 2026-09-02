"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";
import { useLanguage } from "@/components/shared/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DISTRICTS } from "@/services/data/districts";

type SearchType = "pincode" | "keyword" | "ard" | "region" | "supplyco";

const TYPE_OPTIONS: { value: SearchType; labelEn: string; labelMl: string }[] = [
  { value: "pincode", labelEn: "Pincode", labelMl: "പിൻകോഡ്" },
  { value: "keyword", labelEn: "Name / Keyword", labelMl: "പേര് / കീവേഡ്" },
  { value: "ard", labelEn: "ARD Number", labelMl: "ARD നമ്പർ" },
  { value: "region", labelEn: "Region", labelMl: "പ്രദേശം" },
  { value: "supplyco", labelEn: "Supplyco Store", labelMl: "സപ്ലൈക്കോ സ്റ്റോർ" },
];

const PLACEHOLDERS: Record<SearchType, { en: string; ml: string }> = {
  pincode: { en: "e.g. 680001", ml: "ഉദാ. 680001" },
  keyword: {
    en: "e.g. dealer name, place or ARD",
    ml: "ഉദാ. ഉടമയുടെ പേര്, സ്ഥലം അല്ലെങ്കിൽ ARD",
  },
  ard: { en: "e.g. 1875002 (7–8 digits)", ml: "ഉദാ. 1875002 (7–8 അക്കങ്ങൾ)" },
  region: { en: "e.g. Thrissur", ml: "ഉദാ. Thrissur" },
  supplyco: { en: "e.g. Thrissur or store name", ml: "ഉദാ. Thrissur അല്ലെങ്കിൽ കടയുടെ പേര്" },
};

function validationError(
  type: SearchType,
  value: string,
  districtCode: string,
  lang: Lang
): string | null {
  const v = value.trim();
  if (type === "keyword") {
    if (!districtCode) {
      return lang === "ml" ? "ജില്ല തിരഞ്ഞെടുക്കുക." : "Please choose a district.";
    }
    if (!v || v.length < 2) {
      return lang === "ml"
        ? "കുറഞ്ഞത് 2 അക്ഷരങ്ങൾ നൽകുക."
        : "Enter at least 2 characters (dealer name, place or ARD).";
    }
    return null;
  }
  if (!v) {
    return lang === "ml" ? "ദയവായി ഒരു മൂല്യം നൽകുക." : "Please enter a value.";
  }
  if (type === "pincode" && !/^\d{6}$/.test(v)) {
    return lang === "ml" ? "പിൻകോഡ് 6 അക്കങ്ങൾ വേണം (ഉദാ. 680001)." : "Pincode must be 6 digits (e.g. 680001).";
  }
  if (type === "ard" && !/^\d{7,8}$/.test(v)) {
    return lang === "ml" ? "ARD നമ്പർ 7–8 അക്കങ്ങൾ വേണം." : "ARD Number must be 7–8 digits (e.g. 1875002).";
  }
  return null;
}

export function SearchForm({ className }: { className?: string }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [type, setType] = useState<SearchType>("pincode");
  const [query, setQuery] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validationError(type, query, districtCode, lang);
    setError(err);
    if (err) return;

    const q = encodeURIComponent(query.trim());
    const param = type === "supplyco" ? "&mode=supplyco" : "";
    const url =
      type === "keyword"
        ? `/search?type=keyword&district=${districtCode}&q=${q}`
        : type === "region"
          ? `/search?type=region&q=${q}${param}`
          : `/search?type=${type}&q=${q}${param}`;
    startTransition(() => {
      router.push(url);
    });
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} noValidate>
      <div
        className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
        role="group"
        aria-label={lang === "ml" ? "തിരയൽ തരം" : "Search type"}
      >
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setType(opt.value);
              setError(null);
            }}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              type === opt.value
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
            aria-pressed={type === opt.value}
          >
            {lang === "ml" ? opt.labelMl : opt.labelEn}
          </button>
        ))}
      </div>

      {type === "keyword" && (
        <div className="mt-3">
          <label htmlFor="keyword-district" className="mb-1 block text-sm font-semibold text-slate-700">
            {lang === "ml" ? "ജില്ല" : "District"}
          </label>
          <select
            id="keyword-district"
            value={districtCode}
            onChange={(e) => {
              setDistrictCode(e.target.value);
              setError(null);
            }}
            className="h-14 w-full rounded-md border border-slate-300 bg-white px-3 text-lg font-medium text-slate-800"
          >
            <option value="">{lang === "ml" ? "— ജില്ല തിരഞ്ഞെടുക്കുക —" : "— Select district —"}</option>
            {DISTRICTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="text"
          inputMode={type === "pincode" || type === "ard" ? "numeric" : "text"}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
          placeholder={lang === "ml" ? PLACEHOLDERS[type].ml : PLACEHOLDERS[type].en}
          aria-label={lang === "ml" ? "തിരയൽ ടെർം" : "Search term"}
          className="h-14 flex-1 text-lg"
        />
        <Button size="xl" type="submit" className="shrink-0" disabled={false}>
          {lang === "ml" ? "തിരയുക" : "Search"}
        </Button>
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <p className="mt-2 text-xs text-slate-500">
        {lang === "ml"
          ? "പിൻകോഡ്, ARD നമ്പർ, ഉടമയുടെ പേര് അല്ലെങ്കിൽ പ്രദേശം ഉപയോഗിച്ച് തിരയാം."
          : "Search by pincode, ARD number, dealer name, region, or Supplyco store."}
      </p>
    </form>
  );
}