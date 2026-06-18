import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, X, Pencil, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

export default function SpreadsheetViewer({ file, onClose }) {
  console.log("VIEWER FILE", file);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [editCell, setEditCell] = useState(null); // { row, col }
  const [editVal, setEditVal] = useState("");
  const [rows, setRows] = useState(() => {
    try { return JSON.parse(file.rows_data || "[]"); } catch { return []; }
  });

  const columns = useMemo(() => {
    try { return JSON.parse(file.columns || "[]"); } catch { return []; }
  }, [file.columns]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(row => columns.some(col => String(row[col] ?? "").toLowerCase().includes(q)));
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortCol] ?? "");
      const bv = String(b[sortCol] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const startEdit = (ri, col, val) => {
    setEditCell({ ri, col });
    setEditVal(String(val ?? ""));
  };

  const commitEdit = (ri, col) => {
    const globalIdx = page * PAGE_SIZE + ri;
    const actualRow = sorted[globalIdx];
    const rowIdx = rows.findIndex(r => r === actualRow);
    if (rowIdx >= 0) {
      const updated = [...rows];
      updated[rowIdx] = { ...updated[rowIdx], [col]: editVal };
      setRows(updated);
    }
    setEditCell(null);
  };

  const deleteRow = (ri) => {
    const globalIdx = page * PAGE_SIZE + ri;
    const actualRow = sorted[globalIdx];
    setRows(prev => prev.filter(r => r !== actualRow));
  };

  // Column letters A, B, C...
  const colLetter = (i) => {
    let s = "";
    i++;
    while (i > 0) {
      s = String.fromCharCode(64 + (i % 26 || 26)) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <span className="text-emerald-400 text-xs font-bold">XLS</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{file.name}</p>
          <p className="text-xs text-muted-foreground">{rows.length.toLocaleString()} rows · {columns.length} columns</p>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search..." className="h-8 pl-8 w-48 text-xs" />
        </div>
        <span className="text-xs text-muted-foreground">{sorted.length.toLocaleString()} results</span>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-card">
        <table className="border-collapse text-xs w-max min-w-full">
          <thead className="sticky top-0 z-20">
            {/* Column letter row */}
            <tr className="bg-muted/50">
              <th className="border border-border bg-muted/60 w-10 min-w-[40px] text-center sticky left-0 z-30 text-muted-foreground font-medium py-1"></th>
              {columns.map((col, ci) => (
                <th key={col} className="border border-border bg-muted/60 px-2 py-1 text-center text-muted-foreground font-medium min-w-[120px] whitespace-nowrap">
                  {colLetter(ci)}
                </th>
              ))}
            </tr>
            {/* Header row */}
            <tr className="bg-primary/10">
              <th className="border border-border bg-muted/60 w-10 sticky left-0 z-30 text-center text-muted-foreground font-medium py-1.5 text-xs"></th>
              {columns.map(col => (
                <th
                  key={col}
                  className="border border-border px-2 py-1.5 text-left font-semibold text-foreground cursor-pointer hover:bg-primary/20 transition-colors whitespace-nowrap min-w-[120px] select-none"
                  onClick={() => toggleSort(col)}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate max-w-[140px]">{col}</span>
                    <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortCol === col ? "text-primary" : "text-muted-foreground")} />
                  </div>
                </th>
              ))}
              <th className="border border-border bg-muted/60 w-8 sticky right-0"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, ri) => (
              <tr key={ri} className="hover:bg-primary/5 group">
                <td className="border border-border bg-muted/30 text-center text-muted-foreground py-1 sticky left-0 z-10 w-10 select-none">
                  {page * PAGE_SIZE + ri + 1}
                </td>
                {columns.map(col => {
                  const isEditing = editCell?.ri === ri && editCell?.col === col;
                  return (
                    <td
                      key={col}
                      className="border border-border relative p-0 min-w-[120px] max-w-[240px]"
                      onDoubleClick={() => startEdit(ri, col, row[col])}
                    >
                      {isEditing ? (
                        <div className="flex items-center absolute inset-0 z-20 shadow-lg">
                          <input
                            autoFocus
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") commitEdit(ri, col); if (e.key === "Escape") setEditCell(null); }}
                            className="flex-1 h-full px-2 py-1 text-xs bg-card text-foreground border-2 border-primary outline-none"
                            />
                            <button onClick={() => commitEdit(ri, col)} className="h-full px-1.5 bg-primary text-primary-foreground hover:bg-primary/80">
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="px-2 py-1.5 truncate text-foreground cursor-cell select-none">
                          {row[col] !== undefined && row[col] !== "" && row[col] !== null
                            ? <span>{String(row[col])}</span>
                            : <span className="text-muted-foreground/30">&nbsp;</span>
                          }
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="border border-border bg-muted/20 w-8 sticky right-0">
                  <button onClick={() => deleteRow(ri)} className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-red-400 text-muted-foreground transition-all">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-16 text-muted-foreground">No data found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-card border-t border-border shrink-0">
          <span className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}