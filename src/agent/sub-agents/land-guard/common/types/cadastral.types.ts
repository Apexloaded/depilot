/**
 * Types and Data Contracts for LandGuard Cadastral Tools.
 */

export type UtmZone = 31 | 32;

export interface BeaconInput {
  id: string;
  easting: number;
  northing: number;
  bearing?: number; // degrees
  distance?: number; // meters
}

export interface Wgs84Coordinate {
  id: string;
  easting: number;
  northing: number;
  lat: number;
  lng: number;
  formatted: string;
}

export interface GeometricAuditResult {
  isPolygonClosed: boolean;
  totalPerimeterMeters: number;
  calculatedAreaSqm: number;
  calculatedAreaPlots: number;
  calculatedAreaHectares: number;
  declaredAreaSqm?: number;
  areaVariancePercentage?: number;
  closureStatus: 'PERFECT' | 'ACCEPTABLE' | 'DEVIATION_DETECTED';
  polygonGeoJson: {
    type: 'Polygon';
    coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
  };
}

export type AcquisitionStatus =
  | 'FREE_UNENCUMBERED'
  | 'COMMITTED_ACQUISITION'
  | 'GLOBAL_UNCOMMITTED_ACQUISITION'
  | 'EXCISED_GAZETTE_VERIFIED';

export interface CadastralEncroachment {
  zoneName: string;
  zoneType:
    | 'HIGHWAY_RIGHT_OF_WAY'
    | 'INFRASTRUCTURE_BUFFER'
    | 'DRAINAGE_SETBACK'
    | 'HIGH_TENSION_POWERLINE'
    | 'GOVERNMENT_RESERVE';
  severity: 'FATAL' | 'CRITICAL' | 'WARNING';
  encroachmentPercentage: number;
  demolitionRisk: 'IMMINENT' | 'HIGH' | 'LOW' | 'NONE';
  description: string;
  gazetteNumber?: string;
}

export interface CadastralZoningResult {
  acquisitionStatus: AcquisitionStatus;
  primaryZoneName: string;
  isCommittedAcquisition: boolean;
  encroachments: CadastralEncroachment[];
  gazetteMatch: {
    matched: boolean;
    gazetteNo?: string;
    excisionName?: string;
    details?: string;
  };
  overallRiskLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'FATAL';
  summaryVerdict: string;
  actionableGuidance: string;
}
