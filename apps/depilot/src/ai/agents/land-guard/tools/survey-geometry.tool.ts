/**
 * ADK Tool: auditSurveyGeometryTool
 * Performs geometric closure, Shoelace polygon area calculation,
 * and boundary variance tests on surveyor beacon coordinates.
 */

import { FunctionTool } from '@google/adk';
import { Type } from '@google/genai';
import {
  auditPolygonGeometry,
  minnaUtmToWgs84,
} from '../common/utils/index.js';
import type {
  UtmZone,
  BeaconInput,
  Wgs84Coordinate,
} from '../common/types/index.js';

interface AuditGeometryInput {
  beacons: Array<{
    id: string;
    easting: number;
    northing: number;
  }>;
  declaredAreaSqm?: number;
  zone?: number;
}

export const auditSurveyGeometryTool = new FunctionTool({
  name: 'auditSurveyGeometryTool',
  description:
    'Audits the geometric closure, calculates true polygon area (in square meters, Lagos standard plots, and hectares) using the Shoelace formula, and checks for mathematical discrepancies against the surveyor declared area on the survey plan sheet.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      declaredAreaSqm: {
        type: Type.NUMBER,
        description:
          'The declared parcel area in square meters printed on the survey plan.',
      },
      zone: {
        type: Type.NUMBER,
        description:
          'UTM Zone: 31 for South-West / Lagos / Ogun, 32 for Abuja / East.',
      },
      beacons: {
        type: Type.ARRAY,
        description:
          'List of beacon coordinate pairs in order around the perimeter.',
        items: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: 'Beacon ID (e.g. SC/LA/1041)',
            },
            easting: { type: Type.NUMBER, description: 'Easting (meters)' },
            northing: { type: Type.NUMBER, description: 'Northing (meters)' },
          },
          required: ['id', 'easting', 'northing'],
        },
      },
    },
    required: ['beacons'],
  },
  execute: async (args: unknown) => {
    const input = args as AuditGeometryInput;
    if (!input || !Array.isArray(input.beacons) || input.beacons.length < 3) {
      return {
        status: 'ERROR',
        message:
          'At least 3 beacon coordinates are required to audit polygon geometry.',
      };
    }

    const zone: UtmZone = input.zone === 32 ? 32 : 31;
    const beacons: BeaconInput[] = input.beacons;

    const wgs84Coords: Wgs84Coordinate[] = beacons.map((b) => {
      const { lat, lng } = minnaUtmToWgs84(b.easting, b.northing, zone);
      return {
        id: b.id,
        easting: b.easting,
        northing: b.northing,
        lat,
        lng,
        formatted: `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`,
      };
    });

    const audit = auditPolygonGeometry(
      beacons,
      wgs84Coords,
      input.declaredAreaSqm,
    );

    return {
      status: 'SUCCESS',
      geometricAudit: {
        isPolygonClosed: audit.isPolygonClosed,
        totalPerimeterMeters: audit.totalPerimeterMeters,
        calculatedAreaSqm: audit.calculatedAreaSqm,
        calculatedAreaPlots: audit.calculatedAreaPlots,
        calculatedAreaHectares: audit.calculatedAreaHectares,
        declaredAreaSqm: audit.declaredAreaSqm,
        areaVariancePercentage: audit.areaVariancePercentage,
        closureStatus: audit.closureStatus,
      },
      polygonCoordinates: wgs84Coords.map((c) => ({ lat: c.lat, lng: c.lng })),
      polygonGeoJsonString: JSON.stringify(audit.polygonGeoJson),
      standardPlotsCount: audit.calculatedAreaPlots,
      hectaresCount: audit.calculatedAreaHectares,
      verdict:
        audit.closureStatus === 'PERFECT'
          ? 'Polygon has verified mathematical closure and consistent area.'
          : audit.closureStatus === 'ACCEPTABLE'
            ? 'Minor variance between declared and calculated area (<2%). Acceptable survey tolerance.'
            : 'SIGNIFICANT DEVIATION DETECTED: Computed area differs from surveyor declared area by >2%. Potential survey forgery or boundary distortion.',
    };
  },
});
