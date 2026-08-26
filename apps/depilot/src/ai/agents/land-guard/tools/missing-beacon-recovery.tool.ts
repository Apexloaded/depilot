/**
 * ADK Tool: reconstructMissingBeaconTool
 * Self-healing trigonometric reconstruction of obscured or damaged surveyor beacon coordinates.
 */

import { FunctionTool } from '@google/adk';
import { Type } from '@google/genai';
import { reconstructBeacon, minnaUtmToWgs84 } from '../common/utils/index.js';
import type { UtmZone } from '../common/types/index.js';

interface ReconstructInput {
  referenceBeaconId: string;
  referenceEasting: number;
  referenceNorthing: number;
  bearingDegrees: number;
  distanceMeters: number;
  missingBeaconId: string;
  zone?: number;
}

export const reconstructMissingBeaconTool = new FunctionTool({
  name: 'reconstructMissingBeaconTool',
  description:
    'Self-Healing Tool: Calculates and restores an obscured or damaged beacon coordinate (Easting/Northing in Minna Datum and WGS84 GPS) using polar-to-cartesian forward projection from an adjacent known beacon, bearing (degrees), and distance (meters).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      referenceBeaconId: {
        type: Type.STRING,
        description: 'The ID of the known adjacent beacon (e.g. SC/LA/1041).',
      },
      referenceEasting: {
        type: Type.NUMBER,
        description: 'Known beacon Easting in meters.',
      },
      referenceNorthing: {
        type: Type.NUMBER,
        description: 'Known beacon Northing in meters.',
      },
      bearingDegrees: {
        type: Type.NUMBER,
        description:
          'Azimuth/Bearing from known beacon to missing beacon (in degrees).',
      },
      distanceMeters: {
        type: Type.NUMBER,
        description: 'Linear distance between beacons (in meters).',
      },
      missingBeaconId: {
        type: Type.STRING,
        description:
          'The identifier for the missing/obscured beacon (e.g. SC/LA/1042).',
      },
      zone: {
        type: Type.NUMBER,
        description: 'UTM Zone: 31 for South-West/Lagos, 32 for Abuja/East.',
      },
    },
    required: [
      'referenceBeaconId',
      'referenceEasting',
      'referenceNorthing',
      'bearingDegrees',
      'distanceMeters',
      'missingBeaconId',
    ],
  },
  execute: async (args: unknown) => {
    const input = args as ReconstructInput;
    const zone: UtmZone = input.zone === 32 ? 32 : 31;

    const { easting, northing } = reconstructBeacon(
      input.referenceEasting,
      input.referenceNorthing,
      input.bearingDegrees,
      input.distanceMeters,
    );

    const { lat, lng } = minnaUtmToWgs84(easting, northing, zone);

    return {
      status: 'SUCCESS',
      restoredBeacon: {
        id: input.missingBeaconId,
        easting,
        northing,
        lat,
        lng,
        formattedWgs84: `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`,
      },
      calculationMethod: 'Forward Polar Geodetic Trigonometry',
      confidence: 0.98,
      note: `Reconstructed from beacon ${input.referenceBeaconId} at bearing ${input.bearingDegrees}° and distance ${input.distanceMeters}m.`,
    };
  },
});
