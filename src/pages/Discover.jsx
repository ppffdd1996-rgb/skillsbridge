import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, DollarSign, Clock, MapPin, Sparkles, Target } from "lucide-react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";

export default function Discover() {
  const [user, setUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const { data: matches = [] } = useQuery({
    queryKey: ['discoverMatches', user?.email],
    queryFn: () => user ? base44.entities.Match.filter({ 
      talent_email: user.email,
      status: 'pending'
    }) : [],
    enabled: !!user
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list()
  });

  const acceptMutation = useMutation({
    mutationFn: async (match) => {
      const newStatus = match.creator_interested ? 'mutual_interest' : 'talent_interested';
      await base44.entities.Match.update(match.id, {
        talent_interested: true,
        status: newStatus,
        chat_unlocked: match.creator_interested
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discoverMatches'] });
      setCurrentIndex(prev => prev + 1);
    }
  });

  const declineMutation = useMutation({
    mutationFn: (match) => base44.entities.Match.update(match.id, { status: 'declined' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discoverMatches'] });
      setCurrentIndex(prev => prev + 1);
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Discovering</h2>
            <p className="text-gray-500 mb-6">Sign in to find opportunities matched to your skills</p>
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

  const currentMatch = matches[currentIndex];
  const currentOpportunity = currentMatch ? opportunities.find(o => o.id === currentMatch.opportunity_id) : null;

  const SwipeCard = ({ match, opportunity }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-20, 20]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    const handleDragEnd = (event, info) => {
      if (Math.abs(info.offset.x) > 100) {
        if (info.offset.x > 0) {
          acceptMutation.mutate(match);
        } else {
          declineMutation.mutate(match);
        }
      }
    };

    const matchPercent = Math.round(match.match_score * 100);

    return (
      <motion.div
        className="absolute inset-0"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
      >
        <Card className="h-full border-0 shadow-2xl overflow-hidden bg-white">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Match Score Badge */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <div className="flex flex-col items-center">
                  <Target className="w-5 h-5 text-indigo-600 mb-1" />
                  <span className="text-xl font-bold text-indigo-600">{matchPercent}%</span>
                </div>
              </div>
            </div>

            {/* Header Image/Gradient */}
            <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-20 h-20 text-white/30" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{opportunity.title}</h2>
                <p className="text-gray-600 line-clamp-3">{opportunity.description}</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700 font-medium">{opportunity.compensation_amount}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">{opportunity.effort}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-700 capitalize">{opportunity.location_type}</span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {match.matched_skills?.map(skill => (
                    <Badge key={skill} className="bg-green-50 text-green-700 border-green-200">
                      ✓ {skill}
                    </Badge>
                  ))}
                  {match.missing_skills?.map(skill => (
                    <Badge key={skill} variant="outline" className="text-gray-500">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Trial Task */}
              {opportunity.has_trial_task && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-900">💰 Paid Trial Available</p>
                  <p className="text-sm text-purple-700">{opportunity.trial_task_pay}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Opportunities</h1>
          <p className="text-gray-600">Swipe right to express interest, left to pass</p>
        </div>

        {/* Cards Container */}
        <div className="relative h-[600px] mb-6">
          <AnimatePresence>
            {currentOpportunity ? (
              <SwipeCard 
                key={currentMatch.id} 
                match={currentMatch} 
                opportunity={currentOpportunity} 
              />
            ) : (
              <Card className="h-full border-0 shadow-2xl flex items-center justify-center bg-white">
                <CardContent className="text-center p-8">
                  <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {matches.length === 0 ? "No matches yet" : "You've reviewed all matches!"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {matches.length === 0 
                      ? "Add skills to your passport to get matched"
                      : "Check back later for new opportunities"}
                  </p>
                </CardContent>
              </Card>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        {currentOpportunity && (
          <div className="flex justify-center gap-6">
            <Button
              size="lg"
              variant="outline"
              className="w-16 h-16 rounded-full border-2 border-red-300 hover:bg-red-50 hover:border-red-400"
              onClick={() => declineMutation.mutate(currentMatch)}
              disabled={declineMutation.isPending}
            >
              <X className="w-8 h-8 text-red-500" />
            </Button>
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              onClick={() => acceptMutation.mutate(currentMatch)}
              disabled={acceptMutation.isPending}
            >
              <Heart className="w-8 h-8 text-white" />
            </Button>
          </div>
        )}

        {/* Counter */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {matches.length > 0 && `${currentIndex + 1} / ${matches.length} opportunities`}
        </div>
      </div>
    </div>
  );
}