import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import ResumeAnalysis from "@/components/ResumeAnalysis";

const statusColors = {
  "Applied": "bg-blue-500/15 text-blue-300", "Screening": "bg-indigo-500/15 text-indigo-300",
  "Shortlisted": "bg-violet-500/15 text-violet-300", "Interview Scheduled": "bg-amber-500/15 text-amber-300",
  "Selected": "bg-emerald-500/15 text-emerald-300", "Offer Released": "bg-green-500/15 text-green-300",
  "Joined": "bg-teal-500/15 text-teal-300", "Rejected": "bg-red-500/15 text-red-300", "On Hold": "bg-gray-500/15 text-gray-400",
};

export default function CandidateDetail() {
  const { candidateId } = useParams();
  const queryClient = useQueryClient();
  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => base44.entities.Candidate.get(candidateId),
  });
  const { data: interviews = [] } = useQuery({
    queryKey: ["candidate-interviews", candidateId],
    queryFn: () => base44.entities.Interview.filter({ candidate_id: candidateId }),
  });
  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Candidate.update(candidateId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!candidate) return <div className="text-center py-20 text-muted-foreground">Candidate not found</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <Link to="/candidates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Candidates
      </Link>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0">
            {candidate.full_name?.charAt(0) || "?"}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{candidate.full_name}</h1>
              <span className={cn("inline-flex px-3 py-1 rounded-full text-xs font-medium", statusColors[candidate.status])}>
                {candidate.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {candidate.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {candidate.email}</span>}
              {candidate.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {candidate.phone}</span>}
              {candidate.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {candidate.location}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Professional Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Current Role</span><span className="text-foreground font-medium">{candidate.current_role || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="text-foreground font-medium">{candidate.current_company || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Experience</span><span className="text-foreground font-medium">{candidate.experience_years ? `${candidate.experience_years} years` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expected Salary</span><span className="text-foreground font-medium">{candidate.expected_salary ? `$${candidate.expected_salary.toLocaleString()}` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span className="text-foreground font-medium">{candidate.source || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Position</span><span className="text-foreground font-medium">{candidate.position_title || "—"}</span></div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Skills</h3>
          {candidate.skills ? (
            <div className="flex flex-wrap gap-2">
              {candidate.skills.split(",").map((s, i) => (
                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{s.trim()}</span>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">No skills listed</p>}
          {candidate.notes && (
            <>
              <h3 className="font-semibold text-foreground pt-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{candidate.notes}</p>
            </>
          )}
        </div>
      </div>

      <ResumeAnalysis candidate={candidate} onCandidateUpdate={(data) => updateMutation.mutate(data)} />

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Interview History</h3>
        {interviews.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No interviews recorded yet</p>
        ) : (
          <div className="space-y-3">
            {interviews.map(i => (
              <div key={i.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{i.interview_type} — {i.position_title}</p>
                  <p className="text-xs text-muted-foreground">{i.interview_date ? format(new Date(i.interview_date), "MMM d, yyyy h:mm a") : "TBD"}</p>
                </div>
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full",
                  i.status === "Completed" ? "bg-emerald-500/15 text-emerald-300" :
                  i.status === "Scheduled" ? "bg-amber-500/15 text-amber-300" : "bg-gray-500/15 text-gray-400"
                )}>{i.status}</span>
                {i.rating && <div className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" /><span className="text-sm font-medium">{i.rating}</span></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}