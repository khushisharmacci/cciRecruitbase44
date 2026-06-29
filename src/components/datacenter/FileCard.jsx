import { FileSpreadsheet, Eye, Trash2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SYNC_BADGE = {
  synced: { icon: CheckCircle, label: "Synced", cls: "bg-emerald-500/15 text-emerald-300" },
  pending: { icon: Clock, label: "Pending", cls: "bg-amber-500/15 text-amber-300" },
  error: { icon: AlertCircle, label: "Error", cls: "bg-red-500/15 text-red-300" },
};

export default function FileCard({ file, onOpen, onDelete }) {
  const badge = SYNC_BADGE[file.sync_status] || SYNC_BADGE.synced;
  const SyncIcon = badge.icon;
console.log(file);
  return (
    <div className="bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all p-4 group">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate text-sm">{file.name}</p>
          <p className="text-xs text-muted-foreground truncate">{file.original_filename}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", badge.cls)}>
              <SyncIcon className="h-3 w-3" />{badge.label}
            </span>
            {file.row_count > 0 && <span className="text-xs text-muted-foreground">{file.row_count.toLocaleString()} rows</span>}
            {file.column_count > 0 && <span className="text-xs text-muted-foreground">· {file.column_count} cols</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {file.created_at ? format(new Date(file.created_at), "MMM d, yyyy") : ""}
        </span>
        <div className="flex gap-1 opacity-100">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onOpen(file)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(file)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}