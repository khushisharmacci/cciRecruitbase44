import { Users, Briefcase, Calendar, Gift, UserCheck, DollarSign, FolderOpen, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const kpiConfig = [
  { key: "totalCandidates", label: "Total Candidates", icon: Users, color: "text-blue-400 bg-blue-500/20" },
  { key: "activePositions", label: "Active Positions", icon: Briefcase, color: "text-violet-400 bg-violet-500/20" },
  { key: "scheduledInterviews", label: "Interviews", icon: Calendar, color: "text-amber-400 bg-amber-500/20" },
  { key: "offersReleased", label: "Offers Released", icon: Gift, color: "text-emerald-400 bg-emerald-500/20" },
  { key: "joinedCandidates", label: "Joined", icon: UserCheck, color: "text-teal-400 bg-teal-500/20" },
  { key: "revenue", label: "Revenue", icon: DollarSign, color: "text-green-400 bg-green-500/20", format: "currency" },
  { key: "openRequirements", label: "Open Roles", icon: FolderOpen, color: "text-orange-400 bg-orange-500/20" },
  { key: "productivity", label: "Productivity", icon: TrendingUp, color: "text-pink-400 bg-pink-500/20", format: "percent" },
];

export default function KPICards({ data }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpiConfig.map(({ key, label, icon: Icon, color, format }) => {
        const value = data[key] || 0;
        const display = format === "currency" ? `$${(value / 1000).toFixed(0)}K`
          : format === "percent" ? `${value}%`
          : value;
        return (
          <div key={key} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", color)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{display}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        );
      })}
    </div>
  );
}