import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';

export default function MentorshipRequestDialog({ mentor, user, open, onOpenChange, onSubmit }) {
  const [careerGoals, setCareerGoals] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ career_goals: careerGoals, message });
      setCareerGoals('');
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request mentorship from {mentor?.name}</DialogTitle>
          <DialogDescription>Send a personalized request. Mentors respond based on fit and availability.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="goals">Your career goals</Label>
            <Input id="goals" placeholder="e.g. Transition from QA to SDET, prepare for senior eng promotion" value={careerGoals} onChange={e => setCareerGoals(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="msg">Personal message</Label>
            <Textarea id="msg" rows={4} placeholder={`Hi ${mentor?.name?.split(' ')[0] || ''}, I'd love your guidance on...`} value={message} onChange={e => setMessage(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !careerGoals.trim()} className="gap-1">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}