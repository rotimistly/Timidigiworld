import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Plus, Send } from 'lucide-react';

interface Conversation {
  id: string;
  subject: string;
  status: string;
  is_support_ticket: boolean;
  created_at: string;
  updated_at: string;
  messages_v2: Array<{
    id: string;
    content: string;
    sender_email: string | null;
    is_from_support: boolean;
    created_at: string;
  }>;
}

export function MessageCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', content: '' });

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // First get conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations_v2')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Then get messages for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversations || []).map(async (conversation) => {
          const { data: messages } = await supabase
            .from('messages_v2')
            .select('id, content, sender_email, is_from_support, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

          return {
            ...conversation,
            messages_v2: messages || []
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    if (!user || !newMessage.subject.trim() || !newMessage.content.trim()) return;

    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations_v2')
        .insert({
          user_id: user.id,
          subject: newMessage.subject,
          is_support_ticket: true
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add first message
      const { error: msgError } = await supabase
        .from('messages_v2')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_email: user.email,
          content: newMessage.content,
          is_from_support: false
        });

      if (msgError) throw msgError;

      toast({
        title: "Success",
        description: "Message sent successfully",
      });

      setIsDialogOpen(false);
      setNewMessage({ subject: '', content: '' });
      fetchConversations();

    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const sendReply = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages_v2')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_email: user.email,
          content,
          is_from_support: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply sent successfully",
      });

      fetchConversations();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view your messages</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Message Center</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  placeholder="Message subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                  placeholder="Type your message..."
                  rows={4}
                />
              </div>
              <Button onClick={createNewConversation} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
          <p className="text-muted-foreground mb-4">Start a conversation to get help or ask questions</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Send First Message
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <Card key={conversation.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{conversation.subject}</CardTitle>
                  <Badge variant={conversation.status === 'open' ? 'destructive' : 'secondary'}>
                    {conversation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
                  {conversation.messages_v2?.map((message) => (
                    <div key={message.id} className={`p-3 rounded-lg ${
                      message.is_from_support ? 'bg-primary text-primary-foreground ml-4' : 'bg-muted mr-4'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.is_from_support ? 'Support Team' : 'You'} - {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Type your reply..." 
                    id={`reply-${conversation.id}`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          sendReply(conversation.id, input.value);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button onClick={() => {
                    const input = document.getElementById(`reply-${conversation.id}`) as HTMLInputElement;
                    if (input.value.trim()) {
                      sendReply(conversation.id, input.value);
                      input.value = '';
                    }
                  }}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}