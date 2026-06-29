import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function useSpreadsheet(fileId) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortColumn, setSortColumn] = useState("full_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [saving, setSaving] = useState(false);

  const {
    data: rows = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["spreadsheet", fileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("data_file_id", fileId)
        .order("created_at");

      if (error) throw error;

      return data ?? [];
    },
  });

  const filteredRows = useMemo(() => {
    let list = [...rows];

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
  }, [rows, search, sortColumn, sortDirection]);

  function sort(column) {
    if (column === sortColumn) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  async function updateCell(id, column, value) {
    setSaving(true);

    const { error } = await supabase
      .from("candidates")
      .update({
        [column]: value,
      })
      .eq("id", id);

    setSaving(false);

    if (error) return;

    queryClient.invalidateQueries({
      queryKey: ["spreadsheet", fileId],
    });
  }

  const addRow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("candidates")
        .insert({
          data_file_id: fileId,
          full_name: "",
          email: "",
          phone: "",
          status: "",
          location: "",
        });

      if (error) throw error;
    },

    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["spreadsheet", fileId],
      });
    },
  });

  const deleteRows = useMutation({
    mutationFn: async () => {
      if (!selectedRows.length) return;

      const { error } = await supabase
        .from("candidates")
        .delete()
        .in("id", selectedRows);

      if (error) throw error;
    },

    onSuccess() {
      setSelectedRows([]);

      queryClient.invalidateQueries({
        queryKey: ["spreadsheet", fileId],
      });
    },
  });
function exportCSV() {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Status",
    "Location",
  ];

  const csv = [
    headers,
    ...filteredRows.map((r) => [
      r.full_name ?? "",
      r.email ?? "",
      r.phone ?? "",
      r.status ?? "",
      r.location ?? "",
    ]),
  ]
    .map((r) => r.join(","))
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = `${fileId}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
  return {
    rows: filteredRows,
    isLoading,
    error,
    refetch,

    search,
    setSearch,

    selectedRows,
    setSelectedRows,

    saving,

    sort,
    updateCell,

    addRow,
    deleteRows,
  };
}