import { supabase } from "@/lib/supabase";

export async function syncCallLogToSpreadsheet(log) {
  console.log("========== SPREADSHEET SYNC ==========");
  console.log("Incoming Log:", log);

  const spreadsheetId =
    log.spreadsheet_id ||
    log.data_file_id;

  if (!spreadsheetId) {
    console.log("❌ No spreadsheet selected.");
    return;
  }

  const { data: spreadsheet, error } = await supabase
    .from("data_files")
    .select("id, name, columns, rows_data")
    .eq("id", spreadsheetId)
    .single();

  if (error) {
    console.error("Spreadsheet Load Error:", error);
    throw error;
  }

  console.log("✅ Spreadsheet Loaded");
  console.log(spreadsheet);

  return spreadsheet;
}