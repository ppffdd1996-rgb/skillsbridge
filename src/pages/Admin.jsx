import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Users, Target, Flag, Mail, 
  UserPlus, Briefcase, CheckCircle, XCircle,
  TrendingUp, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import EmployerGeneratorChat from "@/components/admin/EmployerGeneratorChat";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newEmployerEmail, setNewEmployerEmail] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const u = await base44.auth.me();
      if (u.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(u);
      setLoading(false);
    };
    loadUser();
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['allOpportunities'],
    queryFn: () => base44.entities.Opportunity.list(),
    enabled: !!user
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['allMatches'],
    queryFn: () => base44.entities.Match.list(),
    enabled: !!user
  });

  const { data: flags = [] } = useQuery({
    queryKey: ['allFlags'],
    queryFn: () => base44.entities.Flag.list(),
    enabled: !!user
  });

  const inviteEmployerMutation = useMutation({
    mutationFn: async (email) => {
      await base44.users.inviteUser(email, "user");
    },
    onSuccess: () => {
      toast.success("Employer invited successfully!");
      setNewEmployerEmail('');
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to invite employer");
    }
  });

  const createTestEmployers = async () => {
    const testEmployers = [
      'employer1@techstartup.com',
      'employer2@creativeco.com',
      'employer3@enterprise.com',
      'employer4@agency.com',
      'employer5@consulting.com'
    ];

    for (const email of testEmployers) {
      try {
        await base44.users.inviteUser(email, "user");
      } catch (error) {
        console.log(`Skipping ${email}:`, error.message);
      }
    }
    
    toast.success("Test employers invited! They'll receive email invitations.");
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
  };

  const resolveFlagMutation = useMutation({
    mutationFn: ({ flagId, status, notes }) => 
      base44.entities.Flag.update(flagId, {
        status,
        reviewed_by: user.email,
        resolution_notes: notes
      }),
    onSuccess: () => {
      toast.success("Flag resolved");
      queryClient.invalidateQueries({ queryKey: ['allFlags'] });
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stats = {
    totalUsers: allUsers.length,
    totalOpportunities: opportunities.length,
    activeMatches: matches.filter(m => m.status === 'mutual_interest').length,
    pendingFlags: flags.filter(f => f.status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Platform management and overview</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Opportunities</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOpportunities}</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Matches</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeMatches}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Flags</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingFlags}</p>
                </div>
                <Flag className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="employers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="employers">
              <Briefcase className="w-4 h-4 mr-2" />
              Employers
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="opportunities">
              <Target className="w-4 h-4 mr-2" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="flags">
              <Flag className="w-4 h-4 mr-2" />
              Flags
            </TabsTrigger>
          </TabsList>

          {/* Employers Tab */}
          <TabsContent value="employers">
            <Card>
              <CardHeader>
                <CardTitle>Employer Management</CardTitle>
                <CardDescription>Invite and manage employer accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Create Test Employers */}
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <h3 className="font-semibold text-indigo-900 mb-2">Quick Setup</h3>
                  <p className="text-sm text-indigo-700 mb-3">
                    Create 5 test employer accounts instantly for testing
                  </p>
                  <Button 
                    onClick={createTestEmployers}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Test Employers
                  </Button>
                </div>

                {/* AI Employer Generator */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">AI Employer Generator</h3>
                  <p className="text-sm text-purple-700 mb-3">
                    Use AI to generate realistic employer profiles with opportunities
                  </p>
                  <EmployerGeneratorChat />
                </div>

                {/* Manual Invite */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Invite Individual Employer</h3>
                  <div className="flex gap-3">
                    <Input
                      type="email"
                      placeholder="employer@company.com"
                      value={newEmployerEmail}
                      onChange={(e) => setNewEmployerEmail(e.target.value)}
                    />
                    <Button 
                      onClick={() => inviteEmployerMutation.mutate(newEmployerEmail)}
                      disabled={!newEmployerEmail || inviteEmployerMutation.isPending}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                </div>

                {/* Employers List */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">All Users</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name || user.email}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                          {user.verified_talent && (
                            <Badge className="bg-green-100 text-green-700">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allUsers.map(user => (
                    <div key={user.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{user.full_name || 'No name'}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Joined: {new Date(user.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Opportunities Overview</CardTitle>
                <CardDescription>All posted opportunities on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {opportunities.map(opp => (
                    <div key={opp.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                        <Badge variant={opp.status === 'active' ? 'default' : 'secondary'}>
                          {opp.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{opp.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>By: {opp.creator_id}</span>
                        <span>•</span>
                        <span>{opp.effort}</span>
                        <span>•</span>
                        <span>{opp.compensation_amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flags Tab */}
          <TabsContent value="flags">
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>Review and resolve flagged content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {flags.filter(f => f.status === 'pending').map(flag => (
                    <div key={flag.id} className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {flag.target_type}: {flag.target_id}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Reason: {flag.reason}
                          </p>
                          {flag.description && (
                            <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Reported by: {flag.reporter_email}
                          </p>
                        </div>
                        <Badge variant="destructive">{flag.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveFlagMutation.mutate({
                            flagId: flag.id,
                            status: 'resolved',
                            notes: 'Content removed'
                          })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveFlagMutation.mutate({
                            flagId: flag.id,
                            status: 'dismissed',
                            notes: 'No action needed'
                          })}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                  {flags.filter(f => f.status === 'pending').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No pending flags</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}