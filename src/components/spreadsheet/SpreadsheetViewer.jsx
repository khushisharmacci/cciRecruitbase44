import { AgGridReact } from "ag-grid-react";

import {
    ModuleRegistry,
    AllCommunityModule,
} from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([
    AllCommunityModule,
]);

import { Button } from "@/components/ui/button";

import SpreadsheetToolbar from "./SpreadsheetToolbar";
import useSpreadsheet from "./useSpreadsheet";

export default function SpreadsheetViewer({
    file,
    onClose,
}) {

    const spreadsheet = useSpreadsheet(file.id);
    console.log(spreadsheet.columns);
    console.log(spreadsheet.rows[0]);

    const columnDefs = spreadsheet.columns.map((column) => ({
    field: column,
    headerName: column,
    editable: true,

    filter: true,
    sortable: true,
    resizable: true,

    floatingFilter: true,
}));

    

    if (spreadsheet.error) {
        return (
            <div className="fixed inset-0 bg-[#162234] flex items-center justify-center">
                <div className="text-red-400">
                    Failed to load spreadsheet.
                </div>
            </div>
        );
    }

    if (spreadsheet.isLoading) {
        return (
            <div className="fixed inset-0 bg-[#162234] flex items-center justify-center">
                <div className="text-white">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center">

            <div className="w-[97vw] h-[94vh] bg-[#162234] rounded-xl border border-slate-700 shadow-2xl flex flex-col">

                <div className="h-16 border-b border-slate-700 bg-[#1b2940] flex items-center justify-between px-6">

                    <h2 className="text-xl font-semibold text-white">
                        {file.original_filename || file.name}
                    </h2>

                    <Button
                        variant="destructive"
                        onClick={onClose}
                    >
                        Close
                    </Button>

                </div>

                <SpreadsheetToolbar
                    search={spreadsheet.search}
                    setSearch={spreadsheet.setSearch}
                    rows={spreadsheet.rows}
                    saving={spreadsheet.saving}
                    refetch={spreadsheet.refetch}
                    addRow={spreadsheet.addRow}
                    deleteRows={spreadsheet.deleteRows}
                    selectedRows={spreadsheet.selectedRows}
                    exportCSV={spreadsheet.exportCSV}
                />

                <div className="flex-1">

                    <div
    className="flex-1"
    style={{
        minHeight: 0,
        height: "100%",
    }}
>
    <div
    className="ag-theme-quartz-dark flex-1"
    style={{
        width: "100%",
        height: "100%",
    }}
>
    <AgGridReact
    rowData={
    spreadsheet.search
        ? spreadsheet.filteredRows
        : spreadsheet.rows
}
getRowId={(params) => params.data.__id}
    columnDefs={columnDefs}

    singleClickEdit={true}

stopEditingWhenCellsLoseFocus={true}

enterNavigatesVertically={true}

enterNavigatesVerticallyAfterEdit={true}

    defaultColDef={{
        editable: true,
        sortable: true,
        filter: true,
        floatingFilter: true,
        resizable: true,
        flex: 1,
        minWidth: 150,
    }}

    animateRows
    rowSelection="multiple"

    onCellValueChanged={async (params) => {
    const column = params.colDef.field;

    await spreadsheet.updateCell(
        params.data.__id,
        column,
        params.newValue
    );
}}
/>
</div>
</div>
                </div>

            </div>

        </div>
    );
}