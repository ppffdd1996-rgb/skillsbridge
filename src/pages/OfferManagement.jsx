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
  FileText, Send, CheckCircle2, XCircle, Clock, TrendingUp,
  Loader2, Plus, Award, Percent, Users, Briefcase, Mail
} from 'lucide-react';

const SIGNATURE_CONFIG = {
  pending: { label: 'Pending', color: 'gray', icon: Clock },
  sent: { label: 'Sent', color: 'blue', icon: Send },
  signed: { label: 'Accepted', color: 'green', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'red', icon: XCircle }
};

export default function OfferManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    candidate_email: '',
    candidate_name: '',
    opportunity_id: '',
    job_title: '',
    start_date: '',
    salary: '',
    benefits: '',
    send_now: true
  });

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: myOpportunities = [] } = useQuery({
    queryKey: ['myOpportunities'],
    queryFn: () => base44.entities.Opportunity.filter({ creator_id: user?.email }),
    enabled: !!user
  });

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['my-offers'],
    queryFn: () => base44.entities.OfferLetter.filter({ recruiter_email: user?.email }, '-created_date'),
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('manageOffer', { action: 'create', ...data }).then(r => r.data),
    onSuccess: (_, vars) => {
      toast({ title: vars.send_now ? 'Offer generated and sent!' : 'Offer letter created!' });
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
      setDialogOpen(false);
      setFormData({ candidate_email: '', candidate_name: '', opportunity_id: '', job_title: '', start_date: '', salary: '', benefits: '', send_now: true });
    },
    onError: (e) => toast({ title: 'Failed to create offer', description: e.message, variant: 'destructive' })
  });

  const statusMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('manageOffer', { action: 'update_status', ...payload }).then(r => r.data),
    onSuccess: (_, vars) => {
      toast({ title: `Offer marked ${SIGNATURE_CONFIG[vars.signature_status]?.label}` });
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
    },
    onError: (e) => toast({ title: 'Failed to update offer', description: e.message, variant: 'destructive' })
  });

  // Hooks must run before any early return
  const stats = useMemo(() => {
    const sent = offers.filter(o => ['sent', 'signed', 'declined'].includes(o.signature_status)).length;
    const accepted = offers.filter(o => o.signature_status === 'signed').length;
    const declined = offers.filter(o => o.signature_status === 'declined').length;
    const pending = offers.filter(o => o.signature_status === 'pending').length;
    const acceptanceRate = sent > 0 ? Math.round((accepted / sent) * 100) : 0;
    return { total: offers.length, sent, accepted, declined, pending, acceptanceRate };
  }, [offers]);

  const filteredOffers = useMemo(() => {
    return statusFilter === 'all' ? offers : offers.filter(o => o.signature_status === statusFilter);
  }, [offers, statusFilter]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.candidate_email || !formData.candidate_name || !formData.job_title || !formData.start_date) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const statCards = [
    { label: 'Total Offers', value: stats.total, icon: FileText, color: 'indigo' },
    { label: 'Sent', value: stats.sent, icon: Send, color: 'blue' },
    { label: 'Accepted', value: stats.accepted, icon: Award, color: 'green' },
    { label: 'Acceptance Rate', value: `${stats.acceptanceRate}%`, icon: Percent, color: 'emerald' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Offer Management</h1>
            <p className="text-gray-600 mt-1">Track offer letters, acceptance statuses, and hiring outcomes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Plus className="w-4 h-4" /> Create Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Offer Letter</DialogTitle>
                <DialogDescription>Generate and send an offer letter to a candidate</DialogDescription>
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
                  <Label>Job / Opportunity</Label>
                  <Select value={formData.opportunity_id} onValueChange={(v) => {
                    const opp = myOpportunities.find(o => o.id === v);
                    setFormData({ ...formData, opportunity_id: v, job_title: opp?.title || formData.job_title });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Link to an opportunity (optional)" /></SelectTrigger>
                    <SelectContent>
                      {myOpportunities.map(opp => <SelectItem key={opp.id} value={opp.id}>{opp.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title *</Label>
                    <Input value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Start Date *</Label>
                    <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Salary</Label>
                    <Input value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} placeholder="$90,000" />
                  </div>
                  <div>
                    <Label>Benefits</Label>
                    <Input value={formData.benefits} onChange={(e) => setFormData({ ...formData, benefits: e.target.value })} placeholder="Health, PTO, 401k" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="send_now" checked={formData.send_now} onChange={(e) => setFormData({ ...formData, send_now: e.target.checked })} className="rounded" />
                  <Label htmlFor="send_now" className="text-sm font-normal cursor-pointer">Send offer email to candidate immediately</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Generate Offer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Metrics */}
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

        {/* Hiring funnel summary */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-600" /> Hiring Funnel</h3>
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <Badge className="bg-indigo-100 text-indigo-800">{stats.total} Created</Badge>
              <span className="text-gray-400">→</span>
              <Badge className="bg-blue-100 text-blue-800">{stats.sent} Sent</Badge>
              <span className="text-gray-400">→</span>
              <Badge className="bg-green-100 text-green-800">{stats.accepted} Accepted</Badge>
              <span className="text-gray-400">→</span>
              <Badge className="bg-red-100 text-red-800">{stats.declined} Declined</Badge>
              <span className="text-gray-400">→</span>
              <Badge className="bg-gray-100 text-gray-800">{stats.pending} Pending</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Filter + Offer list */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Offer Letters</h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(SIGNATURE_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : filteredOffers.length === 0 ? (
          <Card><CardContent className="pt-12 pb-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">{offers.length === 0 ? 'No offer letters yet' : 'No offers match this filter'}</p>
            {offers.length === 0 && <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">Create First Offer</Button>}
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredOffers.map(offer => {
              const cfg = SIGNATURE_CONFIG[offer.signature_status] || SIGNATURE_CONFIG.pending;
              return (
                <Card key={offer.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-3 bg-${cfg.color}-100 rounded-lg flex-shrink-0`}>
                          <cfg.icon className={`w-5 h-5 text-${cfg.color}-600`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900">{offer.candidate_name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" /> {offer.job_title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 flex-wrap">
                            <span><Mail className="w-3 h-3 inline mr-1" />{offer.candidate_email}</span>
                            {offer.salary && <span>· {offer.salary}</span>}
                            {offer.start_date && <span>· Starts {new Date(offer.start_date).toLocaleDateString()}</span>}
                          </div>
                          {offer.sent_at && (
                            <p className="text-xs text-gray-400 mt-1">Sent: {new Date(offer.sent_at).toLocaleDateString()}</p>
                          )}
                          {offer.signed_at && (
                            <p className="text-xs text-green-600 font-medium mt-1">Accepted: {new Date(offer.signed_at).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`bg-${cfg.color}-100 text-${cfg.color}-800`}>{cfg.label}</Badge>
                        <div className="flex gap-2">
                          {offer.signature_status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ offer_id: offer.id, signature_status: 'sent' })}>Mark Sent</Button>
                          )}
                          {(offer.signature_status === 'sent' || offer.signature_status === 'pending') && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => statusMutation.mutate({ offer_id: offer.id, signature_status: 'signed' })}>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 gap-1" onClick={() => statusMutation.mutate({ offer_id: offer.id, signature_status: 'declined' })}>
                                <XCircle className="w-3.5 h-3.5" /> Decline
                              </Button>
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