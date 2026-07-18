import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Target, AlertTriangle, CheckCircle2, Sparkles,
  Rocket, BookOpen, Clock, ArrowRight, Lightbulb, Gauge
} from 'lucide-react';

const PRIORITY_STYLES = {
  high: { bg: 'bg-red-100', text: 'text-red-700', label: 'High Priority' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium Priority' },
  low: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Low Priority' }
};

function readinessColor(score) {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}
function readinessBar(score) {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function JobReadinessPage() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState('');

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: opportunities = [], isLoading: oppsLoading } = useQuery({
    queryKey: ['readiness-opportunities'],
    queryFn: () => base44.entities.Opportunity.filter({ status: 'active' }, '-created_date', 100)
  });

  const { data: mySkills = [] } = useQuery({
    queryKey: ['my-skills-readiness', user?.email],
    queryFn: () => base44.entities.Skill.filter({ user_email: user.email }),
    enabled: !!user
  });

  const analysisMutation = useMutation({
    mutationFn: (opportunityId) =>
      fetch(`/api/functions/analyzeJobReadiness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId })
      }).then(r => r.json()),
    onError: (e) => toast({ title: 'Analysis failed', description: e.message, variant: 'destructive' })
  });

  const selectedOpp = useMemo(() => opportunities.find(o => o.id === selectedJobId), [opportunities, selectedJobId]);
  const result = analysisMutation.data;
  const hasSkills = mySkills.length > 0;

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Target className="w-8 h-8 text-indigo-600" /> Job Readiness Analyzer</h1>
          <p className="text-gray-600 mt-1">Pick a target role to see your skill gaps and a personalized learning path to qualify for it.</p>
        </div>

        {!hasSkills && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900">No skills on your profile yet</p>
                <p className="text-sm text-amber-700">Add skills in your Profile to get a meaningful gap analysis against job requirements.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job selector */}
        <Card className="mb-6">
          <CardContent className="pt-5">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Target Role</label>
            {oppsLoading ? (
              <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading roles...</div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="flex-1 min-w-[240px]"><SelectValue placeholder="Select a job to analyze against..." /></SelectTrigger>
                  <SelectContent>
                    {opportunities.map(o => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => analysisMutation.mutate(selectedJobId)} disabled={!selectedJobId || analysisMutation.isPending} className="gap-1">
                  {analysisMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Analyze Readiness
                </Button>
              </div>
            )}
            {selectedOpp && (
              <div className="mt-3 text-sm text-gray-600">
                <p className="font-medium text-gray-800">{selectedOpp.title}</p>
                {selectedOpp.skills_required?.length > 0 && (
                  <p className="mt-1">Required: {selectedOpp.skills_required.join(', ')}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {analysisMutation.isPending && (
          <Card><CardContent className="pt-12 pb-12 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-gray-600">Analyzing your profile against this role and building a learning path...</p>
          </CardContent></Card>
        )}

        {result && result.success && (
          <div className="space-y-6">
            {/* Readiness score */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Gauge className="w-5 h-5 text-indigo-600" /> Readiness Score</h2>
                    <p className="text-sm text-gray-600 mt-0.5">How ready you are for "{result.opportunity?.title}"</p>
                  </div>
                  <span className={`text-4xl font-bold ${readinessColor(result.readiness_score || 0)}`}>{result.readiness_score || 0}<span className="text-lg text-gray-400">/100</span></span>
                </div>
                <Progress value={result.readiness_score || 0} className="h-3" indicatorClassName={readinessBar(result.readiness_score || 0)} />
                {result.summary && <p className="text-gray-700 mt-4 text-sm leading-relaxed">{result.summary}</p>}
              </CardContent>
            </Card>

            {/* Quick wins */}
            {result.quick_wins?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Rocket className="w-5 h-5 text-green-600" /> Quick Wins</CardTitle>
                  <CardDescription>Fast actions to boost your candidacy</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {result.quick_wins.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Lightbulb className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Matched skills */}
            {result.matched_skills?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /> Skills You Already Have</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {result.matched_skills.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{s.skill}</p>
                          <Badge variant="secondary" className="text-xs mt-1">{s.strength}</Badge>
                          {s.note && <p className="text-xs text-gray-600 mt-1">{s.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skill gaps */}
            {result.skill_gaps?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /> Skill Gaps to Close</CardTitle>
                  <CardDescription>Required skills you're missing or need to strengthen</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {result.skill_gaps.map((g, i) => {
                      const p = PRIORITY_STYLES[g.priority] || PRIORITY_STYLES.medium;
                      return (
                        <div key={i} className="p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{g.skill}</p>
                            <Badge className={`${p.bg} ${p.text}`}>{p.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Required: <span className="font-medium text-gray-800">{g.required_level || '—'}</span></span>
                            <span>You: <span className="font-medium text-gray-800">{g.current_level || 'none'}</span></span>
                          </div>
                          {g.impact_on_role && <p className="text-sm text-gray-600 mt-2">{g.impact_on_role}</p>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Learning path */}
            {result.learning_path?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="w-5 h-5 text-indigo-600" /> Your Learning Path</CardTitle>
                  <CardDescription>Ordered roadmap to qualify for this role</CardDescription></CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {result.learning_path.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">{i + 1}</div>
                          {i < result.learning_path.length - 1 && <div className="w-0.5 flex-1 bg-indigo-200 my-1" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{step.skill}</p>
                            <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" /> ~{step.estimated_weeks}w</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-0.5">{step.goal}</p>
                          {step.recommended_resources?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {step.recommended_resources.map((r, j) => (
                                <Badge key={j} variant="secondary" className="text-xs gap-1"><BookOpen className="w-3 h-3" />{r}</Badge>
                              ))}
                            </div>
                          )}
                          {step.milestone && <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1"><Target className="w-3 h-3" /> Milestone: {step.milestone}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}