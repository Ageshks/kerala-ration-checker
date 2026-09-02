import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { LanguageProvider } from "@/components/shared/language-provider";

export const metadata: Metadata = {
  title: {
    default: "Kerala Ration Availability Checker",
    template: "%s · Kerala Ration Checker",
  },
  description:
    "Search Kerala ration stores (ARD numbers) and check live commodity availability using publicly available data from the Kerala AePDS/ePOS portal and Supplyco.",
  keywords: [
    "Kerala",
    "ration",
    "ration shop",
    "ARD",
    "PDS",
    "AePDS",
    "ePOS",
    "supplyco",
    "maveli",
    "rice availability",
    "kerosene",
  ],
  openGraph: {
    title: "Kerala Ration Availability Checker",
    description:
      "Check nearest Kerala ration store and the latest ration commodity availability from official public sources.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <LanguageProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}