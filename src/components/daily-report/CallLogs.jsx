import { useState } from "react";
import { Phone, Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CallLogs({
  callLogs = [],
  setCallLogs,
  readOnly = false,
}) {
  const emptyForm = {
    person_name: "",
    phone_number: "",
    discussion_notes: "",
  };

  const [editing, setEditing] = useState(-1);
  const [form, setForm] = useState(emptyForm);

  const startAdd = () => {
    setForm(emptyForm);
    setEditing(-2);
  };

  const startEdit = (index) => {
    setForm(callLogs[index]);
    setEditing(index);
  };

  const handleSave = () => {
    if (!form.person_name.trim()) return;

    if (editing === -2) {
      setCallLogs((prev) => [...prev, form]);
    } else {
      setCallLogs((prev) =>
        prev.map((item, index) =>
          index === editing ? form : item
        )
      );
    }

    setEditing(-1);
    setForm(emptyForm);
  };

  const handleDelete = (index) => {
    setCallLogs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setEditing(-1);
    setForm(emptyForm);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Phone className="h-5 w-5 text-primary" />
          Call Logs
        </h3>

        {!readOnly && editing === -1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={startAdd}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Call Log
          </Button>
        )}
      </div>

      {editing !== -1 && !readOnly && (
        <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              placeholder="Person Name"
              value={form.person_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  person_name: e.target.value,
                }))
              }
            />

            <Input
              placeholder="Phone Number"
              value={form.phone_number}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  phone_number: e.target.value,
                }))
              }
            />
          </div>

          <Textarea
            className="min-h-[80px]"
            placeholder="Discussion Notes"
            value={form.discussion_notes}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                discussion_notes: e.target.value,
              }))
            }
          />

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editing === -2 ? "Add" : "Update"}
            </Button>

            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {callLogs.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No call logs recorded
        </p>
      ) : (
        <div className="space-y-2">
          {callLogs.map((log, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    {log.person_name}
                  </p>

                  {log.phone_number && (
                    <span className="text-xs text-muted-foreground">
                      {log.phone_number}
                    </span>
                  )}
                </div>

                {log.discussion_notes && (
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {log.discussion_notes}
                  </p>
                )}
              </div>

              {!readOnly && editing === -1 && (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(index)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}