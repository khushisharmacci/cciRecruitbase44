import {
  ArrowUpDown,
} from "lucide-react";

import SpreadsheetRow from "./SpreadsheetRow";

export default function SpreadsheetTable({

  rows,

  sort,

  selectedRows,

  setSelectedRows,

  updateCell,

}) {

  const allSelected =
    rows.length > 0 &&
    selectedRows.length === rows.length;

  function toggleAll() {

    if (allSelected) {

      setSelectedRows([]);

      return;

    }

    setSelectedRows(rows.map(r => r.id));

  }

  return (

    <div className="flex-1 overflow-auto">

      <table className="w-full border-collapse table-fixed">

        <thead className="sticky top-0 z-20 bg-[#22324b]">

          <tr>

            {/* Checkbox */}

            <th className="w-10 border border-slate-700">

              <input

                type="checkbox"

                checked={allSelected}

                onChange={toggleAll}

                className="accent-blue-500"

              />

            </th>

            {/* Row Number */}

            <th className="w-12 border border-slate-700 text-white">

              #

            </th>

            <Header
              title="Name"
              field="full_name"
              sort={sort}
            />

            <Header
              title="Email"
              field="email"
              sort={sort}
            />

            <Header
              title="Phone"
              field="phone"
              sort={sort}
            />

            <Header
              title="Status"
              field="status"
              sort={sort}
            />

            <Header
              title="Location"
              field="location"
              sort={sort}
            />

          </tr>

        </thead>

        <tbody>

          {rows.length === 0 && (

            <tr>

              <td
                colSpan={7}
                className="
                text-center
                py-20
                text-slate-400
                "
              >

                No candidates found.

              </td>

            </tr>

          )}

          {rows.map((candidate,index)=>(

            <SpreadsheetRow

              key={candidate.id}

              candidate={candidate}

              index={index}

              selectedRows={selectedRows}

              setSelectedRows={setSelectedRows}

              updateCell={updateCell}

            />

          ))}

        </tbody>

      </table>

    </div>

  );

}

function Header({

  title,

  field,

  sort,

}) {

  return (

    <th

      onClick={()=>sort(field)}

      className="

      border

      border-slate-700

      px-4

      py-3

      text-left

      text-white

      cursor-pointer

      hover:bg-slate-700

      select-none

      "

    >

      <div className="flex items-center gap-2">

        {title}

        <ArrowUpDown size={15}/>

      </div>

    </th>

  );

}