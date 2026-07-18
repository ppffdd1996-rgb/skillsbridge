import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare, Star, Loader2, Clock, CheckCircle2, FileText,
  TrendingUp, ThumbsUp, ThumbsDown, User, Calendar, Briefcase, Sparkles
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Awaiting Candidate', color: 'gray', icon: Clock },
  candidate_submitted: { label: 'Candidate Feedback In', color: 'blue', icon: MessageSquare },
  recruiter_noted: { label: 'Notes Saved', color: 'amber', icon: FileText },
  completed: { label: 'Complete', color: 'green', icon: CheckCircle2 }
};

function StarRating({ value, onChange, readOnly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" disabled={readOnly} onClick={() => onChange && onChange(n)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}>
          <Star className={`w-5 h-5 ${n <= (value || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function InterviewFeedbackPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [notesForm, setNotesForm] = useState({ recruiter_notes: '', strengths_observed: '', concerns_observed: '' });

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['my-interview-feedback'],
    queryFn: () => base44.entities.InterviewFeedback.filter({ recruiter_email: user?.email }, '-created_date'),
    enabled: !!user
  });

  const saveNotesMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('manageInterviewFeedback', { action: 'submit_recruiter_notes', ...payload }).then(r => r.data),
    onSuccess: (data) => {
      toast({ title: 'Qualitative notes saved!' });
      queryClient.invalidateQueries({ queryKey: ['my-interview-feedback'] });
      setSelectedFeedback(null);
    },
    onError: (e) => toast({ title: 'Failed to save notes', description: e.message, variant: 'destructive' })
  });

  const stats = useMemo(() => {
    const pending = feedback.filter(f => f.status === 'pending').length;
    const candidateDone = feedback.filter(f => ['candidate_submitted', 'completed'].includes(f.status)).length;
    const rated = feedback.filter(f => f.overall_rating);
    const avgRating = rated.length > 0 ? (rated.reduce((s, f) => s + (f.overall_rating || 0), 0) / rated.length).toFixed(1) : '—';
    const recommendRate = rated.length > 0 ? Math.round((rated.filter(f => f.would_recommend).length / rated.length) * 100) : 0;
    return { total: feedback.length, pending, candidateDone, avgRating, recommendRate };
  }, [feedback]);

  const filtered = useMemo(() => statusFilter === 'all' ? feedback : feedback.filter(f => f.status === statusFilter), [feedback, statusFilter]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const openNotes = (f) => {
    setSelectedFeedback(f);
    setNotesForm({ recruiter_notes: f.recruiter_notes || '', strengths_observed: f.strengths_observed || '', concerns_observed: f.concerns_observed || '' });
  };

  const handleSaveNotes = (e) => {
    e.preventDefault();
    saveNotesMutation.mutate({ feedback_id: selectedFeedback.id, ...notesForm });
  };

  const statCards = [
    { label: 'Total Interviews', value: stats.total, icon: MessageSquare, color: 'indigo' },
    { label: 'Awaiting Candidate', value: stats.pending, icon: Clock, color: 'gray' },
    { label: 'Avg Experience', value: stats.avgRating, icon: Star, color: 'amber' },
    { label: 'Would Recommend', value: `${stats.recommendRate}%`, icon: ThumbsUp, color: 'green' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Feedback</h1>
          <p className="text-gray-600 mt-1">Auto-collected candidate experience and qualitative recruiter notes for future reference</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  </div>
                  <div className={`p-2 bg-${s.color}-100 rounded-lg`}><s.icon className={`w-5 h-5 text-${s.color}-600`} /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Feedback Records</h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="pt-12 pb-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No feedback records yet. Feedback is auto-created when an interview is marked completed.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(f => {
              const cfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.pending;
              return (
                <Card key={f.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-3 bg-${cfg.color}-100 rounded-lg flex-shrink-0`}>
                          <cfg.icon className={`w-5 h-5 text-${cfg.color}-600`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900">{f.candidate_name || f.candidate_email}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{f.job_title || f.opportunity_title || 'N/A'}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{f.interview_date ? new Date(f.interview_date).toLocaleDateString() : ''}</span>
                          </div>
                          {f.overall_rating && (
                            <div className="flex items-center gap-1 mt-2">
                              <StarRating value={f.overall_rating} readOnly />
                              <span className="text-xs text-gray-500 ml-1">experience</span>
                              {f.would_recommend && <Badge className="ml-2 bg-green-100 text-green-800"><ThumbsUp className="w-3 h-3 mr-1" />Recommends</Badge>}
                            </div>
                          )}
                          {f.qualitative_summary && (
                            <p className="text-sm text-gray-600 mt-2 italic line-clamp-2">"{f.qualitative_summary}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`bg-${cfg.color}-100 text-${cfg.color}-800`}>{cfg.label}</Badge>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => openNotes(f)}>
                          <FileText className="w-3.5 h-3.5" /> {f.recruiter_notes ? 'View / Edit Notes' : 'Add Notes'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes / Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(o) => !o && setSelectedFeedback(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle>Interview Feedback — {selectedFeedback.candidate_name || selectedFeedback.candidate_email}</DialogTitle>
                <DialogDescription>{selectedFeedback.job_title || selectedFeedback.opportunity_title}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="candidate">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="candidate"><User className="w-4 h-4 mr-1" />Candidate Experience</TabsTrigger>
                  <TabsTrigger value="recruiter"><FileText className="w-4 h-4 mr-1" />Recruiter Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="candidate" className="space-y-4 mt-4">
                  {selectedFeedback.candidate_submitted_at ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Overall Experience</Label>
                          <StarRating value={selectedFeedback.overall_rating} readOnly />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Communication</Label>
                          <StarRating value={selectedFeedback.communication_rating} readOnly />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Professionalism</Label>
                          <StarRating value={selectedFeedback.professionalism_rating} readOnly />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Perceived Difficulty</Label>
                          <StarRating value={selectedFeedback.difficulty_rating} readOnly />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedFeedback.would_recommend ? (
                          <Badge className="bg-green-100 text-green-800"><ThumbsUp className="w-3 h-3 mr-1" />Would recommend</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800"><ThumbsDown className="w-3 h-3 mr-1" />Would not recommend</Badge>
                        )}
                        <span className="text-xs text-gray-500">Submitted {new Date(selectedFeedback.candidate_submitted_at).toLocaleDateString()}</span>
                      </div>
                      {selectedFeedback.most_positive_aspect && (
                        <div><Label className="text-xs text-gray-500">Most Positive Aspect</Label><p className="text-sm text-gray-700 mt-1">{selectedFeedback.most_positive_aspect}</p></div>
                      )}
                      {selectedFeedback.improvement_suggestions && (
                        <div><Label className="text-xs text-gray-500">Improvement Suggestions</Label><p className="text-sm text-gray-700 mt-1">{selectedFeedback.improvement_suggestions}</p></div>
                      )}
                      {selectedFeedback.candidate_comments && (
                        <div><Label className="text-xs text-gray-500">Candidate Comments</Label><p className="text-sm text-gray-700 mt-1">{selectedFeedback.candidate_comments}</p></div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>The candidate hasn't submitted their feedback yet.</p>
                      <p className="text-xs mt-1">A request was {selectedFeedback.feedback_request_sent ? 'sent' : 'will be sent'} to {selectedFeedback.candidate_email}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recruiter" className="space-y-4 mt-4">
                  {selectedFeedback.qualitative_summary && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div><Label className="text-xs text-indigo-600">AI Summary</Label><p className="text-sm text-gray-700 mt-1">{selectedFeedback.qualitative_summary}</p></div>
                    </div>
                  )}
                  <form onSubmit={handleSaveNotes} className="space-y-4">
                    <div>
                      <Label>Qualitative Notes</Label>
                      <Textarea rows={4} value={notesForm.recruiter_notes} onChange={(e) => setNotesForm({ ...notesForm, recruiter_notes: e.target.value })} placeholder="Your observations about the candidate during the interview..." />
                    </div>
                    <div>
                      <Label>Strengths Observed</Label>
                      <Textarea rows={2} value={notesForm.strengths_observed} onChange={(e) => setNotesForm({ ...notesForm, strengths_observed: e.target.value })} placeholder="Key strengths demonstrated..." />
                    </div>
                    <div>
                      <Label>Concerns / Areas to Probe</Label>
                      <Textarea rows={2} value={notesForm.concerns_observed} onChange={(e) => setNotesForm({ ...notesForm, concerns_observed: e.target.value })} placeholder="Concerns or follow-up areas..." />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setSelectedFeedback(null)}>Cancel</Button>
                      <Button type="submit" disabled={saveNotesMutation.isPending} className="gap-2">
                        {saveNotesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Save Notes
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}