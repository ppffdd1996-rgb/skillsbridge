import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, Loader2, Sparkles, Crown, Star, Target, 
  ChevronDown, ChevronUp, Zap, Users
} from 'lucide-react';

const RANK_STYLES = [
  { bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'text-white', icon: Crown, label: '#1' },
  { bg: 'bg-gradient-to-r from-gray-300 to-gray-400', text: 'text-white', icon: Trophy, label: '#2' },
  { bg: 'bg-gradient-to-r from-orange-300 to-orange-400', text: 'text-white', icon: Trophy, label: '#3' },
];

function ScoreRing({ score }) {
  const pct = Math.round((score || 0) * 100);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#eab308' : pct >= 40 ? '#f97316' : '#ef4444';
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="32" cy="32" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-gray-900">{pct}%</span>
      </div>
    </div>
  );
}

function CandidateCard({ candidate, rank }) {
  const [expanded, setExpanded] = useState(false);
  const rankStyle = RANK_STYLES[rank] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Star, label: `#${rank + 1}` };
  const RankIcon = rankStyle.icon;
  const matchPct = Math.round((candidate.match_score || 0) * 100);

  return (
    <Card className={`overflow-hidden ${rank < 3 ? 'border-2 border-transparent' : ''}`} style={rank < 3 ? { borderColor: rank === 0 ? '#facc15' : rank === 1 ? '#d1d5db' : '#fdba74' } : {}}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Rank badge */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${rankStyle.bg} flex items-center justify-center ${rankStyle.text}`}>
            <RankIcon className="w-6 h-6" />
          </div>

          {/* Candidate info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-lg">{candidate.candidate_name}</h3>
              <Badge className={rankStyle.bg + ' ' + rankStyle.text}>{rankStyle.label}</Badge>
              {candidate.application_status && (
                <Badge variant="outline">{candidate.application_status}</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{candidate.talent_email}</p>

            {/* AI ranking note */}
            {candidate.ranking_note && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-indigo-50 rounded-lg">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-900">{candidate.ranking_note}</p>
              </div>
            )}

            {/* Strongest matching skills */}
            {candidate.matched_skills?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-green-600" /> Strongest Matching Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.matched_skills.map((skill, i) => (
                    <Badge key={i} className="bg-green-100 text-green-800 border border-green-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setExpanded(!expanded)} className="mt-3 text-xs text-indigo-600 hover:underline flex items-center gap-1">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Show less' : 'Show details'}
            </button>

            {expanded && (
              <div className="mt-3 pt-3 border-t space-y-3">
                {candidate.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Application Strengths</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                      {candidate.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {candidate.missing_skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Missing Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.missing_skills.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-gray-500 border-gray-300">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {candidate.ai_summary && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">AI Summary</p>
                    <p className="text-sm text-gray-600">{candidate.ai_summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Score ring */}
          <div className="flex-shrink-0">
            <ScoreRing score={candidate.match_score} />
            <p className="text-xs text-center text-gray-500 mt-1">match</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CandidateRankingsPage() {
  const [user, setUser] = useState(null);
  const [selectedOpp, setSelectedOpp] = useState('');

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: myOpportunities = [], isLoading: oppsLoading } = useQuery({
    queryKey: ['myOpportunities'],
    queryFn: () => base44.entities.Opportunity.filter({ creator_id: user?.email }),
    enabled: !!user
  });

  const { data: ranking, isLoading: rankingLoading, refetch, isFetching } = useQuery({
    queryKey: ['candidate-ranking', selectedOpp],
    queryFn: () => base44.functions.invoke('generateCandidateRanking', { opportunity_id: selectedOpp }).then(r => r.data),
    enabled: !!selectedOpp,
    refetchOnWindowFocus: false
  });

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const opportunity = ranking?.opportunity;
  const candidates = ranking?.candidates || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" /> Candidate Rankings
          </h1>
          <p className="text-gray-600 mt-1">Top candidates for each of your jobs, ranked by match strength with AI insights</p>
        </div>

        {/* Opportunity selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <Select value={selectedOpp} onValueChange={setSelectedOpp}>
                <SelectTrigger className="flex-1"><SelectValue placeholder={oppsLoading ? 'Loading jobs...' : 'Select a job to view rankings'} /></SelectTrigger>
                <SelectContent>
                  {myOpportunities.map(opp => (
                    <SelectItem key={opp.id} value={opp.id}>{opp.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOpp && (
                <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2">
                  {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Refresh
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedOpp ? (
          <Card><CardContent className="pt-12 pb-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Select a job above to see your top-ranked candidates.</p>
          </CardContent></Card>
        ) : rankingLoading || isFetching ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <Card key={i}><CardContent className="pt-6">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gray-200" />
                </div>
              </CardContent></Card>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <Card><CardContent className="pt-12 pb-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No ranked candidates yet for this job. Matches will appear here once candidates are scored.</p>
          </CardContent></Card>
        ) : (
          <>
            {/* Job context */}
            {opportunity && (
              <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold text-gray-900">{opportunity.title}</h2>
                  {opportunity.company_name && <p className="text-sm text-gray-600">{opportunity.company_name}</p>}
                  {opportunity.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {opportunity.skills_required.map((s, i) => (
                        <Badge key={i} variant="outline" className="bg-white">{s}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing top <span className="font-semibold text-gray-900">{candidates.length}</span> candidate{candidates.length !== 1 ? 's' : ''}
              </p>
              <Badge className="bg-indigo-100 text-indigo-800 gap-1">
                <Sparkles className="w-3 h-3" /> AI-ranked
              </Badge>
            </div>

            <div className="space-y-3">
              {candidates.map((c, i) => (
                <CandidateCard key={c.talent_email} candidate={c} rank={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}