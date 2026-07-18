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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, ClipboardCheck, Users, Loader2, Plus, X, TrendingUp,
  ThumbsUp, ThumbsDown, Minus, ArrowRight, Trophy
} from 'lucide-react';

const CRITERIA_CATEGORIES = [
  { value: 'technical_skill', label: 'Technical Skill' },
  { value: 'problem_solving', label: 'Problem Solving' },
  { value: 'communication', label: 'Communication' },
  { value: 'culture_fit', label: 'Culture Fit' },
  { value: 'experience', label: 'Experience' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'teamwork', label: 'Teamwork' },
  { value: 'adaptability', label: 'Adaptability' },
  { value: 'motivation', label: 'Motivation' },
  { value: 'other', label: 'Other' }
];

const RECOMMENDATION_CONFIG = {
  strong_no: { label: 'Strong No', color: 'red', icon: ThumbsDown },
  no: { label: 'No', color: 'orange', icon: ThumbsDown },
  neutral: { label: 'Neutral', color: 'gray', icon: Minus },
  yes: { label: 'Yes', color: 'green', icon: ThumbsUp },
  strong_yes: { label: 'Strong Yes', color: 'emerald', icon: ThumbsUp }
};

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={`w-6 h-6 ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`} />
        </button>
      ))}
    </div>
  );
}

