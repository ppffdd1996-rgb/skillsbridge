import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users } from "lucide-react";
import { toast } from "sonner";

export default function TeamChat({ opportunityId, currentUserEmail }) {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: collaboration } = useQuery({
    queryKey: ['collaboration', opportunityId],
    queryFn: async () => {
      const result = await base44.entities.RecruiterCollaboration.filter({ 
        opportunity_id: opportunityId 
      });
      return result[0] || null;
    },
  });

  const createCollaborationMutation = useMutation({
    mutationFn: (data) => base44.entities.RecruiterCollaboration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration'] });
    },
  });

  const updateCollaborationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecruiterCollaboration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration'] });
      setMessage('');
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = {
      sender: currentUserEmail,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    if (!collaboration) {
      createCollaborationMutation.mutate({
        opportunity_id: opportunityId,
        primary_recruiter: currentUserEmail,
        team_members: [currentUserEmail],
        message: message.trim(),
        sender_email: currentUserEmail,
        message_history: [newMessage],
      });
    } else {
      updateCollaborationMutation.mutate({
        id: collaboration.id,
        data: {
          message: message.trim(),
          sender_email: currentUserEmail,
          message_history: [...(collaboration.message_history || []), newMessage],
        },
      });
    }
  };

  const messages = collaboration?.message_history || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="w-5 h-5" />
          Team Chat
          {collaboration?.team_members?.length > 0 && (
            <Badge variant="outline" className="ml-auto">
              <Users className="w-3 h-3 mr-1" />
              {collaboration.team_members.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg ${
                  msg.sender === currentUserEmail
                    ? 'bg-indigo-50 ml-8'
                    : 'bg-gray-50 mr-8'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {msg.sender === currentUserEmail ? 'You' : msg.sender.split('@')[0]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{msg.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Message your team..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}