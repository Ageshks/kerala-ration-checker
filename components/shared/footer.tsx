import Link from "next/link";
import { SOURCES, HELPLINE_PHONE, TOLL_FREE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">
            Kerala Ration Checker
          </h2>
          <p className="text-sm leading-relaxed">
            A community tool that reads <strong>publicly available</strong> ration store and
            commodity availability information from official Kerala Government and Supplyco
            websites.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">
            Official Sources
          </h2>
          <ul className="space-y-1 text-sm">
            <li>
              <a
                className="underline decoration-blue-400 underline-offset-2 hover:text-white"
                href={SOURCES.epos}
                target="_blank"
                rel="noopener noreferrer"
              >
                Kerala AePDS / ePOS Portal
              </a>
            </li>
            <li>
              <a
                className="underline decoration-blue-400 underline-offset-2 hover:text-white"
                href={SOURCES.supplyco}
                target="_blank"
                rel="noopener noreferrer"
              >
                Supplyco Kerala
              </a>
            </li>
            <li>
              <a
                className="underline decoration-blue-400 underline-offset-2 hover:text-white"
                href="https://www.indiapost.gov.in"
                target="_blank"
                rel="noopener noreferrer"
              >
                India Post (Pincode)
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">
            Civil Supplies Helpline
          </h2>
          <p className="text-sm">
            Helpline:{" "}
            <a className="font-semibold text-white" href={`tel:${HELPLINE_PHONE}`}>
              {HELPLINE_PHONE}
            </a>
            <br />
            Toll Free: <span className="font-semibold text-white">{TOLL_FREE}</span>
          </p>
          <Link
            href="/about"
            className="mt-3 inline-block text-sm text-blue-300 underline underline-offset-2 hover:text-blue-200"
          >
            About &amp; Disclaimer
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-400">
          Disclaimer: Ration availability information is collected from publicly available
          official sources. Actual stock availability may change. Users are advised to contact
          the respective ration shop or authorities before visiting. This is not a government
          website.
        </p>
      </div>
    </footer>
  );
}