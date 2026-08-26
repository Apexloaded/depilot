/**
 * ADK Tool: queryCadastralZoningTool
 * Evaluates parcel polygon boundaries against Nigerian Government Acquisition Zones,
 * Infrastructure corridors, and Gazette Excision records.
 */

import { FunctionTool } from '@google/adk';
import { Type } from '@google/genai';
import { isPointInPolygon } from '../common/utils/index.js';
import {
  CADASTRAL_ZONES,
  GAZETTE_EXCISIONS,
} from '../common/data/cadastral.data.js';
import type {
  CadastralZoningResult,
  CadastralEncroachment,
  AcquisitionStatus,
} from '../common/types/index.js';

interface QueryZoningInput {
  polygonCoordinates?: Array<[number, number] | { lat: number; lng: number }>;
  points?: Array<{ lat: number; lng: number }>;
  claimedGazetteNumber?: string;
  state?: string;
}

export const queryCadastralZoningTool = new FunctionTool({
  name: 'queryCadastralZoningTool',
  description:
    'Queries the Nigerian Cadastral Masterplan database to check if a parcel polygon encroaches on Committed Government Acquisition zones (e.g. Lagos-Calabar Coastal Highway buffer, 4th Mainland Bridge corridor, TCN high-tension powerlines, drainage alignments) or is verified under an official Gazette Excision.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      points: {
        type: Type.ARRAY,
        description:
          'Array of coordinate objects with lat and lng in WGS84 format.',
        items: {
          type: Type.OBJECT,
          properties: {
            lat: {
              type: Type.NUMBER,
              description: 'Latitude in decimal degrees',
            },
            lng: {
              type: Type.NUMBER,
              description: 'Longitude in decimal degrees',
            },
          },
          required: ['lat', 'lng'],
        },
      },
      claimedGazetteNumber: {
        type: Type.STRING,
        description:
          'Optional Gazette Number claimed on the survey or deed (e.g. 14, 22).',
      },
      state: {
        type: Type.STRING,
        description:
          'State where the land is situated (e.g. Lagos, Abuja, Ogun).',
      },
    },
  },
  execute: async (args: unknown): Promise<CadastralZoningResult> => {
    const input = args as QueryZoningInput;

    let coords: Array<[number, number]> = [];
    if (Array.isArray(input.points) && input.points.length > 0) {
      coords = input.points.map((p) => [p.lng, p.lat]);
    } else if (
      Array.isArray(input.polygonCoordinates) &&
      input.polygonCoordinates.length > 0
    ) {
      coords = input.polygonCoordinates.map((item) => {
        if (Array.isArray(item)) return [item[0], item[1]];
        return [(item as { lng: number }).lng, (item as { lat: number }).lat];
      });
    }

    if (coords.length < 3) {
      return {
        acquisitionStatus: 'FREE_UNENCUMBERED',
        primaryZoneName: 'Unspecified Parcel',
        isCommittedAcquisition: false,
        encroachments: [],
        gazetteMatch: {
          matched: false,
          details: 'Insufficient coordinate points provided.',
        },
        overallRiskLevel: 'MEDIUM',
        summaryVerdict:
          'Unable to verify cadastre due to insufficient polygon vertices.',
        actionableGuidance:
          'Provide at least 3 valid GPS boundary coordinates.',
      };
    }

    const encroachments: CadastralEncroachment[] = [];
    let isCommittedAcquisition = false;
    let worstSeverity: 'FATAL' | 'CRITICAL' | 'WARNING' | 'NONE' = 'NONE';

    for (const zone of CADASTRAL_ZONES) {
      let pointsInside = 0;
      for (const pt of coords) {
        if (isPointInPolygon(pt, zone.polygon)) {
          pointsInside++;
        }
      }

      if (pointsInside > 0) {
        const percentage = Number(
          ((pointsInside / coords.length) * 100).toFixed(1),
        );
        const severity: 'FATAL' | 'CRITICAL' | 'WARNING' = zone.isCommitted
          ? 'FATAL'
          : 'WARNING';

        if (zone.isCommitted) isCommittedAcquisition = true;
        if (severity === 'FATAL') worstSeverity = 'FATAL';

        encroachments.push({
          zoneName: zone.name,
          zoneType: zone.type,
          severity,
          encroachmentPercentage: percentage,
          demolitionRisk: zone.isCommitted ? 'IMMINENT' : 'HIGH',
          description: `${zone.description} - ${zone.penaltyOrAction}`,
          gazetteNumber: zone.gazetteNumber,
        });
      }
    }

    let gazetteMatch = {
      matched: false,
      gazetteNo: undefined as string | undefined,
      excisionName: undefined as string | undefined,
      details: 'No active gazette excision found covering this exact polygon.',
    };

    for (const excision of GAZETTE_EXCISIONS) {
      let pointsInsideExcision = 0;
      for (const pt of coords) {
        if (isPointInPolygon(pt, excision.boundaryPolygon)) {
          pointsInsideExcision++;
        }
      }

      if (pointsInsideExcision >= coords.length * 0.5) {
        const matchesClaim = input.claimedGazetteNumber
          ? excision.gazetteNo
              .toLowerCase()
              .includes(input.claimedGazetteNumber.toLowerCase())
          : true;

        gazetteMatch = {
          matched: true,
          gazetteNo: excision.gazetteNo,
          excisionName: excision.communityName,
          details: matchesClaim
            ? `Verified in Lagos State Gazette No. ${excision.gazetteNo}, Vol ${excision.volume} (Year ${excision.year}).`
            : `Land falls inside Gazette No. ${excision.gazetteNo}, but claimed gazette number was ${input.claimedGazetteNumber}.`,
        };
        break;
      }
    }

    let acquisitionStatus: AcquisitionStatus = 'FREE_UNENCUMBERED';
    let overallRiskLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'FATAL' =
      'CLEAN';
    let summaryVerdict =
      'Land parcel is FREE from government committed acquisition.';
    let actionableGuidance =
      'Proceed with standard title search and Governor Consent perfection.';

    if (isCommittedAcquisition) {
      acquisitionStatus = 'COMMITTED_ACQUISITION';
      overallRiskLevel = 'FATAL';
      summaryVerdict = `FATAL RISK: Parcel overlaps with ${encroachments.map((e) => e.zoneName).join(', ')}. High likelihood of demolition without state compensation.`;
      actionableGuidance =
        'DO NOT PROCEED with purchase. Immediate fund retrieval recommended.';
    } else if (gazetteMatch.matched) {
      acquisitionStatus = 'EXCISED_GAZETTE_VERIFIED';
      overallRiskLevel = 'CLEAN';
      summaryVerdict = `EXCISED TITLE: Verified within ${gazetteMatch.excisionName} (Gazette No. ${gazetteMatch.gazetteNo}).`;
      actionableGuidance =
        'Verify that the selling family holds legitimate customary power of attorney under this excision.';
    } else if (encroachments.length > 0) {
      acquisitionStatus = 'GLOBAL_UNCOMMITTED_ACQUISITION';
      overallRiskLevel = 'HIGH';
      summaryVerdict = `HIGH RISK: Parcel falls under general state acquisition (${encroachments[0]?.zoneName}).`;
      actionableGuidance =
        'Regularization via Governor Consent / Ratification will require substantial statutory fees.';
    }

    return {
      acquisitionStatus,
      primaryZoneName:
        encroachments.length > 0
          ? (encroachments[0]?.zoneName ?? 'Uncommitted Area')
          : 'Uncommitted Area',
      isCommittedAcquisition,
      encroachments,
      gazetteMatch,
      overallRiskLevel,
      summaryVerdict,
      actionableGuidance,
    };
  },
});
