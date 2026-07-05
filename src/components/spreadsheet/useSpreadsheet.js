import { useEffect, useMemo, useState } from "react";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";
import { toast } from "sonner";

const FIELD_MAPPING = {
    "CANDIDATE NAME": "full_name",
    "EMAIL ID": "email",
    "CONTACT NUMBER": "phone",
    "CURRENT ORG": "current_company",

    "POSITION": "current_job_role",

    "LOCATION": "location",

    "ACADEMICS": "academics",

    "CURRENT FIXED CTC": "current_ctc",

    "SOURCED BY": "sourced_by",

    "UPDATED BY": "updated_by",

    "SENT ON": "sent_on",

    "LINKEDIN PROFILE LINK": "linkedin",

    "HR": "hr",

    "REMARKS By Sir": "remarks",

    "REMARKS by Deepali": "remarks",
};

export default function useSpreadsheet(fileId) {
    const queryClient = useQueryClient();
    const dirtyRows = useRef(new Set());

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

const rowsData =
    typeof data.rows_data === "string"
        ? JSON.parse(data.rows_data)
        : (data.rows_data ?? []);

setRows(
    rowsData.map((row) => ({
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

    const saveSpreadsheet = async (rowsToSave = rows) => {
    setSaving(true);

    try {
        const updatedRows = [...rowsToSave];

        for (const rowId of dirtyRows.current) {
            const row = updatedRows.find(r => r.__id === rowId);

            if (row) {
                await syncRow(row);
            }
        }

        const { error } = await supabase
            .from("data_files")
            .update({
                rows_data: updatedRows,
            })
            .eq("id", fileId);

        if (error) {
            console.error("SAVE ERROR");
            console.error(error);
            throw error;
        }

        dirtyRows.current.clear();

        setRows(updatedRows);

        queryClient.invalidateQueries({
            queryKey: ["spreadsheet", fileId],
        });

        queryClient.invalidateQueries({
            queryKey: ["candidates"],
        });

        toast.success("Spreadsheet saved");

    } catch (err) {
    console.log("========== ERROR ==========");
    console.log(err);
    console.log("message:", err?.message);
    console.log("details:", err?.details);
    console.log("hint:", err?.hint);
    console.log("===========================");
    toast.error("Save failed");
}

    setSaving(false);
};
    async function syncRow(row) {
    const payload = {};

Object.entries(FIELD_MAPPING).forEach(([sheetColumn, dbColumn]) => {
    if (row[sheetColumn] !== undefined) {
    payload[dbColumn] = row[sheetColumn];
}
});
    // Already linked → update
    if (row._candidate_id) {
        const { error } = await supabase
            .from("candidates")
            .update(payload)
            .eq("id", row._candidate_id);

        if (error) throw error;

        return;
    }

    // Search by email
    let candidate = null;

    if (payload.email) {
        const { data } = await supabase
            .from("candidates")
            .select("*")
            .eq("email", payload.email)
            .maybeSingle();

        candidate = data;
    }

    // Search by phone
    if (!candidate && payload.phone) {
        const { data } = await supabase
            .from("candidates")
            .select("*")
            .eq("phone", payload.phone)
            .maybeSingle();

        candidate = data;
    }

    // Update existing candidate
    if (candidate) {
        const { error } = await supabase
            .from("candidates")
            .update(payload)
            .eq("id", candidate.id);

        if (error) throw error;

        row._candidate_id = candidate.id;
        return;
    }

    // Create new candidate
    Object.keys(payload).forEach((key) => {
    if (
        payload[key] === "" ||
        payload[key] === undefined ||
        payload[key] === null
    ) {
        delete payload[key];
    }
});
// Must have at least email or phone
if (!payload.email && !payload.phone) {
    return;
}
    const { data: inserted, error } = await supabase
    .from("candidates")
    .insert(payload)
    .select()
    .single();

console.log("Payload:");
console.log(payload);

if (error) {
    console.error("INSERT ERROR");
    console.error(error);
    console.error(error.message);
    console.error(error.details);
    console.error(error.hint);
    throw error;
}

    row._candidate_id = inserted.id;
}
    const updateCell = async (rowId, column, value) => {

    const updated = rows.map(row =>
        row.__id === rowId
            ? {
                  ...row,
                  [column]: value,
              }
            : row
    );

    setRows(updated);

    dirtyRows.current.add(rowId);

    await saveSpreadsheet(updated);
};

const addRow = useMutation({
    mutationFn: async () => {

        const blank = {};

        columns.forEach((column) => {
            blank[column] = "";
        });

        if (columns.includes("SR.NO.")) {
            blank["SR.NO."] = String(rows.length + 1);
        }

        blank.__id = crypto.randomUUID();

        const updated = [...rows, blank];

        setRows(updated);

        dirtyRows.current.add(blank.__id);

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