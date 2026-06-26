import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { can } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarDays, Plus, Check, X, Clock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusConfig = {
  Pending: { color: "bg-amber-500/15 text-amber-300", icon: Clock, label: "Pending" },
  Approved: { color: "bg-emerald-500/15 text-emerald-300", icon: Check, label: "Approved" },
  Rejected: { color: "bg-red-500/15 text-red-300", icon: X, label: "Rejected" },
};

export default function LeaveRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
  leave_type: "Casual Leave",
  start_date: "",
  to_date: "",
  reason: ""
});

  const isCEO = can.isCEO(user);
  const canManage =
  can.manageUsers(user) ||
  can.isCEO(user);

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
  let query = supabase
    .from("leave_requests")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  

  const { data, error } =
    await query;

  if (error) throw error;

  return data || [];
},
  });

  const myRequests = leaveRequests.filter(
  (r) => r.user_id === user?.id
);
  const pendingRequests = leaveRequests.filter((r) => r.status === "Pending");

  const createMutation = useMutation({
  mutationFn: async (data) => {
    console.log("Sending:", data);

    const { data: result, error } = await supabase
      .from("leave_requests")
      .insert([data])
      .select();

    console.log("Result:", result);
    console.log("Error:", error);

    if (error) throw error;
  },

  onSuccess: () => {
    console.log("SUCCESS");
    qc.invalidateQueries({
      queryKey: ["leave-requests"],
    });
    setDialogOpen(false);
  },

  onError: (err) => {
    console.error(err);
  },
});
  const updateMutation = useMutation({
    mutationFn: async ({
  id,
  status,
}) => {
  const { error } =
    await supabase
      .from("leave_requests")
      .update({
        status,
      })
      .eq("id", id);

  if (error) throw error;
},
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-requests"] }),
  });

  const handleSubmit = () => {
  console.log("Submitting", form);

  createMutation.mutate({
    user_id: user.id,
    employee_name: user.full_name,
    leave_type: form.leave_type,
    start_date: form.start_date,
    to_date: form.to_date,
    reason: form.reason,
    status: "Pending",
  });
};

  const openAdd = () => {
    setForm({
  leave_type: "Casual Leave",
  start_date: "",
  to_date: "",
  reason: ""
});
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Employee Leave Request */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Leave Requests
          </h3>
          <Button size="sm" onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Request Leave
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : myRequests.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No leave requests submitted</p>
        ) : (
          <div className="space-y-2">
            {myRequests.map((r) => {
              const cfg = statusConfig[r.status] || statusConfig["Pending"];
              const StatusIcon = cfg.icon;
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", cfg.color)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.leave_type}</p>
                    <p className="text-xs text-muted-foreground">
  {r.leave_type} ·{" "}
  {r.start_date
    ? format(new Date(r.start_date), "MMM d")
    : "—"}{" "}
  →{" "}
  {r.end_date
    ? format(new Date(r.end_date), "MMM d, yyyy")
    : "—"}
</p>
                    {r.reason && <p className="text-xs text-muted-foreground/70 mt-0.5">{r.reason}</p>}
                  </div>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.color)}>{r.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CEO/Admin Leave Management */}
      {canManage && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" /> Leave Management
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-xs font-medium">{pendingRequests.length} pending</span>
            )}
          </h3>

          {pendingRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No pending leave requests</p>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {r.employee_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.employee_name}</p>
                    <p className="text-xs text-muted-foreground">
  {r.start_date
    ? format(new Date(r.start_date), "MMM d")
    : "—"}{" "}
  →{" "}
  {r.end_date
    ? format(new Date(r.end_date), "MMM d, yyyy")
    : "—"}
</p>
                    {r.reason && <p className="text-xs text-muted-foreground/70 mt-0.5">{r.reason}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      onClick={() => updateMutation.mutate({ id: r.id, status: "Approved" })}>
                      <Check className="h-3 w-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-red-400 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => updateMutation.mutate({ id: r.id, status: "Rejected" })}>
                      <X className="h-3 w-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-[#0F172A] border border-slate-700 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Leave Type</Label>
              <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From Date</Label>
                <Input
  type="date"
  value={form.end_date}
  onChange={(e) =>
    setForm({
      ...form,
      end_date: e.target.value,
    })
  }
/>
              </div>
              <div>
                <Label>To Date</Label>
                <Input
  type="date"
  value={form.end_date}
  onChange={(e) =>
    setForm({
      ...form,
      end_date: e.target.value,
    })
  }
/>
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Reason for leave..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
  onClick={handleSubmit}
  disabled={
    !form.start_date ||
    !form.to_date_date ||
    createMutation.isPending
  }
>
              {createMutation.isPending ||
createMutation.isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}