import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/tenant";
import KPICards from "../components/dashboard/KPICards";
import RecruitmentFunnel from "../components/dashboard/RecruitmentFunnel";
import PerformanceCharts from "../components/dashboard/PerformanceCharts";
import UpcomingEventsWidget from "../components/events/UpcomingEventsWidget";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import DailyReportStatus from "../components/dashboard/DailyReportStatus";

const HERO_IMG = "banner2.jpeg";

export default function Dashboard() {
  const { user } = useAuth();
  const { companyId } = useTenant();

  const { data: candidates = [] } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*");

      if (error) throw error;

      return data || [];
    },
  });
  
  const { data: positions = [] } = useQuery({
  queryKey: ["positions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("positions")
      .select("*");

    if (error) throw error;

    return data || [];
  }
});
  const { data: interviews = [] } = useQuery({
  queryKey: ["interviews"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("interviews")
      .select("*");

    if (error) throw error;

    return data || [];
  }
});
  const { data: revenue = [] } = useQuery({
  queryKey: ["revenue"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("revenue_records")
      .select("*");

    if (error) throw error;

    return data || [];
  },
});

  const statusCount = (arr, field, val) => arr.filter((a) => a[field] === val).length;
  const totalRevenue = revenue.reduce((s, r) => s + (r.amount || 0), 0);
  const activePositions = positions.filter((p) => p.status === "Open" || p.status === "In Progress").length;
  const scheduledInterviews = interviews.filter((i) => i.status === "Scheduled").length;

  const kpiData = {
    totalCandidates: candidates.length,
    activePositions,
    scheduledInterviews,
    offersReleased: statusCount(candidates, "status", "Offer Released"),
    joinedCandidates: statusCount(candidates, "status", "Joined"),
    revenue: totalRevenue,
    openRequirements: positions.filter((p) => p.status === "Open").length,
    productivity: candidates.length > 0 ? Math.round(statusCount(candidates, "status", "Joined") / candidates.length * 100) : 0
  };

  const funnelData = {
    applied: statusCount(candidates, "status", "Applied"),
    screening: statusCount(candidates, "status", "Screening"),
    shortlisted: statusCount(candidates, "status", "Shortlisted"),
    interviewed: statusCount(candidates, "status", "Interview Scheduled"),
    selected: statusCount(candidates, "status", "Selected") + statusCount(candidates, "status", "Offer Released"),
    joined: statusCount(candidates, "status", "Joined")
  };

  const upcomingInterviews = interviews.
  filter((i) => i.status === "Scheduled").
  sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date)).
  slice(0, 5);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/90 to-primary h-40 md:h-48">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[hsl(var(--background))]">
            Welcome back, {user?.full_name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-xs md:text-sm font-semibold tracking-widest uppercase mt-1 text-[hsl(var(--chart-5))]">RECRUIT SMARTER.</p>
          <p className="mt-1 text-sm md:text-base text-[hsl(var(--background))]">Here's what's happening with your recruitment pipeline today.

          </p>
          <div className="flex gap-3 mt-4">
            <Link to="/candidates" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-lg backdrop-blur transition-colors">
              View Pipeline <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <KPICards data={kpiData} />

<DailyReportStatus />

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecruitmentFunnel data={funnelData} />
        </div>
        <div className="rounded-xl border border-border p-6 bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Upcoming Interviews
          </h3>
          {upcomingInterviews.length === 0 ?
          <p className="text-muted-foreground text-sm py-8 text-center">No upcoming interviews scheduled</p> :

          <div className="space-y-3">
              {upcomingInterviews.map((i) =>
            <div key={i.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{i.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">{i.position}</p>
                    <p className="text-xs text-primary mt-1">
                      {i.interview_date ? format(new Date(i.interview_date), "MMM d, h:mm a") : "TBD"}
                    </p>
                  </div>
                </div>
            )}
            </div>
          }
        </div>
      </div>

      <PerformanceCharts />

      <UpcomingEventsWidget />
    </div>);

}