import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, Send, Loader2, CheckCircle, Clock, 
  AlertCircle, Mail, User
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSupportPage() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['all-tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const respondMutation = useMutation({
    mutationFn: async ({ ticketId, responseText, status }) => {
      const ticket = tickets.find(t => t.id === ticketId);
      const updatedConversation = [
        ...(ticket.conversation || []),
        {
          sender: user.email,
          message: responseText,
          timestamp: new Date().toISOString()
        }
      ];

      await base44.entities.SupportTicket.update(ticketId, {
        admin_response: responseText,
        responded_at: new Date().toISOString(),
        status: status || ticket.status,
        assigned_to: user.email,
        conversation: updatedConversation
      });

      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: ticket.user_email,
        subject: `Re: ${ticket.subject}`,
        body: `Hi ${ticket.user_name},

We've responded to your support ticket.

Your Question: ${ticket.subject}

Our Response:
${responseText}

Ticket Status: ${status || ticket.status}

You can view your ticket history in the Support Center.

Best regards,
SkillsBridge Support Team`
      });
    },
    onSuccess: () => {
      toast.success('Response sent!');
      setResponse('');
      setSelectedTicket(null);
      setNewStatus('');
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
    },
    onError: () => {
      toast.error('Failed to send response');
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress' || t.status === 'waiting_response');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_response: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.open;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Ticket Management</h1>
          <p className="text-gray-600 mt-2">Respond to user support requests</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{openTickets.length}</p>
                  <p className="text-sm text-gray-600">Open Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{inProgressTickets.length}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{resolvedTickets.length}</p>
                  <p className="text-sm text-gray-600">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <Tabs defaultValue="open">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress ({inProgressTickets.length})</TabsTrigger>
                <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="open">
                <TicketList 
                  tickets={openTickets} 
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  getStatusColor={getStatusColor}
                />
              </TabsContent>

              <TabsContent value="in_progress">
                <TicketList 
                  tickets={inProgressTickets} 
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  getStatusColor={getStatusColor}
                />
              </TabsContent>

              <TabsContent value="resolved">
                <TicketList 
                  tickets={resolvedTickets} 
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  getStatusColor={getStatusColor}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {selectedTicket && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Respond to Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-indigo-600 pl-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedTicket.subject}</h4>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <User className="w-4 h-4" />
                      {selectedTicket.user_name} ({selectedTicket.user_email})
                    </p>
                  </div>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mt-2">{selectedTicket.description}</p>
              </div>

              {selectedTicket.conversation && selectedTicket.conversation.length > 1 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700">Conversation History:</p>
                  {selectedTicket.conversation.slice(1).map((msg, idx) => (
                    <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="font-medium text-gray-900">{msg.sender}</p>
                      <p className="text-gray-700">{msg.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response here..."
                  rows={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_response">Waiting for Response</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTicket(null);
                    setResponse('');
                    setNewStatus('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => respondMutation.mutate({
                    ticketId: selectedTicket.id,
                    responseText: response,
                    status: newStatus
                  })}
                  disabled={!response.trim() || respondMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {respondMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Response
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TicketList({ tickets, selectedTicket, setSelectedTicket, getStatusColor }) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No tickets in this category</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <div 
          key={ticket.id}
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            selectedTicket?.id === ticket.id ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50'
          }`}
          onClick={() => setSelectedTicket(ticket)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{ticket.subject}</h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <User className="w-3 h-3" />
                {ticket.user_name}
                <span>•</span>
                {new Date(ticket.created_date).toLocaleDateString()}
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ticket.category}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}