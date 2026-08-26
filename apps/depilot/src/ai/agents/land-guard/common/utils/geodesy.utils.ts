/**
 * Geodetic & Spatial Engine for Nigerian Land Surveying using Proj4.
 * Uses official EPSG definitions for Minna Datum (EPSG:26331 / EPSG:26332)
 * with Clarke 1880 Ellipsoid and standard Nigerian 3-parameter Molodensky shift.
 */

import proj4 from 'proj4';
import type {
  UtmZone,
  Wgs84Coordinate,
  GeometricAuditResult,
  BeaconInput,
} from '../types/cadastral.types.js';

// Define Minna Datum UTM Zone 31N (Lagos, Ogun, Oyo, Osun, Ondo, Ekiti, Edo, Delta)
proj4.defs(
  'EPSG:26331',
  '+proj=utm +zone=31 +a=6378249.145 +rf=293.465 +towgs84=-92,-93,122,0,0,0,0 +units=m +no_defs',
);

// Define Minna Datum UTM Zone 32N (Abuja / FCT, Enugu, Rivers, Kano, Kaduna, Cross River)
proj4.defs(
  'EPSG:26332',
  '+proj=utm +zone=32 +a=6378249.145 +rf=293.465 +towgs84=-92,-93,122,0,0,0,0 +units=m +no_defs',
);

// Standard WGS84 GPS Lat/Long
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

const DEG_TO_RAD = Math.PI / 180.0;

/**
 * Converts Minna Datum UTM (Zone 31 or 32) coordinates into WGS84 GPS (Lat, Lng) using Proj4.
 */
export function minnaUtmToWgs84(
  easting: number,
  northing: number,
  zone: UtmZone = 31,
): { lat: number; lng: number } {
  const epsgSource = zone === 32 ? 'EPSG:26332' : 'EPSG:26331';
  const [lng, lat] = proj4(epsgSource, 'EPSG:4326', [easting, northing]);

  return {
    lat: Number(lat.toFixed(7)),
    lng: Number(lng.toFixed(7)),
  };
}

/**
 * Converts standard WGS84 GPS (Lat, Lng) to Minna Datum UTM coordinates using Proj4.
 */
export function wgs84ToMinnaUtm(
  lat: number,
  lng: number,
  zone: UtmZone = 31,
): { easting: number; northing: number } {
  const epsgTarget = zone === 32 ? 'EPSG:26332' : 'EPSG:26331';
  const [easting, northing] = proj4('EPSG:4326', epsgTarget, [lng, lat]);

  return {
    easting: Number(easting.toFixed(2)),
    northing: Number(northing.toFixed(2)),
  };
}

/**
 * Calculates geometric closure, perimeter, and area in SQM, Plots, and Hectares
 * using the Shoelace formula on projected coordinates.
 */
