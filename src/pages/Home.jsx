import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Zap, Users, TrendingUp, ArrowRight, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OpportunityCard from "@/components/opportunities/OpportunityCard";

export default function Home() {
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

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.filter({ status: 'active' }, '-created_date')
  });

  const { data: myMatches = [] } = useQuery({
    queryKey: ['myMatches', user?.email],
    queryFn: () => user ? base44.entities.Match.filter({ talent_email: user.email }) : [],
    enabled: !!user
  });

  const matchedOpportunityIds = myMatches.map(m => m.opportunity_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-10 -translate-y-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight">
              Skills That
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent"> Matter</span>
            </h1>
            <p className="mt-8 text-xl md:text-2xl text-gray-600 leading-relaxed">
              No resumes. No spam. Just verified skills matched to real opportunities.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl('SkillPassport')}>
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6">
                  Build Your Skill Passport
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl('CreateOpportunity')}>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Post an Opportunity
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid md:grid-cols-3 gap-8"
          >
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Skills</h3>
              <p className="text-gray-600">Proof-based skill validation, not just claims</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Matching</h3>
              <p className="text-gray-600">AI-powered matches based on real capabilities</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trial Tasks</h3>
              <p className="text-gray-600">Get paid to prove your skills before committing</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How SkillsBridge Works</h2>
          <p className="text-gray-600 text-lg">A better way to connect talent with opportunity</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Build Your Passport</h3>
            <p className="text-gray-600">
              Add skills with proof - portfolios, projects, certifications. No resume needed.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Matched</h3>
            <p className="text-gray-600">
              Our system finds opportunities that match your verified skills. No searching required.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect & Work</h3>
            <p className="text-gray-600">
              Express interest, complete trial tasks if offered, and start collaborating.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Opportunities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Opportunities</h2>
            <p className="text-gray-500 mt-1">{opportunities.length} active opportunities</p>
          </div>
          {user && (
            <Link to={createPageUrl('Matches')}>
              <Button variant="outline">
                View My Matches
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : opportunities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.slice(0, 6).map((opp, i) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <OpportunityCard
                  opportunity={opp}
                  onClick={() => window.location.href = createPageUrl('Opportunities')}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/60 rounded-2xl border border-gray-100">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No opportunities yet</h3>
            <p className="text-gray-500 mt-1">Be the first to create one!</p>
          </div>
        )}

        {opportunities.length > 6 && (
          <div className="mt-8 text-center">
            <Link to={createPageUrl('Opportunities')}>
              <Button size="lg" variant="outline">
                View All Opportunities
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="bg-white/80 backdrop-blur-sm border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{opportunities.length}</div>
              <div className="text-gray-600">Active Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-gray-600">Match Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">48hr</div>
              <div className="text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">Zero</div>
              <div className="text-gray-600">Spam Messages</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}