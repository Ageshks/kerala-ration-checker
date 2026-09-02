import Link from "next/link";
import { LanguageToggle } from "@/components/shared/language-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="Kerala Ration Availability Checker — Home">
          {/* Emblem-like mark */}
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-700 text-lg text-white" aria-hidden="true">
            🛒
          </span>
          <span className="min-w-0">
            <span className="block truncate font-bold leading-tight text-blue-900">
              Kerala Ration Checker
            </span>
            <span className="block truncate text-xs leading-tight text-blue-600">
              കേരള റേഷൻ ലഭ്യതാ പരിശോധകൻ
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          <Link
            href="/"
            className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-800"
          >
            Home
          </Link>
          <Link
            href="/search"
            className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-800"
          >
            Search
          </Link>
          <Link
            href="/about"
            className="hidden rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-800 sm:block"
          >
            About
          </Link>
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}