/**
 * Centralized Spreadsheet → Entity Field Mapping
 * Single source of truth for all field definitions and mappings
 * Used by: UploadWizard, candidateSync, and all data import processes
 */

export const ENTITY_DEFINITIONS = {
  Candidate: {
    table: "candidates",
    required: ["full_name", "email"],
    optional: [
      "phone",
      "skills",
      "experience_years",
      "current_company",
      "current_job_role",
      "expected_ctc",
      "location",
      "source",
      "position",
      "notes",
      "linkedin_url"
    ],
    labels: {
      full_name: "Full Name",
      email: "Email",
      phone: "Phone",
      skills: "Skills",
      experience_years: "Experience (Yrs)",
      current_company: "Current Company",
      current_job_role: "Current Role",
      expected_ctc: "Expected CTC",
      location: "Location",
      source: "Source",
      position: "Position",
      notes: "Notes",
      linkedin_url: "LinkedIn URL"
    },
    defaults: { status: "Applied" },
    duplicateFields: ["email", "phone", "linkedin_url", "full_name"]
  },
  Client: {
    table: "clients",
    required: ["name"],
    optional: ["industry", "contact_person", "contact_email", "contact_phone", "address", "notes"],
    labels: {
      name: "Company Name",
      industry: "Industry",
      contact_person: "Contact Person",
      contact_email: "Email",
      contact_phone: "Phone",
      address: "Address",
      notes: "Notes"
    },
    defaults: { status: "Active" }
  },
  Lead: {
    table: "leads",
    required: ["company_name", "contact_person"],
    optional: ["email", "phone", "value", "source", "notes"],
    labels: {
      company_name: "Company",
      contact_person: "Contact",
      email: "Email",
      phone: "Phone",
      value: "Value",
      source: "Source",
      notes: "Notes"
    },
    defaults: { stage: "New Lead" }
  },
  Position: {
    table: "positions",
    required: ["title"],
    optional: [
      "client_name",
      "department",
      "experience_min",
      "experience_max",
      "skills_required",
      "location",
      "salary_min",
      "salary_max",
      "description",
      "openings"
    ],
    labels: {
      title: "Job Title",
      client_name: "Client",
      department: "Department",
      experience_min: "Min Exp",
      experience_max: "Max Exp",
      skills_required: "Skills Required",
      location: "Location",
      salary_min: "Min Salary",
      salary_max: "Max Salary",
      description: "Description",
      openings: "Openings"
    },
    defaults: { status: "Open", openings: 1 }
  },
  RevenueRecord: {
    table: "revenue_records",
    required: ["client_name", "amount", "date"],
    optional: ["recruiter_name", "candidate_name", "type", "invoice_number"],
    labels: {
      client_name: "Client",
      amount: "Amount",
      date: "Date",
      recruiter_name: "Recruiter",
      candidate_name: "Candidate",
      type: "Type",
      invoice_number: "Invoice #"
    },
    defaults: { status: "Pending", type: "Placement Fee" }
  },
  TeamGroup: {
    table: "team_groups",
    required: ["name"],
    optional: ["lead_name", "department", "members", "description"],
    labels: {
      name: "Team Name",
      lead_name: "Team Lead",
      department: "Department",
      members: "Members",
      description: "Description"
    },
    defaults: {}
  }
};

/**
 * Numeric fields that should be parsed as numbers
 */
export const NUMERIC_FIELDS = [
  "experience_years",
  "expected_ctc",
  "salary_min",
  "salary_max",
  "experience_min",
  "experience_max",
  "openings",
  "amount",
  "value"
];

/**
 * Spreadsheet-only columns that should not be synced to entities
 */
export const SPREADSHEET_ONLY_COLUMNS = [
  "_candidate_id",
  "_client_id",
  "_lead_id",
  "_position_id",
  "_synced_at",
  "_sync_status"
];

/**
 * Get entity definition by entity type
 * @param {string} entityType - e.g., "Candidate", "Client"
 * @returns {object} Entity definition
 */
export function getEntityDefinition(entityType) {
  const def = ENTITY_DEFINITIONS[entityType];
  if (!def) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  return def;
}

/**
 * Get all fields for an entity (required + optional)
 * @param {string} entityType
 * @returns {string[]} Array of field names
 */
export function getAllFields(entityType) {
  const def = getEntityDefinition(entityType);
  return [...def.required, ...def.optional];
}

/**
 * Get table name for entity type
 * @param {string} entityType
 * @returns {string} Table name
 */
export function getTableName(entityType) {
  return getEntityDefinition(entityType).table;
}

/**
 * Check if a row is completely empty (all values are empty/null)
 * @param {object} row - Spreadsheet row
 * @returns {boolean} True if row is empty
 */
export function isEmptyRow(row) {
  return Object.values(row).every(val => !val || String(val).trim() === "");
}
