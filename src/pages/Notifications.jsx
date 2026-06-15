import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Bell, Check, Calendar, UserCheck, Handshake, Target, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const typeIcons = {
  Interview: Calendar,
  "Follow-up": UserCheck,
  Offer: Mail,
  Target: Target,
  Lead: Handshake,
  General: Bell
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({
  queryKey: ["notifications"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  },
});

  const markRead = useMutation({
  mutationFn: async (id) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) throw error;
  },
  onSuccess: () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
});

  const markAllRead = useMutation({
  mutationFn: async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);

    if (error) throw error;
  },
  onSuccess: () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
});

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 &&
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} className="gap-2">
            <Check className="h-4 w-4" /> Mark all read
          </Button>
        }
      </div>

      {isLoading ?
      <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div> :
      notifications.length === 0 ?
      <div className="text-center py-20 text-muted-foreground">You are all caught up — no notifications</div> :

      <div className="space-y-2">
          {notifications.map((n) => {
          const Icon = typeIcons[n.type] || Bell;
          return (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer",
                n.read ? "bg-card border-border" : "bg-primary/5 border-primary/20"
              )}
              onClick={() => !n.read && markRead.mutate(n.id)}>
              
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", n.read ? "bg-muted" : "bg-primary/10")}>
                  <Icon className={cn("h-4 w-4", n.read ? "text-muted-foreground" : "text-primary")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", n.read ? "text-muted-foreground" : "text-foreground")}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{<n className="created_at"></n> ? format(new Date(n.created_at), "MMM d, h:mm a") : ""}</p>
                </div>
                {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
              </div>);

        })}
        </div>
      }
    </div>);

}