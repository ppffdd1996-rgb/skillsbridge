import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Star, ThumbsUp, CheckCircle2, MessageSquare } from 'lucide-react';

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="cursor-pointer hover:scale-110 transition-transform">
          <Star className={`w-7 h-7 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function CandidateFeedbackForm({ interviewId, onSubmitted }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    overall_rating: 0,
    communication_rating: 0,
    professionalism_rating: 0,
    difficulty_rating: 0,
    would_recommend: false,
    candidate_comments: '',
    most_positive_aspect: '',
    improvement_suggestions: ''
  });
  const [done, setDone] = useState(false);

  const submitMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('manageInterviewFeedback', { action: 'submit_candidate', interview_id: interviewId, ...data }).then(r => r.data),
    onSuccess: () => {
      toast({ title: 'Thank you! Your feedback was submitted.' });
      setDone(true);
      onSubmitted && onSubmitted();
    },
    onError: (e) => toast({ title: 'Failed to submit feedback', description: e.message, variant: 'destructive' })
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.overall_rating === 0) {
      toast({ title: 'Please rate your overall experience', variant: 'destructive' });
      return;
    }
    submitMutation.mutate(form);
  };

  if (done) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">Feedback Submitted</h3>
          <p className="text-gray-600 mt-1">Thank you for sharing your experience. Your feedback is securely stored for future reference.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-600" /> Interview Experience Feedback</CardTitle>
        <CardDescription>We value your input — this helps us improve and is kept on record.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Overall Experience</Label>
              <StarRating value={form.overall_rating} onChange={(v) => setForm({ ...form, overall_rating: v })} />
            </div>
            <div>
              <Label>Recruiter Communication</Label>
              <StarRating value={form.communication_rating} onChange={(v) => setForm({ ...form, communication_rating: v })} />
            </div>
            <div>
              <Label>Professionalism</Label>
              <StarRating value={form.professionalism_rating} onChange={(v) => setForm({ ...form, professionalism_rating: v })} />
            </div>
            <div>
              <Label>Interview Difficulty</Label>
              <StarRating value={form.difficulty_rating} onChange={(v) => setForm({ ...form, difficulty_rating: v })} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.would_recommend} onChange={(e) => setForm({ ...form, would_recommend: e.target.checked })} className="rounded" />
            <span className="text-sm flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> I would recommend this company to others</span>
          </label>

          <div>
            <Label>What was the most positive aspect of your experience?</Label>
            <Input value={form.most_positive_aspect} onChange={(e) => setForm({ ...form, most_positive_aspect: e.target.value })} placeholder="e.g. Friendly, well-organized process..." />
          </div>
          <div>
            <Label>Suggestions for improvement</Label>
            <Input value={form.improvement_suggestions} onChange={(e) => setForm({ ...form, improvement_suggestions: e.target.value })} placeholder="Anything we could do better?" />
          </div>
          <div>
            <Label>Additional comments</Label>
            <Textarea rows={4} value={form.candidate_comments} onChange={(e) => setForm({ ...form, candidate_comments: e.target.value })} placeholder="Share any other thoughts about your interview..." />
          </div>

          <Button type="submit" disabled={submitMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Submit Feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}