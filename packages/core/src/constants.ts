/**
 * Application constants
 */

export const APP_NAME = "POtoOrder";
export const APP_VERSION = "0.1.0";

// Extraction confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5,
} as const;

// Queue names
export const QUEUES = {
  EXTRACTION: "extraction",
  MATCHING: "matching",
  ERP_PUSH: "erp-push",
  CATALOG_SYNC: "catalog-sync",
} as const;

// Supported ERP types
export const ERP_TYPES = {
  NETSUITE: "netsuite",
  SAP_B1: "sap-b1",
  PRONTO_XI: "pronto-xi",
  D365_FO: "d365-fo",
} as const;

// Supported document formats
export const DOCUMENT_FORMATS = {
  PDF: "pdf",
  XLSX: "xlsx",
  CSV: "csv",
  IMAGE: "image",
} as const;
