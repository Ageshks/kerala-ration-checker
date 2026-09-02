/**
 * Shared types for data scraped from official sources.
 */

/** A district as listed by the Kerala AePDS/ePOS portal. */
export interface District {
  /** ePOS district code (e.g. "18" = Thrissur). */
  code: string;
  name: string;
}

/** An AFSO office (taluk / region level) within a district. */
export interface Office {
  /** ePOS office code used by the fps_aso_details.action endpoint. */
  code: string;
  name: string;
  totalShops: number;
  mappedShops: number;
  unmappedShops: number;
}

/** A ration shop (FPS) row returned by fps_aso_details.action. */
export interface RationShop {
  ardNumber: string;
  districtCode: string;
  districtName: string;
  officeCode: string;
  officeName: string;
  totalCards: number;
  licenseNumber: string;
  ownerName: string;
  /** ePOS masks the middle digits of the mobile number (e.g. +91 XXXXX-X3266). */
  mobileMasked: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
}

/** A ration shop optionally annotated with server-side proximity ranking. */
export type ShopWithRank = RationShop & {
  /** Distance in km to the nearest post office of the searched pincode. */
  distanceKm?: number | null;
  /** Name of that nearest post office. */
  nearestPostOffice?: string | null;
};

/** ARD-level identity block returned by FPS_Status_Details.jsp. */
export interface ArdIdentity {
  ardNumber: string;
  district: string;
  office: string;
  deviceId: string;
  dealer: string;
  nominee1: string;
  nominee2: string;
  status: string;
}

/** One commodity row of the monthly stock register. */
export interface CommodityStock {
  commodity: string;
  unit: string;
  allottedRegular: number;
  allottedExtra: number;
  openingBalance: number;
  receivedRegular: number;
  receivedExtra: number;
  receivedMoved: number;
  issued: number;
  /** Closing balance = current stock quantity available for sale/distribution. */
  closingBalance: number;
}

/** The stock snapshot for one ARD for one month. */
export interface StockSnapshot {
  ardNumber: string;
  month: string;
  year: number;
  commodities: CommodityStock[];
  /** When the snapshot was produced by the source. */
  fetchedAt: string;
  source: string;
}

/** Full detail bundle for a ration store (identity + current month stock). */
export interface StoreDetails {
  identity: ArdIdentity;
  /** Current month stock snapshot (may be empty when no stock table exists). */
  stock: StockSnapshot;
  /** Ration-shop list metadata joined from the office listing when available. */
  shopMetadata: RationShop | null;
}

/** A Supplyco retail outlet (Maveli store / supermarket). */
export interface SupplycoOutlet {
  outletId: number;
  name: string;
  taluk: string | null;
  districtName: string;
  outletType: string;
  status: boolean;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  pinCode: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  isSundayOpen: boolean;
  depot: string | null;
}

/** Result of a pincode lookup via the India Post public API. */
export interface PincodeLocation {
  pincode: string;
  postOfficeNames: string[];
  district: string;
  division: string;
  block: string;
  region: string;
}

export type AvailabilityStatus = "available" | "limited" | "out" | "no-data";

export interface AvailabilityItem {
  commodity: string;
  displayName: string;
  unit: string;
  quantity: number;
  threshold: number;
  status: AvailabilityStatus;
}

export interface AvailabilityResult {
  ardNumber: string;
  month: string;
  year: number;
  fetchedAt: string;
  items: AvailabilityItem[];
}