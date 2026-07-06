/**
 * Candidate Synchronization Service
 * Spreadsheet → Candidate sync after successful save
 */

import { supabase } from "./supabase";
import { findDuplicateCandidate } from "./duplicateDetection";
import { isEmptyRow, NUMERIC_FIELDS } from "./spreadsheetMapping";

export async function syncSpreadsheetRowsToCandidates(
  dataFileId,
  rows,
  mappings,
  companyId,
  customFields = []
) {
  const result = { created: [], updated: [], failed: [], errors: [] };

  if (!rows || rows.length === 0) return result;

  try {
    const { data: existingCandidates, error: fetchError } = await supabase
      .from("candidates")
      .select("*")
      .eq("company_id", companyId);

    if (fetchError) throw new Error(`Failed to fetch candidates: ${fetchError.message}`);

    const updatedRows = [...rows];
    const BATCH_SIZE = 10;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((row, index) =>
        processRow(row, i + index, mappings, existingCandidates, companyId, customFields, updatedRows, result)
      ));
    }

    // Save candidate IDs back to spreadsheet
    if (updatedRows.some(r => r._candidate_id)) {
      const { error: updateError } = await supabase
        .from("data_files")
        .update({ rows_data: updatedRows })
        .eq("id", dataFileId);

      if (updateError) console.error("Failed to update spreadsheet:", updateError);
    }
  } catch (err) {
    result.errors.push({ message: err.message, code: err.code });
  }

  return result;
}

async function processRow(row, rowIndex, mappings, existingCandidates, companyId, customFields, updatedRows, result) {
  try {
    if (isEmptyRow(row)) return;

    const candidateRecord = convertRowToCandidate(row, mappings, customFields);

    if (!candidateRecord.full_name || !candidateRecord.email) {
      result.failed.push({ rowIndex, row, reason: "Missing full_name or email" });
      return;
    }

    const duplicate = findDuplicateCandidate(candidateRecord, existingCandidates);

    if (duplicate) {
      const { error: updateError } = await supabase
        .from("candidates")
        .update(candidateRecord)
        .eq("id", duplicate.id);

      if (updateError) throw new Error(`Update failed: ${updateError.message}`);

      const index = existingCandidates.findIndex(c => c.id === duplicate.id);
      if (index >= 0) existingCandidates[index] = { ...existingCandidates[index], ...candidateRecord };

      result.updated.push({ rowIndex, candidateId: duplicate.id, changes: candidateRecord });
      updatedRows[rowIndex] = { ...row, _candidate_id: duplicate.id };
    } else {
      const { data: created, error: createError } = await supabase
        .from("candidates")
        .insert([{ ...candidateRecord, company_id: companyId }])
        .select();

      if (createError) throw new Error(`Insert failed: ${createError.message}`);
      if (created && created.length > 0) {
        const newCandidate = created[0];
        existingCandidates.push(newCandidate);
        result.created.push({ rowIndex, candidateId: newCandidate.id });
        updatedRows[rowIndex] = { ...row, _candidate_id: newCandidate.id };
      }
    }
  } catch (err) {
    result.failed.push({ rowIndex, row, reason: err.message });
  }
}

function convertRowToCandidate(row, mappings, customFields = []) {
  const record = { status: "Applied" };
  const customData = {};

  Object.entries(mappings).forEach(([header, field]) => {
    if (!field || row[header] === undefined || row[header] === "") return;
    const val = row[header];
    let converted = val;
    if (NUMERIC_FIELDS.includes(field)) converted = parseFloat(val) || undefined;

    if (customFields.find(cf => cf.key === field)) {
      customData[field] = converted;
    } else {
      record[field] = converted;
    }
  });

  if (Object.keys(customData).length > 0) {
    record.notes = record.notes
      ? record.notes + "\n\nCustom Fields: " + JSON.stringify(customData, null, 2)
      : "Custom Fields: " + JSON.stringify(customData, null, 2);
  }

  return record;
}

export function invalidateCandidatesCache(queryClient) {
  if (queryClient) queryClient.invalidateQueries({ queryKey: ["candidates"] });
}
