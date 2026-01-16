import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Users, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import MatchCard from "@/components/matches/MatchCard";

export default function Matches() {
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

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

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['myMatches', user?.email],
    queryFn: () => user ? base44.entities.Match.filter({ talent_email: user.email }, '-created_date') : [],
    enabled: !!user
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list()
  });

  const acceptMatchMutation = useMutation({
    mutationFn: async (match) => {
      const newStatus = match.creator_interested ? 'mutual_interest' : 'talent_interested';
      const chatUnlocked = match.creator_interested;
      
      await base44.entities.Match.update(match.id, {
        talent_interested: true,
        status: newStatus,
        chat_unlocked: chatUnlocked
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myMatches'] })
  });

  const declineMatchMutation = useMutation({
    mutationFn: (match) => base44.entities.Match.update(match.id, { status: 'declined' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myMatches'] })
  });

  const getOpportunity = (opportunityId) => opportunities.find(o => o.id === opportunityId);

  const pendingMatches = matches.filter(m => m.status === 'pending');
  const activeMatches = matches.filter(m => ['talent_interested', 'creator_interested', 'mutual_interest', 'in_trial'].includes(m.status));
  const completedMatches = matches.filter(m => m.status === 'completed');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">View Your Matches</h2>
            <p className="text-gray-500 mb-6">Sign in to see opportunities matched to your skills.</p>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => base44.auth.redirectToLogin()}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Matches</h1>
          <p className="text-gray-500 mt-1">Opportunities matched to your verified skills</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{matches.length}</p>
              <p className="text-sm text-gray-500">Total Matches</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{pendingMatches.length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{activeMatches.length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{completedMatches.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full justify-start bg-white/80 p-1 rounded-xl border border-gray-100">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingMatches.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Active ({activeMatches.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed ({completedMatches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            ) : pendingMatches.length > 0 ? (
              pendingMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MatchCard
                    match={match}
                    opportunity={getOpportunity(match.opportunity_id)}
                    userType="talent"
                    onAccept={acceptMatchMutation.mutate}
                    onDecline={declineMatchMutation.mutate}
                  />
                </motion.div>
              ))
            ) : (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No pending matches</h3>
                  <p className="text-gray-500 mt-1">New matches will appear here when found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6 space-y-4">
            {activeMatches.length > 0 ? (
              activeMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MatchCard
                    match={match}
                    opportunity={getOpportunity(match.opportunity_id)}
                    userType="talent"
                    onChat={() => alert('Chat feature coming soon!')}
                  />
                </motion.div>
              ))
            ) : (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No active matches</h3>
                  <p className="text-gray-500 mt-1">Express interest in pending matches to get started</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6 space-y-4">
            {completedMatches.length > 0 ? (
              completedMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MatchCard
                    match={match}
                    opportunity={getOpportunity(match.opportunity_id)}
                    userType="talent"
                  />
                </motion.div>
              ))
            ) : (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No completed matches</h3>
                  <p className="text-gray-500 mt-1">Completed work will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}