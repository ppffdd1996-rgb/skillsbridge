import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Flag, DollarSign, Activity, Users, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Admin() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
      }
    };
    loadUser();
  }, []);

  const queryClient = useQueryClient();

  const { data: flags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ['flags'],
    queryFn: () => base44.entities.Flag.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['allOpportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['allMatches'],
    queryFn: () => base44.entities.Match.list(),
    enabled: !!user && user.role === 'admin'
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const resolveFlagMutation = useMutation({
    mutationFn: ({ flagId, resolution }) => 
      base44.entities.Flag.update(flagId, {
        status: 'resolved',
        reviewed_by: user.email,
        resolution_notes: resolution
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flags'] })
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Admin access required</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">This page is for administrators only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingFlags = flags.filter(f => f.status === 'pending');
  const activeOpportunities = opportunities.filter(o => o.status === 'active');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform oversight and moderation</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingFlags.length}</p>
                  <p className="text-sm text-gray-500">Pending Flags</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeOpportunities.length}</p>
                  <p className="text-sm text-gray-500">Active Opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedMatches.length}</p>
                  <p className="text-sm text-gray-500">Completed Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                  <p className="text-sm text-gray-500">Total Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="flags" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="flags">
              <Flag className="w-4 h-4 mr-2" />
              Flags ({pendingFlags.length})
            </TabsTrigger>
            <TabsTrigger value="opportunities">
              <Target className="w-4 h-4 mr-2" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flags" className="mt-6 space-y-4">
            {flagsLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : flags.length > 0 ? (
              flags.map(flag => (
                <Card key={flag.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className={
                            flag.status === 'pending' ? 'bg-red-50 text-red-700 border-red-200' :
                            flag.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }>
                            {flag.status}
                          </Badge>
                          <Badge variant="outline">{flag.target_type}</Badge>
                          <Badge variant="outline">{flag.reason}</Badge>
                        </div>
                        <p className="text-gray-700 mb-2">{flag.description}</p>
                        <p className="text-sm text-gray-500">
                          Reported by {flag.reporter_email} • {new Date(flag.created_date).toLocaleDateString()}
                        </p>
                        {flag.resolution_notes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-sm text-green-800">
                              <strong>Resolution:</strong> {flag.resolution_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      {flag.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => resolveFlagMutation.mutate({ 
                              flagId: flag.id, 
                              resolution: 'Investigated and addressed' 
                            })}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-12 text-center">
                  <Flag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No flags</h3>
                  <p className="text-gray-500">All reports have been handled</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="opportunities" className="mt-6 space-y-4">
            {opportunities.map(opp => (
              <Card key={opp.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{opp.title}</h3>
                      <p className="text-gray-600 mb-2">{opp.description}</p>
                      <div className="flex items-center gap-3 text-sm">
                        <Badge variant="outline" className={
                          opp.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50'
                        }>
                          {opp.status}
                        </Badge>
                        <span className="text-gray-500">{opp.compensation_amount}</span>
                        <span className="text-gray-500">by {opp.creator_id}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="payments" className="mt-6 space-y-4">
            {payments.map(payment => (
              <Card key={payment.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        ${(payment.amount / 100).toFixed(2)} {payment.currency}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.payment_type} • {payment.payer_email}
                      </p>
                    </div>
                    <Badge variant="outline" className={
                      payment.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      payment.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }>
                      {payment.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}