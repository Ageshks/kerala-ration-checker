import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HELPLINE_PHONE, TOLL_FREE, SOURCES, CIVIL_SUPPLIES_CONTACT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About & Disclaimer",
  description:
    "About the Kerala Ration Availability Checker, its official data sources, and the disclaimer.",
};

export default function AboutPage() {
  return (
    <div className="container-max py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">About & Disclaimer</h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        The Kerala Ration Availability Checker is a community-built, nonprofit MVP that makes
        <strong> publicly available</strong> ration information easier to browse for the people
        of Kerala.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              Ration availability information is collected from publicly available official
              sources. Actual stock availability may change. Users are advised to contact the
              respective ration shop or authorities before visiting.
            </p>
            <p>
              Availability statuses (🟢 Available / 🟡 Limited / 🔴 Out of Stock) are computed
              automatically from the official monthly stock register and are <strong>not</strong>{" "}
              a real-time guarantee of stock at any shop.
            </p>
            <p>
              This website is <strong>not a government website</strong>. It does not store
              personal data and requires no login. Mobile numbers published on the official
              portal are masked by the portal itself; contact officials for complete details.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How the data is fetched</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              Every lookup runs on the <strong>Next.js server</strong> — your browser never
              contacts government servers directly. The server:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Requests the official public portal/server-side endpoints.</li>
              <li>Parses the response with Cheerio and validates every field.</li>
              <li>Caches results (stock: 30 min, store details: 24 h, search: 1 h).</li>
              <li>Rate-limits requests to remain a polite guest on government systems.</li>
            </ol>
            <p>
              If a source is unreachable you are shown an honest error message instead of
              stale or fabricated live data.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <h2 className="text-2xl font-bold text-slate-900">Official sources used</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Kerala AePDS / ePOS</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            <p>Ration shop (ARD) details, dealer info, coordinates and monthly stock registers.</p>
            <a className="mt-2 inline-block text-blue-700 underline" href={SOURCES.epos} target="_blank" rel="noopener noreferrer">
              Visit portal ↗
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Supplyco Kerala</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            <p>Supplyco / Maveli outlet addresses, contact numbers and depot information.</p>
            <a className="mt-2 inline-block text-blue-700 underline" href={SOURCES.supplyco} target="_blank" rel="noopener noreferrer">
              Visit website ↗
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>India Post Pincode API</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            <p>Used to translate a pincode into a district + region for ration shop lookup.</p>
            <a className="mt-2 inline-block text-blue-700 underline" href="https://api.postalpincode.in" target="_blank" rel="noopener noreferrer">
              Public API ↗
            </a>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <section id="contact" className="rounded-xl border bg-blue-50 p-6">
        <h2 className="text-xl font-bold text-blue-900">Official contact</h2>
        <p className="mt-1 text-sm text-slate-700">{CIVIL_SUPPLIES_CONTACT}</p>
        <p className="mt-2 text-sm text-slate-700">
          Helpline:{" "}
          <a className="text-lg font-bold text-blue-700" href={`tel:${HELPLINE_PHONE}`}>
            {HELPLINE_PHONE}
          </a>{" "}
          · Toll Free: <span className="font-bold">{TOLL_FREE}</span>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-slate-900">Privacy & technology</h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>No login, no accounts, no database — server-side memory cache only.</li>
          <li>
            No personal information is collected. Your language preference is stored only in
            your own browser&apos;s localStorage.
          </li>
          <li>Built with Next.js (App Router), TypeScript, Tailwind CSS and Cheerio.</li>
          <li>
            All scraping is performed server-side with caching, timeouts, rate limiting and
            respect for robots.txt and public website policies.
          </li>
        </ul>
      </section>
    </div>
  );
}