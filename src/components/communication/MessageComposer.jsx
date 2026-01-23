import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, Sparkles, Send, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from 'sonner';

const MESSAGE_TYPES = [
  { value: 'screening_positive', label: 'Screening - Positive', description: 'Invite to next stage' },
  { value: 'screening_negative', label: 'Screening - Rejection', description: 'Polite rejection' },
  { value: 'interview_invitation', label: 'Interview Invitation', description: 'Request interview' },
  { value: 'assessment_request', label: 'Assessment Request', description: 'Request technical assessment' },
  { value: 'offer_extended', label: 'Job Offer', description: 'Extend offer' },
  { value: 'follow_up', label: 'Follow-up', description: 'Check status' },
  { value: 'custom', label: 'Custom Message', description: 'Custom content' }
];

export default function MessageComposer({ applications, opportunity, onClose, onSent }) {
  const [messageType, setMessageType] = useState('screening_positive');
  const [customContext, setCustomContext] = useState('');
  const [draftedMessages, setDraftedMessages] = useState([]);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);

  const draftMessages = async () => {
    setDrafting(true);
    try {
      const response = await base44.functions.invoke('draftPersonalizedMessage', {
        application_ids: applications.map(a => a.id),
        message_type: messageType,
        custom_context: customContext
      });
      setDraftedMessages(response.data.messages);
      toast.success('Messages drafted!');
    } catch (error) {
      toast.error('Failed to draft messages');
      console.error(error);
    } finally {
      setDrafting(false);
    }
  };

  const updateMessage = (index, field, value) => {
    const updated = [...draftedMessages];
    updated[index][field] = value;
    setDraftedMessages(updated);
  };

  const sendMessages = async () => {
    setSending(true);
    try {
      const response = await base44.functions.invoke('sendBulkCandidateEmails', {
        messages: draftedMessages,
        opportunity_id: opportunity.id
      });
      setSendResults(response.data);
      toast.success(`Sent ${response.data.sent} emails successfully!`);
      if (onSent) onSent();
    } catch (error) {
      toast.error('Failed to send messages');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-600" />
            Send Messages to Candidates
          </DialogTitle>
        </DialogHeader>

        {!sendResults ? (
          <div className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5" />
                  Recipients ({applications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {applications.map((app, idx) => (
                    <Badge key={idx} variant="outline">
                      {app.applicant_name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {draftedMessages.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Message Generator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message Type</label>
                    <Select value={messageType} onValueChange={setMessageType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESSAGE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {messageType === 'custom' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Custom Instructions</label>
                      <Textarea
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                        placeholder="Provide context for the AI to generate personalized messages..."
                        rows={3}
                      />
                    </div>
                  )}

                  <Button onClick={draftMessages} disabled={drafting} className="w-full">
                    {drafting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Drafting with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Personalized Messages
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Review & Edit Messages</h3>
                  <Button variant="outline" onClick={() => setDraftedMessages([])}>
                    Start Over
                  </Button>
                </div>

                {draftedMessages.map((msg, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>To: {msg.recipient_name} ({msg.recipient_email})</span>
                        <Badge variant="outline">{idx + 1} of {draftedMessages.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block">Subject</label>
                        <Input
                          value={msg.subject}
                          onChange={(e) => updateMessage(idx, 'subject', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Message</label>
                        <Textarea
                          value={msg.body}
                          onChange={(e) => updateMessage(idx, 'body', e.target.value)}
                          rows={6}
                          className="text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={sendMessages} disabled={sending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send All Messages ({draftedMessages.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <Card className={`${sendResults.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  {sendResults.failed === 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-amber-600" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sendResults.failed === 0 ? 'All Messages Sent!' : 'Messages Sent with Issues'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {sendResults.sent} sent successfully, {sendResults.failed} failed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {sendResults.results.map((result, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${result.success ? 'bg-white' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{result.recipient}</span>
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  {!result.success && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}