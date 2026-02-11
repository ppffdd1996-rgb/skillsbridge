import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, Send, Loader2, CheckCircle, Clock, 
  AlertCircle, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-tickets', user?.email],
    queryFn: () => base44.entities.SupportTicket.filter({ 
      user_email: user.email 
    }).then(tickets => tickets.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )),
    enabled: !!user
  });

  const submitTicket = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.SupportTicket.create({
        user_email: user.email,
        user_name: user.full_name || user.display_name,
        subject,
        description,
        category,
        status: 'open',
        priority: 'medium',
        conversation: [{
          sender: user.email,
          message: description,
          timestamp: new Date().toISOString()
        }]
      });

      toast.success('Support ticket submitted!');
      setSubject('');
      setDescription('');
      setCategory('other');
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    } catch (error) {
      toast.error('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

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

  const getStatusIcon = (status) => {
    const icons = {
      open: AlertCircle,
      in_progress: Clock,
      waiting_response: Mail,
      resolved: CheckCircle,
      closed: CheckCircle
    };
    const Icon = icons[status] || AlertCircle;
    return <Icon className="w-4 h-4" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to access support</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <MessageSquare className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h1>
          <p className="text-xl text-gray-600">We're here to help! Submit a ticket and our team will respond shortly.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Submit Ticket Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit a New Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing Question</SelectItem>
                      <SelectItem value="account">Account Help</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide detailed information about your issue..."
                    rows={6}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Ticket History */}
          <Card>
            <CardHeader>
              <CardTitle>Your Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No support tickets yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{ticket.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                        </div>
                        <Badge className={`${getStatusColor(ticket.status)} ml-2`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(ticket.status)}
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {ticket.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ticket.priority}
                          </Badge>
                        </span>
                        <span>{new Date(ticket.created_date).toLocaleDateString()}</span>
                      </div>

                      {ticket.admin_response && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-1">Admin Response:</p>
                          <p className="text-sm text-gray-600">{ticket.admin_response}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(ticket.responded_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}