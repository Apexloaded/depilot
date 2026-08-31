export interface TopographyPoint {
  lat: number;
  lng: number;
  elevationMeters: number;
}

export interface TopographyResult {
  minElevationMeters: number;
  maxElevationMeters: number;
  avgElevationMeters: number;
  elevationRangeMeters: number;
  slopeGradientPercentage: number;
  terrainType: 'FLAT' | 'GENTLE_SLOPE' | 'MODERATE_SLOPE' | 'STEEP_SLOPE';
  floodVulnerability: 'FATAL' | 'HIGH' | 'MODERATE' | 'LOW';
  elevationPoints: TopographyPoint[];
  summaryVerdict: string;
  actionableGuidance: string;
}
