/**
 * @file index.ts
 * @description DealPilot Tool Registry. Centralizes and exports all tools 
 * available to the DealPilot Agent, separated by operational intent (Read vs Mutation).
 */

// Export all individual tools for direct imports elsewhere in the application
export * from './write/index.js';
export * from './read/index.js';

/**
 * Import all individual tools for direct imports elsewhere in the application
 */
import {
  extractPaymentDetailsTool,
  getDealHistoryTool,
  getDealTool,
  searchDealTool,
  verifyDealTool
} from './read/index.js'
import { createDealTool, applyPaymentToDealTool, createPaymentScheduleTool } from './write/index.js';


/**
 * Read-Only Tools Registry.
 * Contains tools that fetch, search, analyze, or verify deal data 
 * without modifying any state in the underlying database.
 * 
 * Note: Tools in this list that declare 'dealNumber' in their schemas 
 * are automatically guarded by the beforeToolCallback.
 */
export const readDealTools = [
  getDealTool,
  searchDealTool,
  getDealHistoryTool,
  extractPaymentDetailsTool,
  verifyDealTool,
] as const;

/**
 * State-Mutating Tools Registry.
 * Contains tools that create, update, delete, or transition deals 
 * and their associated subcollections in Firestore.
 */
export const mutatingDealTools = [
  applyPaymentToDealTool,
  createPaymentScheduleTool
];

/**
 * Consolidated Toolset for the DealPilot Agent.
 * This is the master list provided directly to the LlmAgent instance.
 */
export const dealPilotTools = [...readDealTools, ...mutatingDealTools];
