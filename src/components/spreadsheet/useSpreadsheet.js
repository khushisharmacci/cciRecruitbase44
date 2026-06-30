import { useEffect, useMemo, useState } from "react";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function useSpreadsheet(fileId) {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [saving, setSaving] = useState(false);

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["spreadsheet", fileId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("data_files")
                .select("columns, rows_data")
                .eq("id", fileId)
                .single();

            if (error) throw error;

            return data;
        },
    });

    useEffect(() => {
        if (!data) return;

        setColumns(data.columns ?? []);
        setRows(
    (data.rows_data ?? []).map((row) => ({
        __id: row.__id ?? crypto.randomUUID(),
        ...row,
    }))
);
    }, [data]);

    const filteredRows = useMemo(() => {
        if (!search) return rows;

        return rows.filter((row) =>
            Object.values(row)
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [rows, search]);

    async function saveSpreadsheet(updatedRows = rows) {
        setSaving(true);

        const { error } = await supabase
            .from("data_files")
            .update({
                rows_data: updatedRows,
            })
            .eq("id", fileId);

        setSaving(false);

        if (error) console.error(error);
    }

    async function updateCell(rowId, columnName, value) {
    const updated = rows.map((row) =>
        row.__id === rowId
            ? {
                  ...row,
                  [columnName]: value,
              }
            : row
    );

    setRows(updated);

    clearTimeout(window.sheetSave);

    window.sheetSave = setTimeout(() => {
        saveSpreadsheet(updated);
    }, 600);
}

    const addRow = useMutation({
        mutationFn: async () => {
            const blank = {};

columns.forEach((column) => {
    blank[column] = "";
});

blank.__id = crypto.randomUUID();

            const updated = [...rows, blank];

            setRows(updated);

            await saveSpreadsheet(updated);
        },
    });

    const deleteRows = useMutation({
        mutationFn: async () => {
            if (!selectedRows.length) return;

            const updated = rows.filter(
                (_, index) => !selectedRows.includes(index)
            );

            setRows(updated);
            setSelectedRows([]);

            await saveSpreadsheet(updated);
        },
    });

    function exportCSV() {
        const csv = [
            columns,
            ...filteredRows.map((row) =>
                columns.map((column) => {
    const value = row[column];

    if (value == null) return "";

    return `"${String(value).replaceAll('"', '""')}"`;
})
            ),
        ]
            .map((r) => r.join(","))
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv",
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = "spreadsheet.csv";
        a.click();

        URL.revokeObjectURL(url);
    }

    return {
        rows,
filteredRows,
        allRows: rows,
        setRows,

        columns,

        isLoading,
        error,
        refetch,

        search,
        setSearch,

        saving,

        updateCell,

        selectedRows,
        setSelectedRows,

        addRow,
        deleteRows,

        exportCSV,

        saveSpreadsheet,
    };
}