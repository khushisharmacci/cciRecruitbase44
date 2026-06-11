import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/tenant";
import { Plus } from "lucide-react";
import EventForm from "./EventForm";

export default function QuickAddButton() {
  const [open, setOpen] = useState(false);
  const { stampRecord } = useTenant();
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => base44.entities.Event.create(stampRecord(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); qc.invalidateQueries({ queryKey: ["events-widget"] }); setOpen(false); },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-110"
        title="Quick Add Event"
      >
        <Plus className="h-6 w-6" />
      </button>
      <EventForm open={open} onOpenChange={setOpen} onSave={mutate} isLoading={isPending} />
    </>
  );
}