export default function ScorecardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [compareIds, setCompareIds] = useState([]);

  const [formData, setFormData] = useState({
    criteria_scores: [],
    overall_recommendation: 'neutral',
    strengths: [],
    concerns: [],
    general_notes: ''
  });
  const [newStrength, setNewStrength] = useState('');
  const [newConcern, setNewConcern] = useState('');

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: interviews = [], isLoading: interviewsLoading } = useQuery({
    queryKey: ['recruiter-interviews'],
    queryFn: () => base44.entities.Interview.filter({ recruiter_email: user?.email }, '-scheduled_time'),
    enabled: !!user
  });

  const { data: scorecards = [], isLoading: scorecardsLoading } = useQuery({
    queryKey: ['my-scorecards'],
    queryFn: () => base44.entities.Scorecard.filter({ recruiter_email: user?.email }, '-updated_date'),
    enabled: !!user
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('saveScorecard', data);
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Scorecard saved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['my-scorecards'] });
      setDialogOpen(false);
      setSelectedInterview(null);
    },
    onError: (error) => {
      toast({ title: 'Failed to save scorecard', description: error.message, variant: 'destructive' });
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const openScorecard = (interview) => {
    const existing = scorecards.find(s => s.interview_id === interview.id);
    setFormData({
      criteria_scores: existing?.criteria_scores?.length ? existing.criteria_scores : [
        { category: 'technical_skill', category_label: 'Technical Skill', score: 0, notes: '' },
        { category: 'problem_solving', category_label: 'Problem Solving', score: 0, notes: '' },
        { category: 'communication', category_label: 'Communication', score: 0, notes: '' },
        { category: 'culture_fit', category_label: 'Culture Fit', score: 0, notes: '' }
      ],
      overall_recommendation: existing?.overall_recommendation || 'neutral',
      strengths: existing?.strengths || [],
      concerns: existing?.concerns || [],
      general_notes: existing?.general_notes || ''
    });
    setSelectedInterview(interview);
    setDialogOpen(true);
  };

  const updateCriterion = (idx, field, value) => {
    const scores = [...formData.criteria_scores];
    scores[idx] = { ...scores[idx], [field]: value };
    if (field === 'category') {
      scores[idx].category_label = CRITERIA_CATEGORIES.find(c => c.value === value)?.label || value;
    }
    setFormData({ ...formData, criteria_scores: scores });
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      criteria_scores: [...formData.criteria_scores, { category: 'other', category_label: 'Other', score: 0, notes: '' }]
    });
  };

  const removeCriterion = (idx) => {
    setFormData({ ...formData, criteria_scores: formData.criteria_scores.filter((_, i) => i !== idx) });
  };

  const handleSubmit = (status) => {
    saveMutation.mutate({
      interview_id: selectedInterview.id,
      application_id: selectedInterview.application_id,
      candidate_email: selectedInterview.candidate_email,
      criteria_scores: formData.criteria_scores,
      overall_recommendation: formData.overall_recommendation,
      strengths: formData.strengths,
      concerns: formData.concerns,
      general_notes: formData.general_notes,
      status,
      scorecard_id: scorecards.find(s => s.interview_id === selectedInterview.id)?.id
    });
  };

  const toggleCompare = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length < 4 ? [...prev, id] : prev));
  };

  const compareScorecards = scorecards.filter(s => compareIds.includes(s.id));
  const avgScore = (scores) => {
    const valid = scores.filter(s => s && typeof s.score === 'number' && s.score > 0);
    return valid.length ? (valid.reduce((sum, s) => sum + s.score, 0) / valid.length).toFixed(1) : '-';
  };

  const stats = {
    total: scorecards.length,
    submitted: scorecards.filter(s => s.status === 'submitted').length,
    avg: scorecards.filter(s => s.overall_score).length
      ? (scorecards.filter(s => s.overall_score).reduce((sum, s) => sum + s.overall_score, 0) / scorecards.filter(s => s.overall_score).length).toFixed(1)
      : '-',
    positive: scorecards.filter(s => ['yes', 'strong_yes'].includes(s.overall_recommendation)).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Scorecards</h1>
          <p className="text-gray-600 mt-1">Rate candidates across criteria and compare to make better hiring decisions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Scorecards', value: stats.total, icon: ClipboardCheck, color: 'indigo' },
            { label: 'Submitted', value: stats.submitted, icon: ThumbsUp, color: 'blue' },
            { label: 'Avg Score', value: stats.avg, icon: Star, color: 'yellow' },
            { label: 'Positive Recs', value: stats.positive, icon: Trophy, color: 'green' }
          ].map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="scorecards">
          <TabsList className="mb-6">
            <TabsTrigger value="scorecards">My Scorecards</TabsTrigger>
            <TabsTrigger value="new">Pending Interviews</TabsTrigger>
            <TabsTrigger value="compare">Compare ({compareIds.length})</TabsTrigger>
          </TabsList>

          {/* My Scorecards */}
          <TabsContent value="scorecards">
            {scorecardsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : scorecards.length === 0 ? (
              <Card><CardContent className="pt-12 pb-12 text-center">
                <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No scorecards yet. Complete an interview to start rating.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {scorecards.map(sc => {
                  const RecIcon = RECOMMENDATION_CONFIG[sc.overall_recommendation]?.icon || Minus;
                  return (
                    <Card key={sc.id} className={compareIds.includes(sc.id) ? 'ring-2 ring-indigo-500' : ''}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-3 bg-${RECOMMENDATION_CONFIG[sc.overall_recommendation]?.color}-100 rounded-lg`}>
                              <RecIcon className={`w-5 h-5 text-${RECOMMENDATION_CONFIG[sc.overall_recommendation]?.color}-600`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{sc.candidate_name || sc.candidate_email}</h3>
                              {sc.opportunity_title && <p className="text-sm text-gray-600">{sc.opportunity_title}</p>}
                              <div className="flex items-center gap-2 mt-2">
                                {sc.overall_score && (
                                  <Badge className="bg-yellow-100 text-yellow-800 gap-1">
                                    <Star className="w-3 h-3 fill-yellow-500" /> {sc.overall_score.toFixed(1)}
                                  </Badge>
                                )}
                                <Badge variant="outline">{RECOMMENDATION_CONFIG[sc.overall_recommendation]?.label}</Badge>
                                <Badge variant={sc.status === 'submitted' ? 'default' : 'secondary'}>{sc.status}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => toggleCompare(sc.id)}>
                              {compareIds.includes(sc.id) ? 'Remove' : 'Compare'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              const interview = interviews.find(i => i.id === sc.interview_id);
                              openScorecard(interview || { id: sc.interview_id, application_id: sc.application_id, candidate_email: sc.candidate_email });
                            }}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Pending Interviews */}
          <TabsContent value="new">
            {interviewsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : interviews.length === 0 ? (
              <Card><CardContent className="pt-12 pb-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No interviews assigned to you.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {interviews.map(interview => {
                  const hasScorecard = scorecards.some(s => s.interview_id === interview.id);
                  return (
                    <Card key={interview.id}>
                      <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{interview.candidate_email}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(interview.scheduled_time).toLocaleString()} · {interview.status}
                          </p>
                          {hasScorecard && <Badge className="mt-2 bg-green-100 text-green-800">Scorecard exists</Badge>}
                        </div>
                        <Button onClick={() => openScorecard(interview)} className="gap-2">
                          <ClipboardCheck className="w-4 h-4" />
                          {hasScorecard ? 'Edit Scorecard' : 'Start Scorecard'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Compare */}
          <TabsContent value="compare">
            {compareScorecards.length < 2 ? (
              <Card><CardContent className="pt-12 pb-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Select 2-4 scorecards from the "My Scorecards" tab to compare side by side.</p>
              </CardContent></Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Candidate Comparison</CardTitle>
                  <CardDescription>Side-by-side comparison of {compareScorecards.length} candidates</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Criterion</th>
                        {compareScorecards.map(sc => (
                          <th key={sc.id} className="text-center p-3 min-w-[150px]">
                            <p className="font-semibold text-gray-900 text-sm">{sc.candidate_name || sc.candidate_email.split('@')[0]}</p>
                            <Badge className={`mt-1 bg-${RECOMMENDATION_CONFIG[sc.overall_recommendation]?.color}-100 text-${RECOMMENDATION_CONFIG[sc.overall_recommendation]?.color}-800`}>
                              {RECOMMENDATION_CONFIG[sc.overall_recommendation]?.label}
                            </Badge>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-yellow-50">
                        <td className="p-3 font-semibold text-sm">Overall Score</td>
                        {compareScorecards.map(sc => (
                          <td key={sc.id} className="text-center p-3">
                            <span className="text-lg font-bold text-gray-900">{sc.overall_score ? sc.overall_score.toFixed(1) : '-'}</span>
                            <span className="text-gray-400 text-sm">/5</span>
                          </td>
                        ))}
                      </tr>
                      {CRITERIA_CATEGORIES.map(cat => {
                        const anyHas = compareScorecards.some(sc => sc.criteria_scores?.some(c => c.category === cat.value));
                        if (!anyHas) return null;
                        return (
                          <tr key={cat.value} className="border-b">
                            <td className="p-3 text-sm text-gray-700">{cat.label}</td>
                            {compareScorecards.map(sc => {
                              const score = sc.criteria_scores?.find(c => c.category === cat.value);
                              return (
                                <td key={sc.id} className="text-center p-3">
                                  {score?.score ? (
                                    <div className="flex justify-center gap-0.5">
                                      {[1,2,3,4,5].map(n => (
                                        <Star key={n} className={`w-3.5 h-3.5 ${n <= score.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                      ))}
                                    </div>
                                  ) : <span className="text-gray-300">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      <tr className="border-b">
                        <td className="p-3 text-sm font-semibold text-gray-700">Strengths</td>
                        {compareScorecards.map(sc => (
                          <td key={sc.id} className="p-3 text-xs text-gray-600">
                            {sc.strengths?.length ? sc.strengths.join('; ') : '—'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-sm font-semibold text-gray-700">Concerns</td>
                        {compareScorecards.map(sc => (
                          <td key={sc.id} className="p-3 text-xs text-gray-600">
                            {sc.concerns?.length ? sc.concerns.join('; ') : '—'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Scorecard Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Interview Scorecard</DialogTitle>
              <DialogDescription>
                {selectedInterview?.candidate_email} · Rate each criterion 1-5 stars
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Criteria */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Evaluation Criteria</Label>
                  <Button size="sm" variant="outline" onClick={addCriterion} className="gap-1">
                    <Plus className="w-3 h-3" /> Add Criterion
                  </Button>
                </div>
                {formData.criteria_scores.map((crit, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <Select value={crit.category} onValueChange={(v) => updateCriterion(idx, 'category', v)}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CRITERIA_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <StarRating value={crit.score} onChange={(n) => updateCriterion(idx, 'score', n)} />
                      <Button size="icon" variant="ghost" onClick={() => removeCriterion(idx)}>
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                    <Textarea
                      value={crit.notes}
                      onChange={(e) => updateCriterion(idx, 'notes', e.target.value)}
                      placeholder="Notes for this criterion..."
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div>
                <Label className="text-base font-semibold mb-2 block">Overall Recommendation</Label>
                <Select value={formData.overall_recommendation} onValueChange={(v) => setFormData({ ...formData, overall_recommendation: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECOMMENDATION_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Strengths */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Strengths</Label>
                <div className="flex gap-2 mb-2">
                  <Input value={newStrength} onChange={(e) => setNewStrength(e.target.value)} placeholder="Add a strength..." />
                  <Button size="icon" variant="outline" onClick={() => {
                    if (newStrength.trim()) { setFormData({ ...formData, strengths: [...formData.strengths, newStrength.trim()] }); setNewStrength(''); }
                  }}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.strengths.map((s, i) => (
                    <Badge key={i} className="bg-green-100 text-green-800 gap-1">
                      {s} <button onClick={() => setFormData({ ...formData, strengths: formData.strengths.filter((_, idx) => idx !== i) })}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Concerns */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Concerns</Label>
                <div className="flex gap-2 mb-2">
                  <Input value={newConcern} onChange={(e) => setNewConcern(e.target.value)} placeholder="Add a concern..." />
                  <Button size="icon" variant="outline" onClick={() => {
                    if (newConcern.trim()) { setFormData({ ...formData, concerns: [...formData.concerns, newConcern.trim()] }); setNewConcern(''); }
                  }}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.concerns.map((c, i) => (
                    <Badge key={i} className="bg-red-100 text-red-800 gap-1">
                      {c} <button onClick={() => setFormData({ ...formData, concerns: formData.concerns.filter((_, idx) => idx !== i) })}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* General Notes */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">General Notes</Label>
                <Textarea value={formData.general_notes} onChange={(e) => setFormData({ ...formData, general_notes: e.target.value })} placeholder="Overall comments..." rows={3} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Draft
              </Button>
              <Button onClick={() => handleSubmit('submitted')} disabled={saveMutation.isPending} className="gap-2">
                Submit Scorecard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}