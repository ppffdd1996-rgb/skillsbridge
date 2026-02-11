import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MessageButton({ 
  recipientEmail, 
  recipientName, 
  applicationId,
  interviewId,
  opportunityId,
  variant = "outline",
  size = "default",
  className = ""
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const startChat = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      const response = await base44.functions.invoke('startConversation', {
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        application_id: applicationId,
        interview_id: interviewId,
        opportunity_id: opportunityId,
        initial_message: message
      });

      if (response.data.success) {
        toast.success('Message sent!');
        setOpen(false);
        setMessage('');
        navigate(createPageUrl('Messages'));
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={`gap-2 ${className}`}
      >
        <MessageSquare className="w-4 h-4" />
        Message
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {recipientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={startChat}
                disabled={!message.trim() || sending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}