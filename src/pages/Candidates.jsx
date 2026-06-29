import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import CandidateDialog from "../components/CandidateDialog";

const statusColors = {
  "Applied": "bg-blue-500/15 text-blue-300",
  "Screening": "bg-indigo-500/15 text-indigo-300",
  "Shortlisted": "bg-violet-500/15 text-violet-300",
  "Interview Scheduled": "bg-amber-500/15 text-amber-300",
  "Selected": "bg-emerald-500/15 text-emerald-300",
  "Offer Released": "bg-green-500/15 text-green-300",
  "Joined": "bg-teal-500/15 text-teal-300",
  "Rejected": "bg-red-500/15 text-red-300",
  "On Hold": "bg-gray-500/15 text-gray-400"
};

export default function Candidates() {
  const queryClient = useQueryClient();
  const { tenantFilter, stampRecord, companyId } = useTenant();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["candidates", companyId],
    queryFn: async () => {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
  const payload = {
    ...data,
    current_job_role: data.current_job_role
  };

  delete payload.current_job_role;

  const { error } = await supabase
    .from("candidates")
    .insert([payload]);

  if (error) throw error;
},
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["candidates"] });setDialogOpen(false);}
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
  const payload = {
    ...data,
    current_job_role: data.current_job_role
  };

  delete payload.current_job_role;

  const { error } = await supabase
    .from("candidates")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
},
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["candidates"] });setDialogOpen(false);setEditCandidate(null);}
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", id);

  if (error) throw error;
},
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["candidates"] });setDeleteId(null);}
  });
useEffect(() => {
  setSelectedCandidates([]);
}, [search, statusFilter]);
  const filtered = candidates.filter((c) => {
    const matchSearch =
  !search ||
  c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
  c.email?.toLowerCase().includes(search.toLowerCase()) ||
  c.linkedin?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDeleteSelected = async () => {
  if (
    !window.confirm(
      `Delete ${selectedCandidates.length} candidate(s)?`
    )
  ) return;

  const { error } = await supabase
    .from("candidates")
    .delete()
    .in("id", selectedCandidates);

  if (error) {
    alert(error.message);
    return;
  }

  setSelectedCandidates([]);

  queryClient.invalidateQueries({
    queryKey: ["candidates"],
  });
};

const handleSave = (data) => {
  if (editCandidate) {
    updateMutation.mutate({ id: editCandidate.id, data });
  } else {
    createMutation.mutate(data);
  }
};

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

  {selectedCandidates.length > 0 && (
    <Button
      variant="destructive"
      onClick={handleDeleteSelected}
    >
      Delete Selected ({selectedCandidates.length})
    </Button>
  )}

  <Button
    onClick={() => {
      setEditCandidate(null);
      setDialogOpen(true);
    }}
    className="gap-2"
  >
    <Plus className="h-4 w-4" />
    Add Candidate
  </Button>

</div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email or LinkedIn..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(statusColors).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ?
      <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div> :
      filtered.length === 0 ?
      <div className="text-center py-20">
          <p className="text-muted-foreground">No candidates found — start building your talent pipeline</p>
        </div> :

      <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
  <tr className="border-b border-border bg-muted/50">

    <th className="w-12 px-4 py-3">
      <input
        type="checkbox"
        checked={
          filtered.length > 0 &&
          selectedCandidates.length === filtered.length
        }
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedCandidates(filtered.map(c => c.id));
          } else {
            setSelectedCandidates([]);
          }
        }}
      />
    </th>

    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      Name
    </th>

    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
      Role
    </th>

    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
      Experience
    </th>

    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      Status
    </th>

    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
      Source
    </th>

    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      Actions
    </th>

  </tr>
</thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) =>
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">

               <td className="px-4 py-3">
  <input
    type="checkbox"
    checked={selectedCandidates.includes(c.id)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedCandidates(prev => [...prev, c.id]);
      } else {
        setSelectedCandidates(prev =>
          prev.filter(id => id !== c.id)
        );
      }
    }}
  />
</td>

                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-foreground">{c.current_job_role || "—"}</p>
                      <p className="text-xs text-muted-foreground">{c.current_company || ""}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-foreground">{c.experience_years ? `${c.experience_years} yrs` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", statusColors[c.status])}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">{c.source || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/candidates/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setEditCandidate(c);setDialogOpen(true);}}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }

      <CandidateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidate={editCandidate}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending} />
      

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently remove this candidate from your pipeline.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}