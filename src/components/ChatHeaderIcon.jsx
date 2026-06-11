import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/tenant";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";

export default function ChatHeaderIcon() {
  const { user } = useAuth();
  const { tenantFilter, companyId } = useTenant();

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages-header", companyId],
    queryFn: () => base44.entities.ChatMessage.filter(tenantFilter(), "created_date", 200),
    refetchInterval: 5000,
    enabled: !!user,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations-header", companyId],
    queryFn: () => base44.entities.ChatConversation.filter(tenantFilter(), "-last_message_at", 50),
    refetchInterval: 5000,
    enabled: !!user,
  });

  const myConvIds = conversations
    .filter(c => { try { return JSON.parse(c.members || "[]").includes(user?.id); } catch { return false; } })
    .map(c => c.id);

  const unread = messages.filter(m => {
    if (!myConvIds.includes(m.conversation_id)) return false;
    if (m.sender_id === user?.id) return false;
    try { return !JSON.parse(m.read_by || "[]").includes(user?.id); } catch { return true; }
  }).length;

  return (
    <Link to="/chat" className="relative text-muted-foreground hover:text-foreground transition-colors">
      <MessageSquare className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}