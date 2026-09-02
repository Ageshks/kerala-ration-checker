/**
 * Lightweight English / Malayalam dictionary used by client components.
 * Server components render English with Malayalam secondary labels where it
 * improves accessibility for elderly users.
 */

export type Lang = "en" | "ml";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
];

export const I18N = {
  appName: { en: "Kerala Ration Availability Checker", ml: "കേരള റേഷൻ ലഭ്യതാ പരിശോധകൻ" },
  tagline: {
    en: "Check ration store information and commodity availability from official Kerala Government sources.",
    ml: "ഔദ്യോഗിക കേരള സർക്കാർ സ്രോതസ്സുകളിൽ നിന്ന് റേഷൻ കടയുടെ വിവരങ്ങളും സാധനങ്ങളുടെ ലഭ്യതയും പരിശോധിക്കുക.",
  },
  heroTitle: {
    en: "Check Ration Availability Near You",
    ml: "നിങ്ങൾക്ക് സമീപത്തെ റേഷൻ ലഭ്യത പരിശോധിക്കുക",
  },
  heroSubtitle: {
    en: "Search your nearest ration store and check the latest available ration commodities.",
    ml: "അടുത്തുള്ള റേഷൻ കട തിരഞ്ഞെടുത്ത് ഏറ്റവും പുതിയ റേഷൻ വസ്തുക്കളുടെ ലഭ്യത പരിശോധിക്കുക.",
  },
  searchPlaceholder: {
    en: "Enter Pincode, Region or ARD Number",
    ml: "പിൻകോഡ്, പ്രദേശം അല്ലെങ്കിൽ ARD നമ്പർ നൽകുക",
  },
  search: { en: "Search", ml: "തിരയുക" },
  searchByPincode: { en: "Search by Pincode", ml: "പിൻകോഡ് വഴി തിരയുക" },
  searchByRegion: { en: "Search by Region", ml: "പ്രദേശം വഴി തിരയുക" },
  searchByArd: { en: "Search by ARD Number", ml: "ARD നമ്പർ വഴി തിരയുക" },
  searchByLocation: { en: "Search by Location", ml: "സ്ഥലം വഴി തിരയുക" },
  district: { en: "District", ml: "ജില്ല" },
  taluk: { en: "Taluk / Region", ml: "താലൂക്ക് / പ്രദേശം" },
  locality: { en: "Locality", ml: "ലോക്കാലിറ്റി" },
  selectDistrict: { en: "Select District", ml: "ജില്ല തിരഞ്ഞെടുക്കുക" },
  selectRegion: { en: "Select Region", ml: "പ്രദേശം തിരഞ്ഞെടുക്കുക" },
  available: { en: "Available", ml: "ലഭ്യമാണ്" },
  limitedStock: { en: "Limited Stock", ml: "പരിമിതമായ സ്റ്റോക്ക്" },
  outOfStock: { en: "Out of Stock", ml: "സ്റ്റോക്ക് തീർന്നു" },
  checkAvailability: { en: "Check Availability", ml: "ലഭ്യത പരിശോധിക്കുക" },
  contactStore: { en: "Contact Store", ml: "കടയുമായി ബന്ധപ്പെടുക" },
  callNow: { en: "Call Now", ml: "ഇപ്പോൾ വിളിക്കുക" },
  lastUpdated: { en: "Last Updated", ml: "അവസാനം അപ്ഡേറ്റ് ചെയ്തത്" },
  currentAvailability: { en: "Current Ration Availability", ml: "ഇപ്പോഴത്തെ റേഷൻ ലഭ്യത" },
  quantity: { en: "Quantity", ml: "അളവ്" },
  noResults: { en: "No results found", ml: "ഫലങ്ങളൊന്നും കണ്ടെത്തിയില്ല" },
  tryAgain: { en: "Please try again later.", ml: "ദയവായി കുറച്ച് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക." },
  loading: { en: "Loading…", ml: "ലോഡ് ചെയ്യുന്നു…" },
  refreshing: { en: "Refreshing…", ml: "പുതുക്കുന്നു…" },
  refresh: { en: "Refresh Live Data", ml: "തത്സമയ ഡാറ്റ പുതുക്കുക" },
  backToSearch: { en: "Back to Search", ml: "തിരയലിലേക്ക് മടങ്ങുക" },
  governmentRationShop: { en: "Government Ration Shop", ml: "സർക്കാർ റേഷൻ കട" },
  ardNumber: { en: "ARD Number", ml: "ARD നമ്പർ" },
  location: { en: "Location", ml: "സ്ഥലം" },
  pincode: { en: "Pincode", ml: "പിൻകോഡ്" },
  phone: { en: "Phone Number", ml: "ഫോൺ നമ്പർ" },
  storeName: { en: "Store Name", ml: "കടയുടെ പേര്" },
  fullAddress: { en: "Full Address", ml: "മുഴുവൻ വിലാസം" },
  contactInfo: { en: "Contact Information", ml: "ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ" },
  about: { en: "About & Disclaimer", ml: "വിവരങ്ങളും നിരാകരണവും" },
  home: { en: "Home", ml: "ഹോം" },
  supplycoOutlets: { en: "Supplyco / Maveli Stores", ml: "സപ്ലൈക്കോ / മാവേലി സ്റ്റോറുകൾ" },
} as const;

export type I18nKey = keyof typeof I18N;

export function t(key: I18nKey, lang: Lang = "en"): string {
  const entry = I18N[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}