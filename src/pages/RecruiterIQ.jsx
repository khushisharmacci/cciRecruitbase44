import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Brain, FileText, Search, Users, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function RecruiterIQ() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">RecruiterIQ</h1>
          <p className="text-muted-foreground text-sm">AI-powered recruitment tools at your fingertips</p>
        </div>
      </div>

      <Tabs defaultValue="jd" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="jd" className="gap-2 text-[hsl(var(--chart-3))]"><FileText className="h-4 w-4" /> JD Generator</TabsTrigger>
          <TabsTrigger value="screen" className="gap-2 text-[hsl(var(--accent))]"><Search className="h-4 w-4" /> Resume Screen</TabsTrigger>
          <TabsTrigger value="interview" className="gap-2 text-[hsl(var(--accent))]"><Users className="h-4 w-4" /> Interview Qs</TabsTrigger>
          <TabsTrigger value="insights" className="gap-2 text-[hsl(var(--accent))]"><Brain className="h-4 w-4" /> Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="jd"><JDGenerator /></TabsContent>
        <TabsContent value="screen"><ResumeScreener /></TabsContent>
        <TabsContent value="interview"><InterviewQuestions /></TabsContent>
        <TabsContent value="insights"><CandidateInsights /></TabsContent>
      </Tabs>
    </div>);

}

function JDGenerator() {
  const [form, setForm] = useState({ title: "", experience: "", skills: "", industry: "", location: "" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a comprehensive, professional job description for the following role:\n\nJob Title: ${form.title}\nExperience: ${form.experience} years\nKey Skills: ${form.skills}\nIndustry: ${form.industry}\nLocation: ${form.location}\n\nInclude:\n1. Role Summary\n2. Key Responsibilities (5-8 bullet points)\n3. Required Skills\n4. Preferred Skills\n5. Qualifications\n6. Salary Range (estimate based on role and experience)\n7. SEO Keywords for job posting\n\nFormat in clean markdown.`
    });
    setResult(typeof res === "string" ? res : res?.response || res?.text || "");
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Job Details</h3>
        <div className="space-y-3">
          <div><Label>Job Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior React Developer" /></div>
          <div><Label>Experience (Years)</Label><Input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 5-8" /></div>
          <div><Label>Key Skills</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. React, TypeScript, Node.js" /></div>
          <div><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Technology" /></div>
          <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Remote / New York" /></div>
        </div>
        <Button onClick={generate} disabled={loading || !form.title} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {loading ? "Generating..." : "Generate Job Description"}
        </Button>
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Generated JD</h3>
        {result ?
        <div className="prose prose-sm max-w-none text-foreground"><ReactMarkdown>{result}</ReactMarkdown></div> :

        <p className="text-muted-foreground text-sm text-center py-12">Fill in the details and generate a professional job description</p>
        }
      </div>
    </div>);

}

function ResumeScreener() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const screen = async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert recruitment screener. Analyze the candidate's resume against the job description and provide a detailed match analysis.\n\nJob Description:\n${jd}\n\nCandidate Resume:\n${resume}\n\nProvide analysis in the following JSON format.`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          skill_match: { type: "number" },
          experience_match: { type: "number" },
          education_match: { type: "number" },
          cultural_fit: { type: "number" },
          strengths: { type: "array", items: { type: "string" } },
          missing_skills: { type: "array", items: { type: "string" } },
          risk_factors: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" }
        }
      }
    });
    setResult(res);
    setLoading(false);
  };

  const ScoreBar = ({ label, score }) =>
  <div className="space-y-1">
      <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{score}%</span></div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${score}%` }} />
      </div>
    </div>;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Input</h3>
        <div><Label>Job Description</Label><Textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={6} placeholder="Paste the job description..." /></div>
        <div><Label>Candidate Resume</Label><Textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={6} placeholder="Paste the resume content..." /></div>
        <Button onClick={screen} disabled={loading || !jd || !resume} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Screen Resume"}
        </Button>
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Match Analysis</h3>
        {result ?
        <div className="space-y-6">
            <div className="text-center p-6 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Overall Match Score</p>
              <p className="text-5xl font-bold text-primary">{result.overall_score}%</p>
            </div>
            <div className="space-y-3">
              <ScoreBar label="Skill Match" score={result.skill_match} />
              <ScoreBar label="Experience Match" score={result.experience_match} />
              <ScoreBar label="Education Match" score={result.education_match} />
              <ScoreBar label="Cultural Fit" score={result.cultural_fit} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Strengths</h4>
              <div className="flex flex-wrap gap-2">
                {result.strengths?.map((s, i) => <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">{s}</span>)}
              </div>
            </div>
            {result.missing_skills?.length > 0 &&
          <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Missing Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {result.missing_skills.map((s, i) => <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs">{s}</span>)}
                </div>
              </div>
          }
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-semibold text-foreground mb-1">Recommendation</h4>
              <p className="text-sm text-muted-foreground">{result.recommendation}</p>
            </div>
          </div> :

        <p className="text-muted-foreground text-sm text-center py-12">Paste a JD and resume to get AI-powered match analysis</p>
        }
      </div>
    </div>);

}

function InterviewQuestions() {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 10 interview questions for a ${role} role with ${experience} years of experience. Include:\n- 4 Technical Questions\n- 3 Behavioral Questions\n- 3 Situational Questions\n\nFor each question include: the question text, ideal answer indicators, evaluation notes, red flags to watch for, and a rating scale description (1-5).`,
      response_json_schema: {
        type: "object",
        properties: {
          technical: { type: "array", items: { type: "object", properties: { question: { type: "string" }, ideal_answer: { type: "string" }, evaluation_notes: { type: "string" }, red_flags: { type: "string" }, rating_scale: { type: "string" } } } },
          behavioral: { type: "array", items: { type: "object", properties: { question: { type: "string" }, ideal_answer: { type: "string" }, evaluation_notes: { type: "string" }, red_flags: { type: "string" }, rating_scale: { type: "string" } } } },
          situational: { type: "array", items: { type: "object", properties: { question: { type: "string" }, ideal_answer: { type: "string" }, evaluation_notes: { type: "string" }, red_flags: { type: "string" }, rating_scale: { type: "string" } } } }
        }
      }
    });
    setResult(res);
    setLoading(false);
  };

  const QuestionCard = ({ q, idx, type }) =>
  <div className="p-4 rounded-lg border border-border bg-card space-y-2">
      <p className="text-sm font-semibold text-foreground">Q{idx + 1}. {q.question}</p>
      <div className="text-xs space-y-1">
        <p><span className="font-medium text-green-700">Ideal Answer:</span> <span className="text-muted-foreground">{q.ideal_answer}</span></p>
        <p><span className="font-medium text-blue-700">Evaluation:</span> <span className="text-muted-foreground">{q.evaluation_notes}</span></p>
        <p><span className="font-medium text-red-700">Red Flags:</span> <span className="text-muted-foreground">{q.red_flags}</span></p>
      </div>
    </div>;


  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1"><Label>Job Role</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Full Stack Developer" /></div>
          <div className="w-40"><Label>Experience (Years)</Label><Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5" /></div>
          <Button onClick={generate} disabled={loading || !role} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>
      {result &&
      <div className="space-y-6">
          {[{ title: "Technical Questions", data: result.technical, color: "text-blue-600" },
        { title: "Behavioral Questions", data: result.behavioral, color: "text-violet-600" },
        { title: "Situational Questions", data: result.situational, color: "text-amber-600" }].
        map((section) =>
        <div key={section.title}>
              <h3 className={`font-semibold text-lg mb-3 ${section.color}`}>{section.title}</h3>
              <div className="space-y-3">
                {section.data?.map((q, i) => <QuestionCard key={i} q={q} idx={i} type={section.title} />)}
              </div>
            </div>
        )}
        </div>
      }
    </div>);

}

