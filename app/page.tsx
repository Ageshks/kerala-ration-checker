import type { Metadata } from "next";
import { SearchForm } from "@/components/shared/search-form";
import { RegionSearch } from "@/components/shared/region-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HELPLINE_PHONE, TOLL_FREE, SOURCES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Check Ration Availability Near You",
  description:
    "Search your nearest Kerala ration store and check the latest available ration commodities from official public sources.",
};

const QUICK_SEARCH = [
  {
    href: "/search?type=pincode&q=680001",
    emoji: "📍",
    title: "Search by Pincode",
    ml: "പിൻകോഡ് വഴി തിരയുക",
    desc: "Try 680001 (Thrissur)",
  },
  {
    href: "/search?type=pincode&q=682020",
    emoji: "🏙️",
    title: "Search by Region",
    ml: "പ്രദേശം വഴി തിരയുക",
    desc: "Try Ernakulam pincode 682020",
  },
  {
    href: "/search?type=ard&q=1875002",
    emoji: "🔢",
    title: "Search by ARD Number",
    ml: "ARD നമ്പർ വഴി തിരയുക",
    desc: "Try ARD 1875002",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="container-max py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
              Kerala · കേരളം · ഭക്ഷ്യ സിവിൽ സപ്ലൈസ്
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Check Ration Availability Near You
            </h1>
            <p className="mt-3 text-lg text-slate-700 md:text-xl">
              Search your nearest ration store and check the latest available ration
              commodities.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              നിങ്ങൾക്ക് സമീപത്തെ റേഷൻ കടയും ഏറ്റവും പുതിയ റേഷൻ ലഭ്യതയും പരിശോധിക്കുക
            </p>

            <div className="mt-8">
              <SearchForm />
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              OR · അല്ലെങ്കിൽ
            </p>
            <a
              href="#by-region"
              className="mt-3 inline-flex items-center gap-2 text-lg font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-800"
            >
              Search by Location / ലൊക്കേഷൻ വഴി തിരയുക
            </a>
          </div>
        </div>
      </section>

      {/* Quick search options */}
      <section className="container-max pb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_SEARCH.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-3xl" aria-hidden="true">
                {item.emoji}
              </span>
              <h2 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-blue-700">
                {item.title}
              </h2>
              <p className="text-sm font-medium text-blue-700">{item.ml}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Region drill-down */}
      <section id="by-region" className="border-t bg-white py-12">
        <div className="container-max">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Find Ration Shops by Location
              </h2>
              <p className="mt-2 text-slate-600">
                Select a district and a taluk/region to list every government ration shop
                (ARD) in that area.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                ജില്ലയും താലൂക്കും തിരഞ്ഞെടുത്ത് ആ പ്രദേശത്തെ എല്ലാ റേഷൻ കടകളും കാണുക
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  ["District", "14 districts of Kerala"],
                  ["Taluk / Region", "AFSO office areas (taluk level)"],
                  ["Ration shops", "Every ARD number with owner, cards & location"],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      ✓
                    </span>
                    <span>
                      <span className="font-semibold text-slate-800">{k}:</span> {v}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>District → Taluk / Region</CardTitle>
              </CardHeader>
              <CardContent>
                <RegionSearch />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* How it works */}
      <section className="container-max py-12">
        <h2 className="text-center text-2xl font-bold text-slate-900 md:text-3xl">
          How It Works
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "1", t: "Search", d: "Enter a pincode, region, or ARD number." },
            {
              n: "2",
              t: "Server Fetch",
              d: "Next.js fetches the official public portal server-side — never from your browser.",
            },
            {
              n: "3",
              t: "Parse & Cache",
              d: "Stock and store details are parsed and cached (30 min – 24 h).",
            },
            {
              n: "4",
              t: "See Status",
              d: "View 🟢 Available / 🟡 Limited / 🔴 Out of Stock instantly.",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border bg-white p-5 text-center">
              <p className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-blue-700 text-lg font-bold text-white">
                {s.n}
              </p>
              <h3 className="mt-3 font-bold text-slate-900">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Helpline strip */}
      <section className="bg-blue-700">
        <div className="container-max flex flex-col items-center justify-between gap-4 py-8 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-xl font-bold text-white">Need help from an official?</h2>
            <p className="text-blue-100">
              Civil Supplies Helpline: {HELPLINE_PHONE} · Toll Free: {TOLL_FREE}
            </p>
          </div>
          <a
            href={`tel:${HELPLINE_PHONE}`}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-green-600 px-8 text-lg font-semibold text-white shadow hover:bg-green-700"
          >
            📞 Call Helpline
          </a>
        </div>
      </section>

      {/* Source strip */}
      <section className="container-max py-8">
        <p className="text-center text-xs text-muted-foreground">
          Data is read live from official public sources:{" "}
          <a className="underline" href={SOURCES.epos} target="_blank" rel="noopener noreferrer">
            Kerala AePDS / ePOS Portal
          </a>{" "}
          and{" "}
          <a className="underline" href={SOURCES.supplyco} target="_blank" rel="noopener noreferrer">
            Supplyco Kerala
          </a>
          . Stock status is auto-computed — always confirm with the shop before visiting.
        </p>
      </section>
    </>
  );
}