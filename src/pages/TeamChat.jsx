import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/tenant";
import { MessageSquare } from "lucide-react";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import NewConversationDialog from "@/components/chat/NewConversationDialog";
import { getUnreadCount } from "@/components/chat/chatUtils";

export default function TeamChat() {
  const { user } = useAuth();
  const { tenantFilter, stampRecord, companyId } = useTenant();
  const qc = useQueryClient();

  const [selectedConv, setSelectedConv] = useState(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  // Fetch all company users
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users-chat", companyId],
    queryFn: () => base44.entities.User.list(),
    select: (data) => data.filter((u) => {
      // filter to same company
      const userCompany = user?.company_id;
      return !userCompany || u.company_id === userCompany || u.id === user?.id;
    })
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", companyId],
    queryFn: () => base44.entities.ChatConversation.filter(tenantFilter(), "-last_message_at", 100),
    refetchInterval: 5000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", companyId],
    queryFn: () => base44.entities.ChatMessage.filter(tenantFilter(), "created_date", 500),
    refetchInterval: 3000
  });

  // Only conversations where user is a member
  const myConversations = conversations.filter((c) => {
    try {return JSON.parse(c.members || "[]").includes(user?.id);} catch {return false;}
  });

  // Sync selected conversation to latest data
  useEffect(() => {
    if (selectedConv) {
      const updated = myConversations.find((c) => c.id === selectedConv.id);
      if (updated) setSelectedConv(updated);
    }
  }, [conversations]);

  // Unread counts per conversation
  const unreadCounts = {};
  myConversations.forEach((c) => {
    const convMsgs = messages.filter((m) => m.conversation_id === c.id);
    unreadCounts[c.id] = convMsgs.filter((m) => {
      if (m.sender_id === user?.id) return false;
      try {return !JSON.parse(m.read_by || "[]").includes(user?.id);} catch {return true;}
    }).length;
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatConversation.create(stampRecord(data)),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
      setSelectedConv(conv);
    }
  });

  const handleNewConversation = ({ type, member, name, description, members }) => {
    if (type === "direct") {
      // Check if DM already exists
      const existing = myConversations.find((c) => {
        if (c.type !== "direct") return false;
        try {
          const ids = JSON.parse(c.members || "[]");
          return ids.includes(user.id) && ids.includes(member.id);
        } catch {return false;}
      });
      if (existing) {setSelectedConv(existing);return;}

      createMutation.mutate({
        type: "direct",
        members: JSON.stringify([user.id, member.id]),
        member_names: JSON.stringify([user.full_name, member.full_name]),
        last_message_at: new Date().toISOString()
      });
    } else {
      const allMembers = [user, ...members];
      createMutation.mutate({
        type: "group",
        name,
        description,
        members: JSON.stringify(allMembers.map((m) => m.id)),
        member_names: JSON.stringify(allMembers.map((m) => m.full_name)),
        admin_id: user.id,
        admin_name: user.full_name,
        last_message_at: new Date().toISOString()
      });
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-56px)] bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col h-full">
        <ConversationList
          conversations={myConversations}
          selectedId={selectedConv?.id}
          onSelect={setSelectedConv}
          unreadCounts={unreadCounts}
          currentUser={user}
          onNew={() => setNewDialogOpen(true)} />
        
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConv ?
        <ChatWindow
          key={selectedConv.id}
          conversation={selectedConv}
          messages={messages}
          currentUser={user}
          allUsers={allUsers} /> :


        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-primary/40" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-[hsl(var(--card))]">Team Chat</h3>
              <p className="text-sm mt-1 text-gray-400">Select a conversation or start a new one</p>
            </div>
            <button onClick={() => setNewDialogOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              + New Conversation
            </button>
          </div>
        }
      </div>

      <NewConversationDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        users={allUsers}
        currentUser={user}
        onCreate={handleNewConversation} />
      
    </div>);

}