import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { saveSpreadsheetRows } from "@/lib/spreadsheetSync";

// Simple debounce utility
function useDebouncedCallback(cb, delay) {
  const timeout = useRef(null);
  return useCallback(
    (...args) => {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => cb(...args), delay);
    },
    [cb, delay]
  );
}

export default function useSpreadsheet(fileId) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortColumn, setSortColumn] = useState("full_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [saving, setSaving] = useState(false);

  const dirtyRef = useRef(new Map());
  const rowsRef = useRef([]);
  const [, forceRerender] = useState(0);

  const { data: initialFile, isLoading, error, refetch } = useQuery({
    queryKey: ["spreadsheet-file", fileId],
    queryFn: async () => {
      // Try to load data_files.rows_data first
      const { data: fileData, error: fileError } = await supabase
        .from("data_files")
        .select("id, rows_data")
        .eq("id", fileId)
        .single();

      if (fileError && fileError.code !== "PGRST112") {
        // If not found, fall back to candidates query
        // (PGRST112 is an example; Supabase error codes may differ)
        // We'll still attempt candidates query below
      }

      if (fileData && fileData.rows_data && fileData.rows_data.length) {
        return fileData.rows_data;
      }

      // Fallback: build rows from candidates table
      const { data, error: cErr } = await supabase
        .from("candidates")
        .select("*")
        .eq("data_file_id", fileId)
        .order("created_at");

      if (cErr) throw cErr;

      // Convert candidate rows to spreadsheet rows (keep original fields)
      return data ?? [];
    },
    enabled: !!fileId,
  });

  // rowsRef always holds the latest rows; we expose rows via memo
  useEffect(() => {
    rowsRef.current = initialFile || [];
    forceRerender((n) => n + 1);
  }, [initialFile]);

  const rows = useMemo(() => {
    let list = [...(rowsRef.current || [])];

    if (search) {
      list = list.filter((row) =>
        Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    list.sort((a, b) => {
      const first = (a[sortColumn] ?? "").toString();
      const second = (b[sortColumn] ?? "").toString();

      return sortDirection === "asc"
        ? first.localeCompare(second)
        : second.localeCompare(first);
    });

    return list;
  }, [search, sortColumn, sortDirection, rowsRef.current, saving]);

  function sort(column) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  // Update local cell and mark row dirty
  function updateLocalCell(rowId, column, value) {
    // update rowsRef
    const idx = rowsRef.current.findIndex((r) => String(r.id) === String(rowId));
    if (idx === -1) {
      // If row not found, maybe it's a temp new row; try match by row_order
      const idx2 = rowsRef.current.findIndex((r) => String(r.row_order) === String(rowId));
      if (idx2 === -1) return;
      rowsRef.current[idx2] = { ...rowsRef.current[idx2], [column]: value };
      dirtyRef.current.set(rowsRef.current[idx2].id ?? rowsRef.current[idx2].row_order ?? idx2, { ...(dirtyRef.current.get(rowsRef.current[idx2].id) || {}), [column]: value, id: rowsRef.current[idx2].id ?? rowsRef.current[idx2].row_order });
    } else {
      rowsRef.current[idx] = { ...rowsRef.current[idx], [column]: value };
      dirtyRef.current.set(rowsRef.current[idx].id ?? rowsRef.current[idx].row_order ?? idx, { ...(dirtyRef.current.get(rowsRef.current[idx].id) || {}), [column]: value, id: rowsRef.current[idx].id });
    }

    // cause rerender
    forceRerender((n) => n + 1);

    scheduleSaveDebounced();
  }

  const saveNow = useCallback(async () => {
    const dirty = Array.from(dirtyRef.current.values());
    if (!dirty.length) return;

    setSaving(true);
    try {
      // Persist changed rows to data_files.rows_data and sync candidates
      const merged = await saveSpreadsheetRows(fileId, dirty);

      // Clear dirty rows that were saved
      dirty.forEach((d) => dirtyRef.current.delete(d.id ?? d.row_order ?? JSON.stringify(d)));

      // Update rowsRef from merged data
      rowsRef.current = merged;
      queryClient.invalidateQueries({ queryKey: ["spreadsheet-file", fileId] });
      queryClient.invalidateQueries({ queryKey: ["spreadsheet", fileId] });
    } catch (err) {
      console.error("saveNow error", err);
    } finally {
      setSaving(false);
      forceRerender((n) => n + 1);
    }
  }, [fileId, queryClient]);

  const scheduleSaveDebounced = useDebouncedCallback(async () => {
    await saveNow();
  }, 700);

  // Expose an updateCell function for compatibility with existing components
  async function updateCell(rowId, column, value) {
    updateLocalCell(rowId, column, value);
  }

  // Add row: create a placeholder row in both data_files and candidates (keeps behavior predictable)
  const addRow = useMutation({
    mutationFn: async () => {
      // Create a new candidate row first; this keeps id tracking consistent with existing UI
      const { data, error } = await supabase
        .from("candidates")
        .insert({ data_file_id: fileId, full_name: "", email: "", phone: "", status: "", location: "" })
        .select();

      if (error) throw error;

      // Append to data_files.rows_data as well
      const newCandidate = data && data[0];

      const { data: fileData, error: fileErr } = await supabase
        .from("data_files")
        .select("rows_data")
        .eq("id", fileId)
        .single();

      if (fileErr) throw fileErr;

      const rows_data = fileData?.rows_data || [];
      rows_data.push({ ...newCandidate });

      const { error: updateErr } = await supabase
        .from("data_files")
        .update({ rows_data })
        .eq("id", fileId);

      if (updateErr) throw updateErr;

      return true;
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["spreadsheet-file", fileId] });
    },
  });

  const deleteRows = useMutation({
    mutationFn: async () => {
      if (!selectedRows.length) return;

      const { error } = await supabase.from("candidates").delete().in("id", selectedRows);
      if (error) throw error;

      // Also remove them from data_files.rows_data
      const { data: fileData, error: fileErr } = await supabase
        .from("data_files")
        .select("rows_data")
        .eq("id", fileId)
        .single();

      if (fileErr) throw fileErr;

      let rows_data = fileData?.rows_data || [];
      rows_data = rows_data.filter((r) => !selectedRows.includes(r.id));

      const { error: updateErr } = await supabase
        .from("data_files")
        .update({ rows_data })
        .eq("id", fileId);

      if (updateErr) throw updateErr;

      return true;
    },
    onSuccess() {
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ["spreadsheet-file", fileId] });
    },
  });

  function exportCSV() {
    // Basic CSV export using current visible rows
    const csvRows = [Object.keys(rows[0] || {}).join(",")];
    for (const r of rows) {
      csvRows.push(Object.values(r).map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","));
    }

    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ("spreadsheet_" + fileId + ".csv").replace(/[^a-z0-9_.-]/gi, "_");
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    search,
    setSearch,
    rows,
    isLoading,
    error,
    refetch,
    sort,
    sortColumn,
    sortDirection,
    setSelectedRows,
    selectedRows,
    updateCell,
    addRow: addRow.mutate,
    deleteRows: deleteRows.mutate,
    exportCSV,
    saving,
  };
}