function CandidateInsights() {
  const [resume, setResume] = useState("");
  const [observations, setObservations] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this candidate's resume and recruiter observations to generate a comprehensive insight report.\n\nResume:\n${resume}\n\nRecruiter Observations:\n${observations}\n\nGenerate a report with: summary, strengths, weaknesses, leadership potential score (1-10), risk analysis, recommended role, and hiring verdict.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          leadership_score: { type: "number" },
          risk_analysis: { type: "string" },
          recommended_role: { type: "string" },
          hiring_verdict: { type: "string" }
        }
      }
    });
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Candidate Information</h3>
        <div><Label>Resume / CV Content</Label><Textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={8} placeholder="Paste the resume content..." /></div>
        <div><Label>Recruiter Observations</Label><Textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={4} placeholder="Communication skills, confidence level, technical depth..." /></div>
        <Button onClick={generate} disabled={loading || !resume} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Generate Insights"}
        </Button>
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">AI Insight Report</h3>
        {result ?
        <div className="space-y-4">
            <div><h4 className="text-sm font-medium text-muted-foreground">Summary</h4><p className="text-sm text-foreground mt-1">{result.summary}</p></div>
            <div><h4 className="text-sm font-medium text-muted-foreground">Strengths</h4><ul className="mt-1 space-y-1">{result.strengths?.map((s, i) => <li key={i} className="text-sm text-green-700 flex items-start gap-2">✓ {s}</li>)}</ul></div>
            <div><h4 className="text-sm font-medium text-muted-foreground">Weaknesses</h4><ul className="mt-1 space-y-1">{result.weaknesses?.map((s, i) => <li key={i} className="text-sm text-red-600 flex items-start gap-2">✗ {s}</li>)}</ul></div>
            <div className="flex gap-4">
              <div className="flex-1 p-3 rounded-lg bg-primary/5 text-center"><p className="text-xs text-muted-foreground">Leadership Score</p><p className="text-2xl font-bold text-primary">{result.leadership_score}/10</p></div>
              <div className="flex-1 p-3 rounded-lg bg-muted text-center"><p className="text-xs text-muted-foreground">Recommended Role</p><p className="text-sm font-semibold text-foreground mt-1">{result.recommended_role}</p></div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50"><h4 className="text-sm font-semibold mb-1">Hiring Verdict</h4><p className="text-sm text-foreground">{result.hiring_verdict}</p></div>
          </div> :

        <p className="text-muted-foreground text-sm text-center py-12">Provide resume and observations for AI-powered candidate insights</p>
        }
      </div>
    </div>);

}