/**
 * Candidate Synchronization Service
 * Handles: Spreadsheet → Candidate sync
 * - Create new candidates
 * - Update existing candidates (via duplicate detection)
 * - Save candidate IDs back to spreadsheet
 */

import { supabase } from "./supabase";
import { findDuplicateCandidate } from "./duplicateDetection";
import { isEmptyRow } from "./spreadsheetMapping";

/**
 * Sync spreadsheet rows to candidates
 * Called after successful spreadsheet save in data_files
 * 
 * @param {string} dataFileId - ID of the data_files record
 * @param {array} rows - Spreadsheet rows to sync
 * @param {object} mappings - Column → Field mappings
 * @param {string} companyId - Company ID for filtering
 * @param {object} customFields - Custom field definitions
 * @returns {object} Sync result { created: [], updated: [], failed: [], errors: [] }
 */
export async function syncSpreadsheetRowsToCandidates(
  dataFileId,
  rows,
  mappings,
  companyId,
  customFields = []
) {
  const result = {
    created: [],
    updated: [],
    failed: [],
    errors: []
  };

  if (!rows || rows.length === 0) {
    return result;
  }

  try {
    // Fetch existing candidates for duplicate detection
    const { data: existingCandidates, error: fetchError } = await supabase
      .from("candidates")
      .select("*")
      .eq("company_id", companyId);

    if (fetchError) {
      throw new Error(`Failed to fetch existing candidates: ${fetchError.message}`);
    }

    // Process each row
    const updatedRows = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const promises = batch.map((row, index) =>
        processRow(row, i + index, mappings, existingCandidates, companyId, customFields, updatedRows, result)
      );
      await Promise.all(promises);
    }

    // Save updated rows back to data_files.rows_data
    if (updatedRows.length > 0) {
      const { error: updateError } = await supabase
        .from("data_files")
        .update({ rows_data: updatedRows })
        .eq("id", dataFileId);

      if (updateError) {
        console.error("Failed to update spreadsheet with candidate IDs:", updateError);
      }
    }
  } catch (err) {
    result.errors.push({
      message: err.message || "Unknown error during sync",
      code: err.code
    });
  }

  return result;
}

/**
 * Process a single row: create or update candidate
 */
async function processRow(
  row,
  rowIndex,
  mappings,
  existingCandidates,
  companyId,
  customFields,
  updatedRows,
  result
) {
  try {
    // Skip empty rows
    if (isEmptyRow(row)) {
      return;
    }

    // Convert row to candidate record using mappings
    const candidateRecord = convertRowToCandidate(row, mappings, customFields);

    // Validate required fields
    if (!candidateRecord.full_name || !candidateRecord.email) {
      result.failed.push({
        rowIndex,
        row,
        reason: "Missing required fields (full_name or email)"
      });
      return;
    }

    // Check for duplicates
    const duplicate = findDuplicateCandidate(candidateRecord, existingCandidates);

    if (duplicate) {
      // Update existing candidate
      const { error: updateError } = await supabase
        .from("candidates")
        .update(candidateRecord)
        .eq("id", duplicate.id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      // Update local reference
      const index = existingCandidates.findIndex(c => c.id === duplicate.id);
      if (index >= 0) {
        existingCandidates[index] = { ...existingCandidates[index], ...candidateRecord };
      }

      result.updated.push({
        rowIndex,
        candidateId: duplicate.id,
        changes: candidateRecord
      });

      // Save candidate ID back to row
      updatedRows[rowIndex] = { ...row, _candidate_id: duplicate.id };
    } else {
      // Create new candidate
      const { data: created, error: createError } = await supabase
        .from("candidates")
        .insert([{ ...candidateRecord, company_id: companyId }])
        .select();

      if (createError) {
        throw new Error(`Insert failed: ${createError.message}`);
      }

      if (created && created.length > 0) {
        const newCandidate = created[0];
        existingCandidates.push(newCandidate);

        result.created.push({
          rowIndex,
          candidateId: newCandidate.id
        });

        // Save candidate ID back to row
        updatedRows[rowIndex] = { ...row, _candidate_id: newCandidate.id };
      }
    }
  } catch (err) {
    result.failed.push({
      rowIndex,
      row,
      reason: err.message
    });
  }
}

/**
 * Convert spreadsheet row to candidate record
 * Uses mappings to map columns to fields
 */
function convertRowToCandidate(row, mappings, customFields = []) {
  const NUMERIC_FIELDS = ["experience_years", "expected_ctc"];
  const record = { status: "Applied" };
  const customData = {};

  Object.entries(mappings).forEach(([header, field]) => {
    if (!field || row[header] === undefined || row[header] === "") return;

    const val = row[header];
    let converted = val;

    // Parse numeric fields
    if (NUMERIC_FIELDS.includes(field)) {
      converted = parseFloat(val) || undefined;
    }

    // Check if custom field
    if (customFields.find(cf => cf.key === field)) {
      customData[field] = converted;
    } else {
      record[field] = converted;
    }
  });

  // Append custom fields to notes
  if (Object.keys(customData).length > 0) {
    record.notes = record.notes
      ? record.notes + "\n\nCustom Fields: " + JSON.stringify(customData, null, 2)
      : "Custom Fields: " + JSON.stringify(customData, null, 2);
  }

  return record;
}

/**
 * Invalidate candidates cache in React Query
 * Call after sync completes
 */
export function invalidateCandidatesCache(queryClient) {
  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: ["candidates"] });
  }
}
