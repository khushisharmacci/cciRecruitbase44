import { Button } from "@/components/ui/button";

import SpreadsheetToolbar from "./SpreadsheetToolbar";
import SpreadsheetTable from "./SpreadsheetTable";
import useSpreadsheet from "./useSpreadsheet";

export default function SpreadsheetViewer({
  file,
  onClose,
}) {
  const spreadsheet = useSpreadsheet(file.id);

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

        {/* Header */}

        <div className="h-16 border-b border-slate-700 bg-[#1b2940] flex items-center justify-between px-6">

          <div>

            <h2 className="text-xl font-semibold text-white">

              {file.original_filename || file.name}

            </h2>

          </div>

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

        <SpreadsheetTable

          rows={spreadsheet.rows}

          sort={spreadsheet.sort}

          selectedRows={spreadsheet.selectedRows}

          setSelectedRows={spreadsheet.setSelectedRows}

          updateCell={spreadsheet.updateCell}

        />

      </div>

    </div>
  );
}