import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const EVENT_TYPES = [
  "Interview",
  "Follow-Up",
  "Resume Review",
  "Candidate Submission",
  "Offer Release",
  "Joining Date",
  "Candidate Documentation",
  "Client Follow-Up",
  "Requirement Deadline",
  "Team Meeting",
  "Task",
  "Reminder",
  "Monthly Report",
  "Custom",
];


const REMINDER_OPTIONS = [
{ label: "5 min before", value: 5 },
{ label: "15 min before", value: 15 },
{ label: "30 min before", value: 30 },
{ label: "1 hour before", value: 60 },
{ label: "3 hours before", value: 180 },
{ label: "1 day before", value: 1440 },
{ label: "3 days before", value: 4320 },
{ label: "7 days before", value: 10080 }];


const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const RECURRENCES = ["None", "Daily", "Weekly", "Monthly"];

const defaultForm = {
  title: "",
  description: "",
  event_type: "Meeting",
  custom_event: "",
  priority: "Medium",
  start_datetime: "",
  end_datetime: "",
  all_day: false,
  location: "",
  assigned_to: "",
  related_candidate: "",
  related_client: "",
  reminders: [],
  recurrence: "None",
};

export default function EventForm({ open, onOpenChange, event, onSave, isLoading }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (event) {
      setForm({
        ...defaultForm,
        ...event,
        reminders: event.reminders ? JSON.parse(event.reminders) : [],
        start_datetime: event.start_datetime ? event.start_datetime.slice(0, 16) : "",
        end_datetime: event.end_datetime ? event.end_datetime.slice(0, 16) : ""
      });
    } else {
      setForm(defaultForm);
    }
  }, [event, open]);

  const toggleReminder = (value) => {
    setForm((f) => ({
      ...f,
      reminders: f.reminders.includes(value) ?
      f.reminders.filter((r) => r !== value) :
      [...f.reminders, value]
    }));
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  if (
  form.event_type === "Custom" &&
  !form.custom_event.trim()
) {
  alert("Please enter a custom event name.");
  return;
}

  const payload = {
  ...form,
  event_type:
    form.event_type === "Custom"
      ? form.custom_event
      : form.event_type,
  end_datetime: form.end_datetime || null,
};

  console.log("PAYLOAD", payload);

  onSave(payload);
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Event Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Final Interview - John Doe" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Type</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.event_type === "Custom" && (
  <div className="mt-3">
    <Label>Custom Event Name</Label>

    <Input
      value={form.custom_event}
      placeholder="e.g. Campus Placement Drive"
      onChange={(e) =>
        setForm({
          ...form,
          custom_event: e.target.value,
        })
      }
    />
  </div>
)}
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time *</Label>
              <Input type="datetime-local" value={form.start_datetime} onChange={(e) => setForm({ ...form, start_datetime: e.target.value })} required />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <Input type="datetime-local" value={form.end_datetime} onChange={(e) => setForm({ ...form, end_datetime: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location / Link</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Office / Zoom link" />
            </div>
            <div>
              <Label>Assigned To</Label>
              <Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} placeholder="Recruiter name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Related Candidate</Label>
              <Input value={form.related_candidate} onChange={(e) => setForm({ ...form, related_candidate: e.target.value })} />
            </div>
            <div>
              <Label>Related Client</Label>
              <Input value={form.related_client} onChange={(e) => setForm({ ...form, related_client: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Recurrence</Label>
            <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RECURRENCES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Reminders</Label>
            <div className="grid grid-cols-2 gap-2">
              {REMINDER_OPTIONS.map((opt) =>
              <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                  id={`rem-${opt.value}`}
                  checked={form.reminders.includes(opt.value)}
                  onCheckedChange={() => toggleReminder(opt.value)} />
                
                  <label htmlFor={`rem-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                </div>
              )}
            </div>
            {form.reminders.length > 0 &&
            <div className="flex flex-wrap gap-1 mt-2">
                {form.reminders.sort((a, b) => b - a).map((r) => {
                const opt = REMINDER_OPTIONS.find((o) => o.value === r);
                return <Badge key={r} variant="secondary" className="text-xs">{opt?.label}</Badge>;
              })}
              </div>
            }
          </div>

          <div>
            <Label>Description / Notes</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Additional details..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : event ? "Update Event" : "Create Event"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);

}