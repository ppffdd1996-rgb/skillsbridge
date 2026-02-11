import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, Send, Loader2, Search, Archive, 
  Briefcase, Calendar, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      const convs = await base44.entities.Conversation.filter({
        status: 'active'
      });
      return convs
        .filter(c => c.participants.includes(user.email))
        .sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date));
    },
    enabled: !!user
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => base44.entities.Message.filter({
      conversation_id: selectedConversation.id
    }).then(msgs => msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))),
    enabled: !!selectedConversation,
    refetchInterval: 5000 // Poll every 5 seconds
  });

  // Real-time message updates
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.conversation_id === selectedConversation.id) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        // Mark as read if not sent by current user
        if (event.type === 'create' && event.data.sender_email !== user.email) {
          markAsRead(event.data.id);
        }
      }
    });

    return unsubscribe;
  }, [selectedConversation?.id, user?.email]);

  const markAsRead = async (messageId) => {
    try {
      await base44.entities.Message.update(messageId, { read: true, read_at: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!messageText.trim()) return;

      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        application_id: selectedConversation.application_id,
        opportunity_id: selectedConversation.opportunity_id,
        sender_email: user.email,
        recipient_email: selectedConversation.participants.find(p => p !== user.email),
        subject: 'Chat Message',
        body: messageText,
        type: 'chat',
        read: false
      });

      // Update conversation
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: messageText.substring(0, 100),
        last_message_at: new Date().toISOString(),
        last_message_sender: user.email
      });

      return message;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      scrollToBottom();
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherParticipant = conv.participant_names?.find((_, idx) => 
      conv.participants[idx] !== user.email
    );
    return otherParticipant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getUnreadCount = (conv) => {
    return conv.unread_count?.[user.email] || 0;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to view messages</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border h-[calc(100vh-12rem)] flex">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r`}>
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const otherEmail = conv.participants.find(p => p !== user.email);
                  const otherNameIndex = conv.participants.indexOf(otherEmail);
                  const otherName = conv.participant_names?.[otherNameIndex] || otherEmail;
                  const unreadCount = getUnreadCount(conv);
                  const isSelected = selectedConversation?.id === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-indigo-100 text-indigo-600">
                            {otherName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">{otherName}</h4>
                            {unreadCount > 0 && (
                              <Badge className="bg-indigo-600 text-white ml-2">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{conv.last_message || 'No messages'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {conv.application_id && (
                              <Badge variant="outline" className="text-xs">
                                <Briefcase className="w-3 h-3 mr-1" />
                                Application
                              </Badge>
                            )}
                            {conv.interview_id && (
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                Interview
                              </Badge>
                            )}
                            {conv.last_message_at && (
                              <span className="text-xs text-gray-500">
                                {new Date(conv.last_message_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                      {(selectedConversation.participant_names?.[selectedConversation.participants.indexOf(selectedConversation.participants.find(p => p !== user.email))] || 'U')
                        .split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.participant_names?.[selectedConversation.participants.indexOf(selectedConversation.participants.find(p => p !== user.email))] || 
                       selectedConversation.participants.find(p => p !== user.email)}
                    </h3>
                    {(selectedConversation.application_id || selectedConversation.interview_id) && (
                      <p className="text-xs text-gray-600">
                        {selectedConversation.application_id && 'Application Chat'}
                        {selectedConversation.interview_id && 'Interview Chat'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((msg) => {
                      const isMe = msg.sender_email === user.email;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isMe
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                            </div>
                            <p className={`text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage.mutate();
                    }}
                    className="flex gap-2"
                  >
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      className="flex-1 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage.mutate();
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || sendMessage.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 self-end"
                    >
                      {sendMessage.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}