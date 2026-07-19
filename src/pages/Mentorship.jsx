import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Users, Sparkles, MessageSquare, CheckCircle2, Clock, XCircle } from 'lucide-react';
import MentorCard from '@/components/mentorship/MentorCard';
import MentorshipRequestDialog from '@/components/mentorship/MentorshipRequestDialog';

const STATUS_META = {
  pending: { icon: Clock, color: 'text-amber-600 bg-amber-50', label: 'Pending' },
  accepted: { icon: CheckCircle2, color: 'text-green-600 bg-green-50', label: 'Accepted' },
  declined: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Declined' },
  completed: { icon: CheckCircle2, color: 'text-blue-600 bg-blue-50', label: 'Completed' }
};

export default function MentorshipPage() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [connectMentor, setConnectMentor] = useState(null);
  const [showMatched, setShowMatched] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ['mentors'],
    queryFn: () => base44.entities.Mentor.list()
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-mentorship-requests', user?.email],
    queryFn: () => base44.entities.MentorshipRequest.filter({ mentee_email: user.email }),
    enabled: !!user
  });

  const matchMutation = useMutation({
    mutationFn: (payload) => fetch('/api/functions/findMentors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }).then(r => r.json()),
    onError: e => toast({ title: 'Matching failed', description: e.message, variant: 'destructive' })
  });

  const requestMutation = useMutation({
    mutationFn: async ({ mentor, payload }) => {
      await base44.entities.MentorshipRequest.create({
        mentor_id: mentor.id,
        mentor_name: mentor.name,
        mentee_email: user.email,
        mentee_name: user.full_name,
        mentee_industry: industryFilter || '',
        career_goals: payload.career_goals,
        message: payload.message,
        status: 'pending',
        requested_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast({ title: 'Request sent', description: 'The mentor will review your request.' });
      setConnectMentor(null);
    },
    onError: e => toast({ title: 'Failed to send', description: e.message, variant: 'destructive' })
  });

  const industries = [...new Set(mentors.map(m => m.industry).filter(Boolean))].sort();

  const displayedMentors = (matchMutation.data?.success ? matchMutation.data.ranked_mentors : [])
    .filter(m => !industryFilter || m.industry === industryFilter);

  const browseMentors = mentors
    .filter(m => m.is_available)
    .filter(m => !industryFilter || m.industry === industryFilter)
    .filter(m => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (m.name?.toLowerCase().includes(q) || m.title?.toLowerCase().includes(q) ||
        m.industry?.toLowerCase().includes(q) ||
        m.expertise_areas?.some(a => a.toLowerCase().includes(q)));
    });

  const handleMatch = () => matchMutation.mutate({ target_industry: industryFilter, career_goals: query });
  const requestedMentorIds = new Set(myRequests.map(r => r.mentor_id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-8 h-8 text-indigo-600" /> Mentorship Matching</h1>
          <p className="text-gray-600 mt-1">Find experienced professionals in your industry and get personalized career guidance.</p>
        </div>

        {/* Search + filters */}
        <Card className="mb-6">
          <CardContent className="pt-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input placeholder="Search mentors, industries, or expertise..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
              </div>
              <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm">
                <option value="">All industries</option>
                {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
              <Button onClick={handleMatch} disabled={matchMutation.isPending} className="gap-1">
                {matchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Match Me
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tip: Describe your career goals in the search box, then click AI Match Me for a ranked fit.</p>
          </CardContent>
        </Card>

        {/* My requests */}
        {user && myRequests.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-600" /> My Mentorship Requests</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {myRequests.slice(0, 5).map(r => {
                  const meta = STATUS_META[r.status] || STATUS_META.pending;
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-gray-100 bg-white">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{r.mentor_name}</p>
                        <p className="text-sm text-gray-500 truncate">{r.career_goals || r.message}</p>
                      </div>
                      <Badge className={`${meta.color} flex-shrink-0 gap-1`}><meta.icon className="w-3 h-3" />{meta.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matched results */}
        {matchMutation.isPending && (
          <Card><CardContent className="pt-12 pb-12 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-gray-600">Finding your best mentor matches...</p>
          </CardContent></Card>
        )}

        {matchMutation.data?.success && matchMutation.data.ranked_mentors?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> AI-Ranked Matches</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedMentors.map(m => (
                <MentorCard key={m.id} mentor={m} onConnect={setConnectMentor} />
              ))}
            </div>
          </div>
        )}

        {/* Browse all */}
        {!matchMutation.isPending && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Browse Mentors ({browseMentors.length})</h2>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : browseMentors.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-gray-500">No mentors match your filters. Try AI Match Me for personalized recommendations.</CardContent></Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {browseMentors.map(m => (
                  <MentorCard key={m.id} mentor={{ ...m, fit_score: null }} onConnect={setConnectMentor} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {connectMentor && user && (
        <MentorshipRequestDialog
          mentor={connectMentor}
          user={user}
          open={!!connectMentor}
          onOpenChange={(o) => !o && setConnectMentor(null)}
          onSubmit={async (payload) => {
            if (requestedMentorIds.has(connectMentor.id)) {
              toast({ title: 'Already requested', description: 'You already sent a request to this mentor.', variant: 'destructive' });
              setConnectMentor(null);
              return;
            }
            await requestMutation.mutateAsync({ mentor: connectMentor, payload });
          }}
        />
      )}
    </div>
  );
}