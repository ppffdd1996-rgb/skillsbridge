import React, { useState } from 'react';
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
import { 
  UserPlus, Users, Trophy, TrendingUp, Mail, CheckCircle2, 
  Clock, XCircle, Award, Loader2, Search, Briefcase
} from 'lucide-react';

const STATUS_CONFIG = {
  invited: { label: 'Invited', color: 'blue', icon: Mail },
  viewed: { label: 'Viewed', color: 'gray', icon: CheckCircle2 },
  applied: { label: 'Applied', color: 'purple', icon: CheckCircle2 },
  interviewing: { label: 'Interviewing', color: 'orange', icon: Clock },
  offered: { label: 'Offered', color: 'yellow', icon: Award },
  hired: { label: 'Hired', color: 'green', icon: Trophy },
  rejected: { label: 'Rejected', color: 'red', icon: XCircle },
  expired: { label: 'Expired', color: 'gray', icon: Clock }
};

export default function ReferralsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_email: '',
    opportunity_id: '',
    referral_message: '',
    relationship: 'colleague'
  });

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities-active'],
    queryFn: () => base44.entities.Opportunity.filter({ status: 'active' })
  });

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user?.email }, '-invited_at'),
    enabled: !!user
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const opp = opportunities.find(o => o.id === data.opportunity_id);
      const response = await base44.functions.invoke('submitReferral', {
        ...data,
        opportunity_title: opp?.title || '',
        company_name: opp?.company_name || '',
        recruiter_email: opp?.creator_id ? '' : ''
      });
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Referral sent successfully!' });
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
      setFormData({ candidate_name: '', candidate_email: '', opportunity_id: '', referral_message: '', relationship: 'colleague' });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Failed to send referral', description: error.message, variant: 'destructive' });
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const stats = {
    total: referrals.length,
    applied: referrals.filter(r => ['applied', 'interviewing', 'offered', 'hired'].includes(r.status)).length,
    hired: referrals.filter(r => r.status === 'hired').length,
    pending: referrals.filter(r => r.status === 'invited' || r.status === 'viewed').length
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = searchQuery === '' ||
      r.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.opportunity_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.candidate_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.candidate_name || !formData.candidate_email || !formData.opportunity_id) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    submitMutation.mutate(formData);
  };

  const statCards = [
    { label: 'Total Referrals', value: stats.total, icon: Users, color: 'indigo' },
    { label: 'In Progress', value: stats.pending, icon: Clock, color: 'blue' },
    { label: 'Applied', value: stats.applied, icon: TrendingUp, color: 'purple' },
    { label: 'Hired', value: stats.hired, icon: Trophy, color: 'green' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
            <p className="text-gray-600 mt-1">Recommend peers for open roles and track their progress</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <UserPlus className="w-4 h-4" />
                New Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Refer a Candidate</DialogTitle>
                <DialogDescription>Recommend someone you know for an open opportunity</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Candidate Name *</Label>
                    <Input value={formData.candidate_name} onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Candidate Email *</Label>
                    <Input type="email" value={formData.candidate_email} onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label>Opportunity *</Label>
                  <Select value={formData.opportunity_id} onValueChange={(v) => setFormData({ ...formData, opportunity_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select an open role" /></SelectTrigger>
                    <SelectContent>
                      {opportunities.map(opp => (
                        <SelectItem key={opp.id} value={opp.id}>
                          {opp.title} {opp.company_name ? `· ${opp.company_name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>How do you know them?</Label>
                  <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="classmate">Classmate</SelectItem>
                      <SelectItem value="former_coworker">Former Coworker</SelectItem>
                      <SelectItem value="mentor">Mentor/Mentee</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Personal Message (optional)</Label>
                  <Textarea
                    value={formData.referral_message}
                    onChange={(e) => setFormData({ ...formData, referral_message: e.target.value })}
                    placeholder="Add a note about why you're recommending them..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send Referral
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => (
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

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search referrals..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Referral List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : filteredReferrals.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                {referrals.length === 0 ? "You haven't made any referrals yet" : "No referrals match your filters"}
              </p>
              {referrals.length === 0 && (
                <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  Make Your First Referral
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReferrals.map(referral => {
              const StatusIcon = STATUS_CONFIG[referral.status]?.icon || Clock;
              return (
                <Card key={referral.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 bg-${STATUS_CONFIG[referral.status]?.color}-100 rounded-lg flex-shrink-0`}>
                        <StatusIcon className={`w-5 h-5 text-${STATUS_CONFIG[referral.status]?.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900">{referral.candidate_name}</h3>
                          <Badge className={`bg-${STATUS_CONFIG[referral.status]?.color}-100 text-${STATUS_CONFIG[referral.status]?.color}-800`}>
                            {STATUS_CONFIG[referral.status]?.label}
                          </Badge>
                          {referral.status === 'hired' && (
                            <Badge className="bg-green-100 text-green-800 gap-1">
                              <Award className="w-3 h-3" /> Reward Eligible
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{referral.opportunity_title || 'Unknown role'}</span>
                          {referral.company_name && <span>· {referral.company_name}</span>}
                        </div>
                        {referral.referral_message && (
                          <p className="text-sm text-gray-500 italic mt-2 line-clamp-2">"{referral.referral_message}"</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-3">
                          <span>Referred: {new Date(referral.invited_at).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>{referral.relationship}</span>
                          {referral.applied_at && (
                            <>
                              <span>·</span>
                              <span>Applied: {new Date(referral.applied_at).toLocaleDateString()}</span>
                            </>
                          )}
                          {referral.hired_at && (
                            <>
                              <span>·</span>
                              <span className="text-green-600 font-medium">Hired: {new Date(referral.hired_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}