/**
 * ADK Tool: convertMinnaToWgs84Tool
 * Converts Nigerian Minna Datum UTM coordinates to WGS84 GPS (Lat/Lng) via Proj4.
 */

import { FunctionTool } from '@google/adk';
import { Type } from '@google/genai';
import { minnaUtmToWgs84 } from '../common/utils/index.js';
import type { UtmZone, Wgs84Coordinate } from '../common/types/index.js';

interface ConvertMinnaInput {
  beacons: Array<{
    id: string;
    easting: number;
    northing: number;
  }>;
  zone?: number;
}

export const convertMinnaToWgs84Tool = new FunctionTool({
  name: 'convertMinnaToWgs84Tool',
  description:
    'Converts Nigerian legacy Minna Datum UTM coordinates (Easting/Northing in meters) to standard WGS84 GPS (Latitude, Longitude in decimal degrees). Use UTM Zone 31 for South-Western Nigeria (Lagos, Ogun, Oyo, Osun, Ondo, Edo) or Zone 32 for Central/Eastern/Northern Nigeria (Abuja, Port Harcourt, Enugu, Kano).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      zone: {
        type: Type.NUMBER,
        description:
          'UTM Zone: 31 for Lagos/Ogun/South-West, 32 for Abuja/FCT/Port Harcourt/East.',
      },
      beacons: {
        type: Type.ARRAY,
        description:
          'List of beacon objects with id (e.g. SC/LA/1041), easting (meters), and northing (meters).',
        items: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description:
                'Surveyor beacon identifier, e.g. SC/LA/1041 or BK/OG/88.',
            },
            easting: {
              type: Type.NUMBER,
              description: 'Easting coordinate in meters (e.g. 582104.32).',
            },
            northing: {
              type: Type.NUMBER,
              description: 'Northing coordinate in meters (e.g. 714902.18).',
            },
          },
          required: ['id', 'easting', 'northing'],
        },
      },
    },
    required: ['beacons'],
  },
  execute: async (args: unknown) => {
    const input = args as ConvertMinnaInput;
    if (!input || !Array.isArray(input.beacons) || input.beacons.length === 0) {
      return {
        status: 'ERROR',
        message: 'No beacon coordinates provided for transformation.',
      };
    }

    const zone: UtmZone = input.zone === 32 ? 32 : 31;
    const transformed: Wgs84Coordinate[] = input.beacons.map((b) => {
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

    const ring = transformed.map((t) => [t.lng, t.lat]);

    return {
      status: 'SUCCESS',
      sourceDatum: `Minna Datum UTM Zone ${zone}N (EPSG:${zone === 31 ? '26331' : '26332'})`,
      targetDatum: 'WGS84 GPS (EPSG:4326)',
      transformedCount: transformed.length,
      coordinates: transformed,
      polygonCoordinates: transformed.map((t) => ({ lat: t.lat, lng: t.lng })),
      polygonGeoJsonString: JSON.stringify({
        type: 'Polygon',
        coordinates: [ring],
      }),
    };
  },
});
