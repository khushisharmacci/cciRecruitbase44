import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, startOfWeek, startOfMonth, parseISO, differenceInMinutes } from "date-fns";
import { Clock, LogIn, LogOut, Calendar, TrendingUp, Users, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend } from
"recharts";
import { cn } from "@/lib/utils";

function todayStr() {return format(new Date(), "yyyy-MM-dd");}
function nowStr() {return format(new Date(), "HH:mm");}

export default function Attendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tenantFilter, stampRecord, companyId } = useTenant();
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [activeChart, setActiveChart] = useState("weekly");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance", companyId],
    queryFn: () => base44.entities.AttendanceRecord.filter(tenantFilter(), "-date")
  });

  const today = todayStr();
  const myTodayRecord = records.find(
    (r) => r.employee_name === (user?.full_name || user?.email) && r.date === today
  );

  const checkInMutation = useMutation({
    mutationFn: () => base44.entities.AttendanceRecord.create(stampRecord({
      employee_name: user?.full_name || user?.email || "Unknown",
      employee_id: user?.id,
      date: today,
      check_in: nowStr(),
      status: "Present"
    })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] })
  });

  const checkOutMutation = useMutation({
    mutationFn: () => {
      const checkInTime = myTodayRecord?.check_in;
      let hours = 0;
      if (checkInTime) {
        const [h1, m1] = checkInTime.split(":").map(Number);
        const [h2, m2] = nowStr().split(":").map(Number);
        hours = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
      }
      return base44.entities.AttendanceRecord.update(myTodayRecord.id, {
        check_out: nowStr(),
        total_hours: Math.max(0, parseFloat(hours.toFixed(2)))
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] })
  });

  // KPI calculations
  const myRecords = records.filter((r) => r.employee_name === (user?.full_name || user?.email));
  const todayHours = myTodayRecord?.total_hours || 0;
  const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const weeklyHours = myRecords.filter((r) => r.date >= weekStart).reduce((s, r) => s + (r.total_hours || 0), 0);
  const monthlyHours = myRecords.filter((r) => r.date >= monthStart).reduce((s, r) => s + (r.total_hours || 0), 0);
  const totalDays = myRecords.length;
  const presentDays = myRecords.filter((r) => r.status === "Present").length;
  const attendancePct = totalDays > 0 ? Math.round(presentDays / totalDays * 100) : 0;

  // Chart data — last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = format(d, "yyyy-MM-dd");
    const rec = myRecords.find((r) => r.date === dateStr);
    return { day: format(d, "EEE"), hours: rec?.total_hours || 0 };
  });

  // Chart data — last 4 weeks
  const last4Weeks = Array.from({ length: 4 }, (_, i) => {
    const end = new Date();end.setDate(end.getDate() - i * 7);
    const start = new Date(end);start.setDate(start.getDate() - 6);
    const s = format(start, "yyyy-MM-dd"),e = format(end, "yyyy-MM-dd");
    const hrs = records.filter((r) =>
    r.employee_name === (user?.full_name || user?.email) && r.date >= s && r.date <= e
    ).reduce((acc, r) => acc + (r.total_hours || 0), 0);
    return { week: `W${4 - i}`, hours: parseFloat(hrs.toFixed(1)) };
  }).reverse();

  // Filtered table
  const filtered = records.filter((r) => {
    const matchEmp = !filterEmployee || r.employee_name?.toLowerCase().includes(filterEmployee.toLowerCase());
    const matchDate = !filterDate || r.date === filterDate;
    return matchEmp && matchDate;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance & Productivity</h1>
        
      </div>

      {/* Check In / Check Out */}
      <div className="bg-card rounded-xl border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">{user?.full_name || "You"}</p>
            <p className="text-sm text-muted-foreground">
              {myTodayRecord ?
              myTodayRecord.check_out ?
              `Checked out at ${myTodayRecord.check_out} · ${myTodayRecord.total_hours}h` :
              `Checked in at ${myTodayRecord.check_in}` :
              "Not checked in today"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {!myTodayRecord &&
          <Button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending} className="gap-2">
              <LogIn className="h-4 w-4" /> Check In
            </Button>
          }
          {myTodayRecord && !myTodayRecord.check_out &&
          <Button onClick={() => checkOutMutation.mutate()} disabled={checkOutMutation.isPending} variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" /> Check Out
            </Button>
          }
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
        { label: "Today's Hours", value: `${todayHours}h`, icon: Clock, color: "text-blue-400" },
        { label: "This Week", value: `${weeklyHours.toFixed(1)}h`, icon: Calendar, color: "text-emerald-400" },
        { label: "This Month", value: `${monthlyHours.toFixed(1)}h`, icon: TrendingUp, color: "text-amber-400" },
        { label: "Attendance %", value: `${attendancePct}%`, icon: Users, color: "text-primary" }].
        map(({ label, value, icon: Icon, color }) =>
        <div key={label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon className={cn("h-5 w-5", color)} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </div>
        )}
      </div>

      {/* Productivity Charts */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" /> Productivity Analytics
          </h3>
          <div className="flex gap-2">
            {["daily", "weekly"].map((k) =>
            <button key={k} onClick={() => setActiveChart(k)}
            className={cn("px-3 py-1 rounded-lg text-sm font-medium transition-colors",
            activeChart === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}>
                {k === "daily" ? "Daily (7d)" : "Weekly (4w)"}
              </button>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          {activeChart === "daily" ?
          <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}h`, "Hours"]} />
              <Bar dataKey="hours" fill="hsl(220,72%,22%)" radius={[4, 4, 0, 0]} />
            </BarChart> :

          <LineChart data={last4Weeks}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}h`, "Hours"]} />
              <Line type="monotone" dataKey="hours" stroke="hsl(220,72%,22%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          }
        </ResponsiveContainer>
      </div>

      {/* Records Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input placeholder="Filter by employee..." value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="sm:w-64" />
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="sm:w-44" />
          {(filterEmployee || filterDate) &&
          <Button variant="ghost" size="sm" onClick={() => {setFilterEmployee("");setFilterDate("");}}>Clear</Button>
          }
        </div>
        {isLoading ?
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div> :

        <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Employee", "Date", "Check In", "Check Out", "Hours", "Status"].map((h) =>
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) =>
              <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{r.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.date}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{r.check_in || "—"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{r.check_out || "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{r.total_hours ? `${r.total_hours}h` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                  r.status === "Present" ? "bg-emerald-500/15 text-emerald-300" :
                  r.status === "Absent" ? "bg-red-500/15 text-red-300" :
                  r.status === "Late" ? "bg-amber-500/15 text-amber-300" : "bg-gray-500/15 text-gray-400"
                  )}>{r.status}</span>
                    </td>
                  </tr>
              )}
                {filtered.length === 0 &&
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No records found</td></tr>
              }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>);

}