export function auditPolygonGeometry(
  beacons: BeaconInput[],
  wgs84Coords: Wgs84Coordinate[],
  declaredAreaSqm?: number,
): GeometricAuditResult {
  if (beacons.length < 3) {
    throw new Error(
      'A cadastral parcel must contain at least 3 boundary beacons.',
    );
  }

  // 1. Check Closure: If last beacon does not match first, close the polygon
  const first = beacons[0]!;
  const last = beacons[beacons.length - 1]!;
  const isClosed =
    first.id === last.id ||
    (Math.abs(first.easting - last.easting) < 0.1 &&
      Math.abs(first.northing - last.northing) < 0.1);

  const workingBeacons = isClosed ? [...beacons] : [...beacons, beacons[0]];
  const workingWgs84 = isClosed
    ? [...wgs84Coords]
    : [...wgs84Coords, wgs84Coords[0]];

  // 2. Compute Perimeter
  let totalPerimeter = 0;
  for (let i = 0; i < workingBeacons.length - 1; i++) {
    const currentBeacon = workingBeacons[i]!;
    const nextBeacon = workingBeacons[i + 1]!;
    const dx = nextBeacon.easting - currentBeacon.easting;
    const dy = nextBeacon.northing - currentBeacon.northing;
    totalPerimeter += Math.sqrt(dx * dx + dy * dy);
  }

  // 3. Compute Area using Shoelace formula
  let doubleArea = 0;
  for (let i = 0; i < workingBeacons.length - 1; i++) {
    const currentBeacon = workingBeacons[i]!;
    const nextBeacon = workingBeacons[i + 1]!;
    const x1 = currentBeacon.easting;
    const y1 = currentBeacon.northing;
    const x2 = nextBeacon.easting;
    const y2 = nextBeacon.northing;
    doubleArea += x1 * y2 - x2 * y1;
  }

  const calculatedAreaSqm = Number((Math.abs(doubleArea) / 2.0).toFixed(2));
  // 1 Standard Lagos/Nigeria Plot = ~648 - 669 sqm (60ft x 120ft = 648 sqm)
  const calculatedAreaPlots = Number((calculatedAreaSqm / 648.0).toFixed(2));
  const calculatedAreaHectares = Number(
    (calculatedAreaSqm / 10000.0).toFixed(4),
  );

  let areaVariancePercentage: number | undefined;
  let closureStatus: 'PERFECT' | 'ACCEPTABLE' | 'DEVIATION_DETECTED' =
    'PERFECT';

  if (declaredAreaSqm && declaredAreaSqm > 0) {
    areaVariancePercentage = Number(
      (
        (Math.abs(calculatedAreaSqm - declaredAreaSqm) / declaredAreaSqm) *
        100
      ).toFixed(3),
    );
    if (areaVariancePercentage > 2.0) {
      closureStatus = 'DEVIATION_DETECTED';
    } else if (areaVariancePercentage > 0.1) {
      closureStatus = 'ACCEPTABLE';
    }
  }

  // GeoJSON coordinate structure: [ [ [lng, lat], ... ] ]
  const ring = workingWgs84.map((c) => [c!.lng, c!.lat]);

  return {
    isPolygonClosed: isClosed,
    totalPerimeterMeters: Number(totalPerimeter.toFixed(2)),
    calculatedAreaSqm,
    calculatedAreaPlots,
    calculatedAreaHectares,
    declaredAreaSqm,
    areaVariancePercentage,
    closureStatus,
    polygonGeoJson: {
      type: 'Polygon',
      coordinates: [ring],
    },
  };
}

/**
 * Self-Healing Trigonometric Calculation for restoring a damaged or obscured beacon.
 * Uses Polar-to-Cartesian forward projection:
 * E2 = E1 + Distance * sin(Bearing)
 * N2 = N1 + Distance * cos(Bearing)
 */
export function reconstructBeacon(
  referenceEasting: number,
  referenceNorthing: number,
  bearingDeg: number,
  distanceMeters: number,
): { easting: number; northing: number } {
  const bearingRad = bearingDeg * DEG_TO_RAD;
  const easting = referenceEasting + distanceMeters * Math.sin(bearingRad);
  const northing = referenceNorthing + distanceMeters * Math.cos(bearingRad);

  return {
    easting: Number(easting.toFixed(2)),
    northing: Number(northing.toFixed(2)),
  };
}

/**
 * Tests if a point (lng, lat) is inside a polygon using ray casting.
 */
export function isPointInPolygon(
  point: [number, number],
  polygonRing: number[][],
): boolean {
  const [x, y] = point; // [lng, lat]
  let inside = false;

  for (let i = 0, j = polygonRing.length - 1; i < polygonRing.length; j = i++) {
    const currentPoint = polygonRing[i]!;
    const previousPoint = polygonRing[j]!;
    const xi = currentPoint[0]!;
    const yi = currentPoint[1]!;
    const xj = previousPoint[0]!;
    const yj = previousPoint[1]!;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}
