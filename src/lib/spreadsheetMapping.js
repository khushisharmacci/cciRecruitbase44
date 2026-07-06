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
    defaults: { status: "Applied" }
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

export function getEntityDefinition(entityType) {
  const def = ENTITY_DEFINITIONS[entityType];
  if (!def) throw new Error(`Unknown entity type: ${entityType}`);
  return def;
}

export function isEmptyRow(row) {
  return Object.values(row).every(val => !val || String(val).trim() === "");
}
