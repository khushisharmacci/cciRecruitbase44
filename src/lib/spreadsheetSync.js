import { supabase } from "@/lib/supabase";
import { syncRowsToCandidates } from "@/lib/candidateSync";

// Save spreadsheet rows into data_files.rows_data and then sync candidates.
export async function saveSpreadsheetRows(fileId, rowsChanged) {
  if (!fileId) throw new Error("fileId required");

  // 1. Read existing data_files
  const { data: fileData, error: fileError } = await supabase
    .from("data_files")
    .select("id, rows_data")
    .eq("id", fileId)
    .single();

  if (fileError) throw fileError;

  let rows_data = fileData?.rows_data || [];
  const rowsMap = new Map();
  for (const r of rows_data) {
    // use id if present, else use row_order or generated key
    const key = r.id ?? r.row_id ?? r.row_order ?? JSON.stringify(r);
    rowsMap.set(String(key), r);
  }

  // Merge changed rows into rows_data
  for (const changed of rowsChanged) {
    const key = changed.id ?? changed.row_id ?? changed.row_order ?? changed._rowTempId ?? JSON.stringify(changed);
    const existing = rowsMap.get(String(key));
    if (existing) {
      rowsMap.set(String(key), { ...existing, ...changed });
    } else {
      rowsMap.set(String(key), changed);
    }
  }

  // Reconstruct rows_data array (preserve order if row_order exists)
  const mergedRows = Array.from(rowsMap.values());

  // Update the data_files.rows_data with single call
  const { error: updateError } = await supabase
    .from("data_files")
    .update({ rows_data: mergedRows })
    .eq("id", fileId);

  if (updateError) throw updateError;

  // 2. Sync candidates for changed rows
  try {
    await syncRowsToCandidates(fileId, rowsChanged);
  } catch (err) {
    console.error("candidate sync failed", err);
    // don't throw further; spreadsheet save already persisted
  }

  return mergedRows;
}
