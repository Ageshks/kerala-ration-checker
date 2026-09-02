"use client";

import { LANGS, type Lang } from "@/lib/i18n";
import { useLanguage } from "@/components/shared/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div
      className={cn("flex items-center rounded-lg border border-border bg-background p-0.5", className)}
      role="group"
      aria-label="Language / ഭാഷ"
    >
      {LANGS.map((l) => (
        <Button
          key={l.code}
          type="button"
          size="sm"
          variant={lang === l.code ? "default" : "ghost"}
          className="h-8 rounded-md px-3 text-xs"
          onClick={() => setLang(l.code as Lang)}
          aria-pressed={lang === l.code}
        >
          {l.native}
        </Button>
      ))}
      <span className="sr-only">Current language: {current.label}</span>
    </div>
  );
}