import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statuses = ["Applied", "Screening", "Shortlisted", "Interview Scheduled", "Selected", "Offer Released", "Joined", "Rejected", "On Hold"];
const sources = ["LinkedIn", "Job Board", "Referral", "Direct", "Agency", "Other"];

export default function CandidateDialog({ open, onOpenChange, candidate, onSave, isLoading }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", skills: "", experience_years: "",
    current_company: "", current_role: "", expected_salary: "", location: "",
    status: "Applied", source: "LinkedIn", position_title: "", notes: ""
  });

  useEffect(() => {
    if (candidate) {
      setForm({
        full_name: candidate.full_name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        skills: candidate.skills || "",
        experience_years: candidate.experience_years || "",
        current_company: candidate.current_company || "",
        current_role: candidate.current_role || "",
        expected_salary: candidate.expected_salary || "",
        location: candidate.location || "",
        status: candidate.status || "Applied",
        source: candidate.source || "LinkedIn",
        position_title: candidate.position_title || "",
        notes: candidate.notes || ""
      });
    } else {
      setForm({ full_name: "", email: "", phone: "", skills: "", experience_years: "",
        current_company: "", current_role: "", expected_salary: "", location: "",
        status: "Applied", source: "LinkedIn", position_title: "", notes: "" });
    }
  }, [candidate, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      experience_years: form.experience_years ? Number(form.experience_years) : undefined,
      expected_salary: form.expected_salary ? Number(form.expected_salary) : undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{candidate ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Current Company</Label>
              <Input value={form.current_company} onChange={(e) => setForm({ ...form, current_company: e.target.value })} />
            </div>
            <div>
              <Label>Current Role</Label>
              <Input value={form.current_role} onChange={(e) => setForm({ ...form, current_role: e.target.value })} />
            </div>
            <div>
              <Label>Experience (Years)</Label>
              <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
            </div>
            <div>
              <Label>Expected Salary</Label>
              <Input type="number" value={form.expected_salary} onChange={(e) => setForm({ ...form, expected_salary: e.target.value })} />
            </div>
            <div>
              <Label>Position Title</Label>
              <Input value={form.position_title} onChange={(e) => setForm({ ...form, position_title: e.target.value })} />
            </div>
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Skills</Label>
            <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. React, Node.js, Python" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Candidate"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}