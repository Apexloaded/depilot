/**
 * LandGuard (Kóòkì AI) Tool Registry.
 */
export * from "./minna-to-wgs84.tool.js";
export * from "./cadastral-zoning.tool.js";
export * from "./survey-geometry.tool.js";
export * from "./missing-beacon-recovery.tool.js";

import { convertMinnaToWgs84Tool } from "./minna-to-wgs84.tool.js";
import { queryCadastralZoningTool } from "./cadastral-zoning.tool.js";
import { auditSurveyGeometryTool } from "./survey-geometry.tool.js";
import { reconstructMissingBeaconTool } from "./missing-beacon-recovery.tool.js";

export const landGuardTools = [
  convertMinnaToWgs84Tool,
  queryCadastralZoningTool,
  auditSurveyGeometryTool,
  reconstructMissingBeaconTool,
];
