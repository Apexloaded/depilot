/**
 * Cadastral and Government Acquisition GIS Database for Nigeria (Lagos, Abuja, Ogun).
 * Contains polygon boundaries for Committed Acquisitions, Road Corridors,
 * Gazette Excisions, and Environmental Setbacks.
 */

export interface CadastralZoneFeature {
  id: string;
  name: string;
  type:
    | "HIGHWAY_RIGHT_OF_WAY"
    | "INFRASTRUCTURE_BUFFER"
    | "DRAINAGE_SETBACK"
    | "HIGH_TENSION_POWERLINE"
    | "GOVERNMENT_RESERVE";
  isCommitted: boolean;
  state: "Lagos" | "Abuja" | "Ogun" | "Rivers";
  polygon: number[][]; // [ [lng, lat], ... ]
  gazetteNumber?: string;
  description: string;
  penaltyOrAction: string;
}

export interface GazetteExcisionRecord {
  gazetteNo: string;
  volume: string;
  page: string;
  year: number;
  communityName: string;
  lga: string;
  state: string;
  boundaryPolygon: number[][]; // [ [lng, lat], ... ]
  description: string;
}

export const CADASTRAL_ZONES: CadastralZoneFeature[] = [
  {
    id: "LAGOS_COASTAL_HIGHWAY_CORRIDOR",
    name: "Lagos-Calabar Coastal Highway 50m-100m Right-of-Way Buffer",
    type: "HIGHWAY_RIGHT_OF_WAY",
    isCommitted: true,
    state: "Lagos",
    description: "Federal Government committed corridor for the 700km Coastal Superhighway passing through Victoria Island, Okun Ajah, Lafiaji, and Ibeju-Lekki coastline.",
    penaltyOrAction: "IMMEDIATE DEMOLITION / FATAL ACQUISITION. Zero compensation for unexcised titles.",
    polygon: [
      [3.5000, 6.4200],
      [3.9500, 6.4400],
      [3.9500, 6.4150],
      [3.5000, 6.4000],
      [3.5000, 6.4200],
    ],
  },
  {
    id: "LAGOS_4TH_MAINLAND_BRIDGE_ALIGNMENT",
    name: "4th Mainland Bridge Reserved Corridor (Langbasa-Baiyeku-Ikorodu)",
    type: "INFRASTRUCTURE_BUFFER",
    isCommitted: true,
    state: "Lagos",
    description: "Lagos State Ministry of Waterfront Infrastructure committed right-of-way connecting Lekki to Ikorodu across the Lagos Lagoon.",
    penaltyOrAction: "CRITICAL: Building permits revocable without compensation.",
    polygon: [
      [3.5400, 6.4800],
      [3.6200, 6.5500],
      [3.6100, 6.5600],
      [3.5300, 6.4900],
      [3.5400, 6.4800],
    ],
  },
  {
    id: "LEKKI_FREE_TRADE_ZONE_BUFFER",
    name: "Lekki Free Zone & Cargo Airport Expansion Perimeter",
    type: "GOVERNMENT_RESERVE",
    isCommitted: true,
    state: "Lagos",
    description: "State-acquired industrial development perimeter in Ibeju-Lekki/Alaro City.",
    penaltyOrAction: "FATAL: Non-regularizable industrial government acquisition.",
    polygon: [
      [3.8800, 6.4600],
      [4.0500, 6.5200],
      [4.0500, 6.4300],
      [3.8800, 6.4100],
      [3.8800, 6.4600],
    ],
  },
  {
    id: "LEKKI_DRAINAGE_CHANNEL_SETBACK",
    name: "Primary Drainage Alignment Setback (Ikate/Chevron/Orchid Buffer)",
    type: "DRAINAGE_SETBACK",
    isCommitted: true,
    state: "Lagos",
    description: "Lagos State Ministry of Environment 25-meter storm drainage canal alignment.",
    penaltyOrAction: "HIGH RISK: Demolition enforcement under Lagos State Urban Planning Law.",
    polygon: [
      [3.5100, 6.4350],
      [3.5600, 6.4450],
      [3.5600, 6.4400],
      [3.5100, 6.4300],
      [3.5100, 6.4350],
    ],
  },
  {
    id: "TCN_330KV_HIGH_TENSION_CORRIDOR",
    name: "TCN 330kV National Grid Transmission Line 50m Corridor",
    type: "HIGH_TENSION_POWERLINE",
    isCommitted: true,
    state: "Lagos",
    description: "Federal transmission company right-of-way with statutory 50-meter clearance.",
    penaltyOrAction: "FATAL: Permanent prohibition of residential structures.",
    polygon: [
      [3.3800, 6.6000],
      [3.7000, 6.6500],
      [3.7000, 6.6450],
      [3.3800, 6.5950],
      [3.3800, 6.6000],
    ],
  },
  {
    id: "ABUJA_MAITAMA_EXT_TRANSIT_BUFFER",
    name: "FCT Abuja Maitama II & Transit Way Acquisition",
    type: "HIGHWAY_RIGHT_OF_WAY",
    isCommitted: true,
    state: "Abuja",
    description: "Federal Capital Development Authority (FCDA/AGIS) committed arterial road setback.",
    penaltyOrAction: "FATAL: Compulsory demolition by FCDA Development Control.",
    polygon: [
      [7.4800, 9.0900],
      [7.5300, 9.1200],
      [7.5350, 9.1100],
      [7.4850, 9.0800],
      [7.4800, 9.0900],
    ],
  },
];

export const GAZETTE_EXCISIONS: GazetteExcisionRecord[] = [
  {
    gazetteNo: "14",
    volume: "26",
    page: "88-94",
    year: 1993,
    communityName: "Ibeju Customary Land Excision",
    lga: "Ibeju-Lekki",
    state: "Lagos",
    description: "Official Lagos State Gazette Excision granted to the traditional landowning family.",
    boundaryPolygon: [
      [3.7800, 6.4700],
      [3.8300, 6.4900],
      [3.8300, 6.4500],
      [3.7800, 6.4400],
      [3.7800, 6.4700],
    ],
  },
  {
    gazetteNo: "22",
    volume: "39",
    page: "120-128",
    year: 2006,
    communityName: "Ogombo Village Excision",
    lga: "Eti-Osa",
    state: "Lagos",
    description: "Approved government excision layout for Ogombo community.",
    boundaryPolygon: [
      [3.5600, 6.4500],
      [3.6000, 6.4700],
      [3.6000, 6.4400],
      [3.5600, 6.4300],
      [3.5600, 6.4500],
    ],
  },
];
