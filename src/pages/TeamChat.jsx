import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { MessageSquare } from "lucide-react";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import NewConversationDialog from "@/components/chat/NewConversationDialog";
import { getUnreadCount } from "@/components/chat/chatUtils";

export default function TeamChat() {
  const { user, isLoadingAuth } = useAuth();

if (isLoadingAuth) {
  return <div style={{ padding: "20px", color: "white" }}>Loading auth...</div>;
}

if (!user) {
  return <div style={{ padding: "20px", color: "red" }}>No authenticated user</div>;
}
  const companyId = "default";
  const qc = useQueryClient();

  const [selectedConv, setSelectedConv] = useState(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  // Fetch all company users
  const { data: allUsers = [] } = useQuery({
  queryKey: ["users-chat"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error) throw error;

    return data || [];
  },
});

  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", companyId],
    queryFn: async () => {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .order("last_message_at", { ascending: false });

  if (error) throw error;

  return data || [];
},
    refetchInterval: 5000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", companyId],
    queryFn: async () => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data || [];
},
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
  mutationFn: async (data) => {
    const { data: result, error } = await supabase
      .from("chat_conversations")
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    return result;
  },
  onSuccess: (conv) => {
    qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    setSelectedConv(conv);
  },
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

console.log("USER", user);
console.log("ALL USERS", allUsers);
console.log("CONVERSATIONS", conversations);
console.log("MY CONVERSATIONS", myConversations);

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