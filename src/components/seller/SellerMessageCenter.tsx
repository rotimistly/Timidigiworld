import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProductMessage {
  id: string;
  content: string;
  sender_id: string;
  buyer_id: string;
  product_id: string;
  is_read: boolean;
  created_at: string;
  product: {
    title: string;
    image_url?: string;
  };
  buyer_profile: {
    full_name: string | null;
  };
}

interface ConversationGroup {
  productId: string;
  buyerId: string;
  productTitle: string;
  buyerName: string;
  messages: ProductMessage[];
  unreadCount: number;
}

export function SellerMessageCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationGroup | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSellerMessages();
      
      // Subscribe to real-time messages
      const subscription = supabase
        .channel('seller_messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'product_messages',
          filter: `seller_id=eq.${user.id}`
        }, () => {
          fetchSellerMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  const fetchSellerMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('product_messages')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get additional data separately
      const messagesWithExtras = await Promise.all(
        (data || []).map(async (message) => {
          const [productResult, profileResult] = await Promise.all([
            supabase.from('products').select('title, image_url').eq('id', message.product_id).single(),
            supabase.from('profiles').select('full_name').eq('user_id', message.buyer_id).single()
          ]);
          
          return {
            ...message,
            product: productResult.data || { title: 'Unknown Product', image_url: null },
            buyer_profile: profileResult.data || { full_name: null }
          };
        })
      );

      // Group messages by product and buyer
      const grouped = messagesWithExtras.reduce((acc, message) => {
        const key = `${message.product_id}-${message.buyer_id}`;
        if (!acc[key]) {
          acc[key] = {
            productId: message.product_id,
            buyerId: message.buyer_id,
            productTitle: message.product.title,
            buyerName: message.buyer_profile?.full_name || 'Unknown Buyer',
            messages: [],
            unreadCount: 0
          };
        }
        acc[key].messages.push(message);
        if (!message.is_read && message.sender_id !== user.id) {
          acc[key].unreadCount++;
        }
        return acc;
      }, {} as Record<string, ConversationGroup>);

      setConversations(Object.values(grouped));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('product_messages')
        .insert({
          product_id: selectedConversation.productId,
          buyer_id: selectedConversation.buyerId,
          seller_id: user.id,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      fetchSellerMessages();
      
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (conversationGroup: ConversationGroup) => {
    const unreadMessages = conversationGroup.messages
      .filter(msg => !msg.is_read && msg.sender_id !== user?.id)
      .map(msg => msg.id);

    if (unreadMessages.length > 0) {
      await supabase
        .from('product_messages')
        .update({ is_read: true })
        .in('id', unreadMessages);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Please log in to view messages</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          Customer Messages
        </CardTitle>
      </CardHeader>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <p>No customer messages yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={`${conversation.productId}-${conversation.buyerId}`}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        markAsRead(conversation);
                      }}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.productId === conversation.productId &&
                        selectedConversation?.buyerId === conversation.buyerId
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{conversation.buyerName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.productTitle}
                          </p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message View */}
        <Card className="md:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg">
                  Chat with {selectedConversation.buyerName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  About: {selectedConversation.productTitle}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ScrollArea className="h-80 p-4 border rounded-lg">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Select a conversation to view messages</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}