/**
 * Parsers for the public ePOS HTML fragments returned by the AJAX endpoints.
 */

import * as cheerio from "cheerio";
import type { ArdIdentity, CommodityStock, Office, RationShop } from "@/services/scrapers/types";

function text(el: cheerio.Cheerio<any>): string {
  return el.text().replace(/\s+/g, " ").trim();
}

function toFloat(value: string): number {
  const n = parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Parse the office list returned by afso_fps_details.action. */
export function parseOffices(html: string): Office[] {
  const $ = cheerio.load(html);
  const offices: Office[] = [];

  $("table tr").each((_, rowEl) => {
    const cells = $(rowEl).find("td");
    if (cells.length < 5) return;
    const name = text($(cells[1]));
    const codeInput = $(cells[1]).find('input[type="hidden"][name^="office_code"]');
    const code = codeInput.attr("value");
    if (!name || !code || !/^\d+$/.test(code)) return;

    offices.push({
      code,
      name,
      totalShops: toFloat(text($(cells[2]))),
      mappedShops: toFloat(text($(cells[3]))),
      unmappedShops: toFloat(text($(cells[4]))),
    });
  });

  return offices;
}

/** Parse the shop list returned by fps_aso_details.action. */
export function parseRationShops(
  html: string,
  districtCode: string,
  districtName: string,
  officeName: string
): RationShop[] {
  const $ = cheerio.load(html);
  const shops: RationShop[] = [];

  $("table tr").each((_, rowEl) => {
    const cells = $(rowEl).find("td");
    if (cells.length < 9) return;

    const ard = text($(cells[1]));
    if (!/^\d{7,8}$/.test(ard)) return;

    const mobile = text($(cells[5]));
    const lat = parseFloat(text($(cells[6])));
    const lng = parseFloat(text($(cells[7])));

    shops.push({
      ardNumber: ard,
      districtCode,
      districtName,
      officeCode: "",
      officeName,
      totalCards: toFloat(text($(cells[2]))),
      licenseNumber: text($(cells[3])),
      ownerName: text($(cells[4])),
      mobileMasked: mobile || null,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      status: text($(cells[8])) || "Active",
    });
  });

  return shops;
}

/** Parse the ARD identity block from FPS_Status_Details.jsp. */
export function parseArdIdentity(html: string): ArdIdentity | null {
  const $ = cheerio.load(html);

  const tables = $("table");
  if (tables.length === 0) return null;

  const firstRows = $(tables.eq(0)).find("tr");
  let dataRow: cheerio.Cheerio<any> | null = null;
  firstRows.each((i, tr) => {
    if (i === 0) return; // header
    if ($(tr).find("td").length >= 7) dataRow = $(tr);
  });
  if (!dataRow) return null;

  const cells = $(dataRow).find("td");

  const title = text($(tables.eq(0)).find("tr").first());
  const ardMatch = title.match(/ARD Details\s*for\s*[^0-9]*(\d+)/i);
  const ardNumber = ardMatch ? ardMatch[1] : "";

  return {
    ardNumber,
    district: text($(cells[0])),
    office: text($(cells[1])),
    deviceId: text($(cells[2])),
    dealer: text($(cells[3])),
    nominee1: text($(cells[4])),
    nominee2: text($(cells[5])),
    status: text($(cells[6])),
  };
}