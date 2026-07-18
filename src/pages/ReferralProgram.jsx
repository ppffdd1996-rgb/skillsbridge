import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Network, Trophy, DollarSign, Loader2, Search,
  CheckCircle2, Banknote, XCircle, Award, TrendingUp, UserCircle, ArrowRight, Clock
} from 'lucide-react';

const STATUS_COLORS = {
  invited: 'blue', viewed: 'gray', applied: 'purple', interviewing: 'orange',
  offered: 'yellow', hired: 'green', rejected: 'red', expired: 'gray'
};

const BONUS_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'yellow', icon: Clock },
  approved: { label: 'Approved', color: 'blue', icon: CheckCircle2 },
  paid: { label: 'Paid', color: 'green', icon: Banknote },
  cancelled: { label: 'Cancelled', color: 'gray', icon: XCircle }
};

export default function ReferralProgramPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bonusFilter, setBonusFilter] = useState('all');

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['all-referrals'],
    queryFn: () => base44.entities.Referral.list('-invited_at', 200),
    enabled: !!user
  });

  const { data: bonuses = [], isLoading: bonusesLoading } = useQuery({
    queryKey: ['all-referral-bonuses'],
    queryFn: () => base44.entities.ReferralBonus.list('-awarded_at', 200),
    enabled: !!user
  });

  const manageMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('manageReferralBonus', payload).then(r => r.data),
    onSuccess: (_, vars) => {
      toast({ title: `Bonus ${vars.action === 'pay' ? 'paid' : vars.action === 'approve' ? 'approved' : 'updated'}` });
      queryClient.invalidateQueries({ queryKey: ['all-referral-bonuses'] });
    },
    onError: (e) => toast({ title: 'Failed', description: e.message, variant: 'destructive' })
  });

  // Leaderboard: count referrals per referrer
  const leaderboard = useMemo(() => {
    const map = {};
    referrals.forEach(r => {
      const key = r.referrer_email;
      if (!map[key]) map[key] = { email: key, name: r.referrer_name || key, total: 0, hired: 0 };
      map[key].total++;
      if (r.status === 'hired') map[key].hired++;
    });
    return Object.values(map).sort((a, b) => b.hired - a.hired || b.total - a.total).slice(0, 10);
  }, [referrals]);

  // Network: referrer -> candidates
  const network = useMemo(() => {
    const map = {};
    referrals.forEach(r => {
      const key = r.referrer_email;
      if (!map[key]) map[key] = { referrer_name: r.referrer_name || key, referrer_email: key, candidates: [] };
      map[key].candidates.push(r);
    });
    return Object.values(map);
  }, [referrals]);

  const filteredReferrals = referrals.filter(r => {
    const ms = !search || r.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.referrer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.opportunity_title?.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === 'all' || r.status === statusFilter;
    return ms && mf;
  });

  const filteredBonuses = bonuses.filter(b => bonusFilter === 'all' || b.status === bonusFilter);

  const stats = {
    totalReferrals: referrals.length,
    activeReferrers: Object.keys(network).length,
    hired: referrals.filter(r => r.status === 'hired').length,
    totalPaid: bonuses.filter(b => b.status === 'paid').reduce((s, b) => s + (b.bonus_amount || 0), 0),
    pendingBonuses: bonuses.filter(b => b.status === 'pending').length
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <XCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-900">Admin Access Required</h2>
            <p className="text-gray-600 mt-1">The referral program tracker is only available to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Referrals', value: stats.totalReferrals, icon: Network, color: 'indigo' },
    { label: 'Active Referrers', value: stats.activeReferrers, icon: Users, color: 'blue' },
    { label: 'Candidates Hired', value: stats.hired, icon: Trophy, color: 'green' },
    { label: 'Bonuses Paid', value: `$${stats.totalPaid.toLocaleString()}`, icon: DollarSign, color: 'emerald' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-gray-600 mt-1">Track who recommended whom and manage referral bonuses</p>
        </div>

        {/* Stats */}
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

        {stats.pendingBonuses > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">{stats.pendingBonuses}</span> referral bonus(es) awaiting approval in the Bonuses tab.
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="tracker">
          <TabsList className="mb-6">
            <TabsTrigger value="tracker">Tracker</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="bonuses">Bonuses ({bonuses.length})</TabsTrigger>
          </TabsList>

          {/* Tracker */}
          <TabsContent value="tracker">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by candidate, referrer, or role..." className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.keys(STATUS_COLORS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : filteredReferrals.length === 0 ? (
              <Card><CardContent className="pt-12 pb-12 text-center"><Network className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600">No referrals found.</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filteredReferrals.map(r => (
                  <Card key={r.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <div className="p-2 bg-indigo-100 rounded-full"><UserCircle className="w-4 h-4 text-indigo-600" /></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.referrer_name || r.referrer_email}</p>
                            <p className="text-xs text-gray-500">Referrer</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <div className="p-2 bg-purple-100 rounded-full"><Users className="w-4 h-4 text-purple-600" /></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.candidate_name || r.candidate_email}</p>
                            <p className="text-xs text-gray-500">{r.relationship}</p>
                          </div>
                        </div>
                        <div className="flex-1 min-w-[160px]">
                          <p className="text-sm text-gray-700">{r.opportunity_title || 'Unknown role'}</p>
                          {r.company_name && <p className="text-xs text-gray-500">{r.company_name}</p>}
                        </div>
                        <Badge className={`bg-${STATUS_COLORS[r.status]}-100 text-${STATUS_COLORS[r.status]}-800`}>{r.status}</Badge>
                        {r.reward_eligible && <Badge className="bg-green-100 text-green-800 gap-1"><Award className="w-3 h-3" /> Eligible</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            {leaderboard.length === 0 ? (
              <Card><CardContent className="pt-12 pb-12 text-center"><Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600">No referral activity yet.</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((l, i) => (
                  <Card key={l.email}>
                    <CardContent className="pt-5 pb-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{l.name}</p>
                        <p className="text-xs text-gray-500">{l.email}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{l.total}</p>
                        <p className="text-xs text-gray-500">referrals</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{l.hired}</p>
                        <p className="text-xs text-gray-500">hired</p>
                      </div>
                      {i < 3 && l.hired > 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bonuses */}
          <TabsContent value="bonuses">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">Bonuses are auto-awarded when a referred candidate is marked hired. Approve and pay them here.</p>
              <Select value={bonusFilter} onValueChange={setBonusFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(BONUS_STATUS_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {bonusesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : filteredBonuses.length === 0 ? (
              <Card><CardContent className="pt-12 pb-12 text-center"><DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600">No bonuses yet. They appear automatically when referrals are hired.</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filteredBonuses.map(b => {
                  const cfg = BONUS_STATUS_CONFIG[b.status] || BONUS_STATUS_CONFIG.pending;
                  return (
                    <Card key={b.id}>
                      <CardContent className="pt-5 pb-5">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="p-2 bg-emerald-100 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                          <div className="flex-1 min-w-[200px]">
                            <p className="font-semibold text-gray-900">${b.bonus_amount?.toLocaleString()} {b.currency}</p>
                            <p className="text-sm text-gray-600">{b.referrer_name || b.referrer_email}</p>
                            <p className="text-xs text-gray-500">for referring {b.candidate_name || b.candidate_email} · {b.opportunity_title || ''}</p>
                          </div>
                          <Badge className={`bg-${cfg.color}-100 text-${cfg.color}-800 gap-1`}><cfg.icon className="w-3 h-3" /> {cfg.label}</Badge>
                          <div className="flex gap-2">
                            {b.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => manageMutation.mutate({ bonus_id: b.id, action: 'approve' })} disabled={manageMutation.isPending}>Approve</Button>
                            )}
                            {(b.status === 'pending' || b.status === 'approved') && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => manageMutation.mutate({ bonus_id: b.id, action: 'pay' })} disabled={manageMutation.isPending}>
                                <Banknote className="w-3.5 h-3.5" /> Mark Paid
                              </Button>
                            )}
                            {b.status !== 'cancelled' && b.status !== 'paid' && (
                              <Button size="sm" variant="ghost" onClick={() => manageMutation.mutate({ bonus_id: b.id, action: 'cancel' })} disabled={manageMutation.isPending}><XCircle className="w-3.5 h-3.5" /></Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}