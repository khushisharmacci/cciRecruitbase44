import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { MessageSquare } from "lucide-react";

import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import NewConversationDialog from "@/components/chat/NewConversationDialog";

export default function TeamChat() {
  const { user, isLoadingAuth } = useAuth();

  const queryClient = useQueryClient();
  const companyId = "default";

  const [selectedConv, setSelectedConv] = useState(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  // ---------------- USERS ----------------

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users-chat"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*");

      if (error) throw error;
      return data || [];
    },
  });

  // ---------------- CONVERSATIONS ----------------

  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", companyId],
    enabled: !!user,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // ---------------- MESSAGES ----------------

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", companyId],
    enabled: !!user,
    refetchInterval: 3000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // ---------------- FILTER CONVERSATIONS ----------------

  const myConversations = conversations.filter((c) => {
    try {
      return JSON.parse(c.members || "[]").includes(user?.id);
    } catch {
      return false;
    }
  });

  // ---------------- KEEP SELECTED UPDATED ----------------

  useEffect(() => {
    if (!selectedConv) return;

    const latest = myConversations.find(
      (c) => c.id === selectedConv.id
    );

    if (latest) setSelectedConv(latest);
  }, [myConversations, selectedConv]);

  // ---------------- UNREAD COUNTS ----------------

  const unreadCounts = {};

  myConversations.forEach((conv) => {
    unreadCounts[conv.id] = messages.filter((m) => {
      if (m.conversation_id !== conv.id) return false;
      if (m.sender_id === user?.id) return false;

      try {
        return !JSON.parse(m.read_by || "[]").includes(user?.id);
      } catch {
        return true;
      }
    }).length;
  });

  // ---------------- CREATE CONVERSATION ----------------

  const createMutation = useMutation({
    mutationFn: async (conversation) => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert([conversation])
        .select()
        .single();

      if (error) throw error;

      return data;
    },

    onSuccess: (conversation) => {
      queryClient.invalidateQueries({
        queryKey: ["chat-conversations"],
      });

      setSelectedConv(conversation);
    },
  });

  const handleNewConversation = ({
    type,
    member,
    name,
    description,
    members,
  }) => {
    if (type === "direct") {
      const existing = myConversations.find((c) => {
        if (c.type !== "direct") return false;

        try {
          const ids = JSON.parse(c.members || "[]");
          return (
            ids.includes(user.id) &&
            ids.includes(member.id)
          );
        } catch {
          return false;
        }
      });

      if (existing) {
        setSelectedConv(existing);
        return;
      }

      createMutation.mutate({
        type: "direct",
        members: JSON.stringify([user.id, member.id]),
        member_names: JSON.stringify([
          user.full_name,
          member.full_name,
        ]),
        last_message_at: new Date().toISOString(),
      });
    } else {
      const everyone = [user, ...members];

      createMutation.mutate({
        type: "group",
        name,
        description,
        members: JSON.stringify(
          everyone.map((m) => m.id)
        ),
        member_names: JSON.stringify(
          everyone.map((m) => m.full_name)
        ),
        admin_id: user.id,
        admin_name: user.full_name,
        last_message_at: new Date().toISOString(),
      });
    }
  };

  // ---------------- SAFE RETURNS ----------------

  if (isLoadingAuth) {
    return (
      <div className="p-6 text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-red-400">
        No authenticated user.
      </div>
    );
  }

  // ---------------- UI ----------------

  return (
    <div className="flex h-[calc(100vh-56px)] bg-background overflow-hidden">

      <div className="w-72 shrink-0 flex flex-col">
        <ConversationList
          conversations={myConversations}
          selectedId={selectedConv?.id}
          onSelect={setSelectedConv}
          unreadCounts={unreadCounts}
          currentUser={user}
          onNew={() => setNewDialogOpen(true)}
        />
      </div>

      <div className="flex-1 flex flex-col">

        {selectedConv ? (
          <ChatWindow
            key={selectedConv.id}
            conversation={selectedConv}
            messages={messages}
            currentUser={user}
            allUsers={allUsers}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">

            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-primary/40" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">
                Team Chat
              </h2>

              <p className="text-slate-400 mt-2">
                Select a conversation or start a new one.
              </p>
            </div>

            <button
              onClick={() => setNewDialogOpen(true)}
              className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
            >
              + New Conversation
            </button>

          </div>
        )}

      </div>

      <NewConversationDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        users={allUsers}
        currentUser={user}
        onCreate={handleNewConversation}
      />

    </div>
  );
}