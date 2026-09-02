import type { District, Office } from "@/services/scrapers/types";

/**
 * Static list of Kerala districts and their AFSO offices.
 *
 * District codes and the office list come from the official Kerala AePDS/ePOS
 * portal (epos.kerala.gov.in). The office list was captured from the public
 * `afso_fps_details.action` endpoint and is also refreshed live at runtime —
 * this file simply provides a well-known fallback so the region drill-down
 * works even when the office-list call is rate-limited or offline.
 */

export const DISTRICTS: District[] = [
  { code: "11", name: "Thiruvananthapuram" },
  { code: "12", name: "Kollam" },
  { code: "13", name: "Pathanamthitta" },
  { code: "14", name: "Alappuzha" },
  { code: "15", name: "Kottayam" },
  { code: "16", name: "Idukki" },
  { code: "17", name: "Ernakulam" },
  { code: "18", name: "Thrissur" },
  { code: "19", name: "Palakkad" },
  { code: "20", name: "Malappuram" },
  { code: "21", name: "Kozhikkodu" },
  { code: "22", name: "Wayanad" },
  { code: "23", name: "Kannur" },
  { code: "24", name: "Kasargodu" },
];

export function districtByName(name: string): District | undefined {
  const n = name.toLowerCase().replace(/[^a-z]/g, "");
  return DISTRICTS.find((d) => d.name.toLowerCase().replace(/[^a-z]/g, "") === n);
}

export function districtByCode(code: string): District | undefined {
  return DISTRICTS.find((d) => d.code === code);
}

export const defaultOffices: Office[] = [
  { code: "0", name: "Thrissur", totalShops: 0, mappedShops: 0, unmappedShops: 0 },
];

/** Well-known AFSO office names per district (fallback static snapshot). */
export const FALLBACK_OFFICES: Record<string, Office[]> = {
  "11": ["Chirayinkeezhu", "Kattakada", "Nedumangad", "Neyyattinkara", "Varkala", "CRO-North-Thiruvananthapuram", "CRO-South-Thiruvananthapuram", "TSO_Thiruvananthapuram"].map(
    (n, i) => ({ code: String(101 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "12": ["Karunagappally", "Kollam", "Kottarakkara", "Kunnathoor", "Pathanapuram", "Punalur"].map(
    (n, i) => ({ code: String(201 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "13": ["Adoor", "Konni", "Kozhenchery", "Mallappally", "Ranni", "Thiruvalla"].map(
    (n, i) => ({ code: String(301 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "14": ["Ambalapuzha", "Chengannur", "Cherthala", "Karthikappally", "Kuttanad", "Mavelikkara"].map(
    (n, i) => ({ code: String(401 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "15": ["Changanachery", "Kanjirappally", "Kottayam", "Meenachil", "Vaikom"].map(
    (n, i) => ({ code: String(501 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "16": ["Devikulam", "Idukki", "Peerumedu", "Thodupuzha", "Udumbanchola"].map(
    (n, i) => ({ code: String(601 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "17": ["Aluva", "CRO_Ernakulam", "CRO_kochi", "Kanayannoor", "Kothamangalam", "Kunnathunadu", "Moovattupuzha", "North_Paravoor", "TSO_Kochi"].map(
    (n, i) => ({ code: String(701 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "18": ["Chalakkudy", "Chavakkad", "Kodungalloor", "Kunnamkulam", "Mukundapuram", "Thalappilly", "Thrissur"].map(
    (n, i) => ({ code: String(801 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "19": ["Alathur", "Attappadi", "Chittur", "Mannarkad", "Ottappalam", "Palakkad", "Pattambi"].map(
    (n, i) => ({ code: String(901 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "20": ["Ernad", "Kondotty", "Nilambur", "Perinthalmanna", "Ponnani", "Thirur", "Thirurangadi"].map(
    (n, i) => ({ code: String(1001 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "21": ["CRO_North_Kozhikkode", "CRO_South_Kozhikkode", "Koyilandi", "Thamarassery", "TSO_Kozhikkode", "Vadakara"].map(
    (n, i) => ({ code: String(1101 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "22": ["Mananthavady", "Sulthan Batheri", "Vythiri"].map(
    (n, i) => ({ code: String(1201 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "23": ["Iritty", "Kannur", "Payyannur", "Thalassery", "Thaliparambu"].map(
    (n, i) => ({ code: String(1301 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
  "24": ["Hosdurg", "Kasaragod", "Manjeswaram", "Vellarikundu"].map(
    (n, i) => ({ code: String(1401 + i), name: n, totalShops: 0, mappedShops: 0, unmappedShops: 0 })
  ),
};