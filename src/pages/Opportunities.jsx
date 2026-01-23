import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, SlidersHorizontal, X, Target, Clock, DollarSign,
  MapPin, Filter, ArrowUpDown, TrendingUp, Sparkles, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OpportunityCard from "@/components/opportunities/OpportunityCard";

export default function Opportunities() {
  const [user, setUser] = useState(null);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  
  const [filters, setFilters] = useState({
    search: '',
    skills: [],
    compensationType: 'all',
    minCompensation: '',
    maxCompensation: '',
    effort: 'all',
    locationType: 'all',
    hasTrialTask: 'all',
    matchThreshold: [0, 100]
  });

  const [skillInput, setSkillInput] = useState('');

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

  const { data: mySkills = [] } = useQuery({
    queryKey: ['mySkills', user?.email],
    queryFn: () => user ? base44.entities.Skill.filter({ user_email: user.email }) : [],
    enabled: !!user
  });

  const expressInterestMutation = useMutation({
    mutationFn: async (opportunity) => {
      // Calculate match score
      const mySkillNames = mySkills.map(s => s.name.toLowerCase());
      const requiredSkills = opportunity.skills_required.map(s => s.toLowerCase());
      const matchedSkills = requiredSkills.filter(s => mySkillNames.includes(s));
      const missingSkills = requiredSkills.filter(s => !mySkillNames.includes(s));
      const matchScore = matchedSkills.length / requiredSkills.length;

      // Check if match exists
      const existing = myMatches.find(m => m.opportunity_id === opportunity.id);
      if (existing) {
        await base44.entities.Match.update(existing.id, { 
          talent_interested: true,
          status: 'talent_interested'
        });
      } else {
        await base44.entities.Match.create({
          talent_email: user.email,
          opportunity_id: opportunity.id,
          match_score: matchScore,
          matched_skills: matchedSkills,
          missing_skills: missingSkills,
          status: 'talent_interested',
          talent_interested: true,
          creator_interested: false,
          chat_unlocked: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMatches'] });
      setSelectedOpp(null);
    }
  });

  const handleAddSkillFilter = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      setFilters(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkillFilter = (skill) => {
    setFilters(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      skills: [],
      compensationType: 'all',
      minCompensation: '',
      maxCompensation: '',
      effort: 'all',
      locationType: 'all',
      hasTrialTask: 'all',
      matchThreshold: [0, 100]
    });
  };

  // Filter opportunities
  const filteredOpportunities = opportunities.filter(opp => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        opp.title?.toLowerCase().includes(searchLower) ||
        opp.description?.toLowerCase().includes(searchLower) ||
        opp.skills_required?.some(s => s.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Skills filter
    if (filters.skills.length > 0) {
      const oppSkillsLower = opp.skills_required?.map(s => s.toLowerCase()) || [];
      const hasAllSkills = filters.skills.every(skill => 
        oppSkillsLower.some(os => os.includes(skill.toLowerCase()))
      );
      if (!hasAllSkills) return false;
    }

    // Compensation type
    if (filters.compensationType !== 'all' && opp.compensation_type !== filters.compensationType) {
      return false;
    }

    // Compensation range (extract numbers from compensation_amount string)
    if (filters.minCompensation || filters.maxCompensation) {
      const numMatch = opp.compensation_amount?.match(/\d+/);
      if (numMatch) {
        const amount = parseInt(numMatch[0]);
        if (filters.minCompensation && amount < parseInt(filters.minCompensation)) return false;
        if (filters.maxCompensation && amount > parseInt(filters.maxCompensation)) return false;
      }
    }

    // Effort filter
    if (filters.effort !== 'all') {
      const effortLower = opp.effort?.toLowerCase() || '';
      if (filters.effort === 'low' && !effortLower.includes('1') && !effortLower.includes('2')) return false;
      if (filters.effort === 'medium' && !effortLower.includes('3') && !effortLower.includes('4') && !effortLower.includes('5')) return false;
      if (filters.effort === 'high' && !effortLower.includes('6') && !effortLower.includes('8') && !effortLower.includes('10')) return false;
    }

    // Location type
    if (filters.locationType !== 'all' && opp.location_type !== filters.locationType) {
      return false;
    }

    // Trial task
    if (filters.hasTrialTask === 'yes' && !opp.has_trial_task) return false;
    if (filters.hasTrialTask === 'no' && opp.has_trial_task) return false;

    // Match threshold
    const threshold = (opp.match_threshold || 0.7) * 100;
    if (threshold < filters.matchThreshold[0] || threshold > filters.matchThreshold[1]) {
      return false;
    }

    return true;
  });

  // Sort opportunities - boosted items appear first
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    // First, prioritize boosted opportunities
    const aBoost = a.boosted_until && new Date(a.boosted_until) > new Date();
    const bBoost = b.boosted_until && new Date(b.boosted_until) > new Date();
    
    if (aBoost && !bBoost) return -1;
    if (!aBoost && bBoost) return 1;
    
    // Then apply the selected sort
    if (sortBy === 'newest') return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
    if (sortBy === 'compensation') {
      const aNum = parseInt(a.compensation_amount?.match(/\d+/)?.[0] || 0);
      const bNum = parseInt(b.compensation_amount?.match(/\d+/)?.[0] || 0);
      return bNum - aNum;
    }
    if (sortBy === 'match') {
      return (b.match_threshold || 0.7) - (a.match_threshold || 0.7);
    }
    return 0;
  });

  const activeFilterCount = 
    (filters.search ? 1 : 0) +
    filters.skills.length +
    (filters.compensationType !== 'all' ? 1 : 0) +
    (filters.minCompensation || filters.maxCompensation ? 1 : 0) +
    (filters.effort !== 'all' ? 1 : 0) +
    (filters.locationType !== 'all' ? 1 : 0) +
    (filters.hasTrialTask !== 'all' ? 1 : 0) +
    (filters.matchThreshold[0] !== 0 || filters.matchThreshold[1] !== 100 ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Explore Opportunities</h1>
            <p className="text-gray-500 mt-1">
              {sortedOpportunities.length} of {opportunities.length} opportunities match your criteria
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 bg-white">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="compensation">Highest Pay</SelectItem>
                <SelectItem value="match">Best Match</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {/* Main Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by title, description, or skills..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-12 h-12 text-base bg-white border-gray-200"
              />
            </div>
            <Button 
              variant="outline"
              className="h-12 gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="bg-indigo-600 text-white border-0 ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              
              {filters.skills.map(skill => (
                <Badge key={skill} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1 pr-1">
                  {skill}
                  <button onClick={() => removeSkillFilter(skill)} className="ml-1 hover:bg-indigo-200 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              
              {filters.compensationType !== 'all' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 pr-1">
                  {filters.compensationType}
                  <button onClick={() => setFilters(prev => ({ ...prev, compensationType: 'all' }))} className="ml-1 hover:bg-green-200 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.locationType !== 'all' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 pr-1">
                  {filters.locationType}
                  <button onClick={() => setFilters(prev => ({ ...prev, locationType: 'all' }))} className="ml-1 hover:bg-blue-200 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.hasTrialTask !== 'all' && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1 pr-1">
                  Trial task: {filters.hasTrialTask}
                  <button onClick={() => setFilters(prev => ({ ...prev, hasTrialTask: 'all' }))} className="ml-1 hover:bg-purple-200 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-700">
                Clear all
              </Button>
            </div>
          )}

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-gray-100"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Skills Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Skills
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add skill..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkillFilter()}
                      />
                      <Button variant="outline" onClick={handleAddSkillFilter}>
                        <Target className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Compensation Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compensation Type
                    </label>
                    <Select value={filters.compensationType} onValueChange={(v) => setFilters(prev => ({ ...prev, compensationType: v }))}>
                      <SelectTrigger className="bg-white">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Compensation Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compensation Range ($/hr)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minCompensation}
                        onChange={(e) => setFilters(prev => ({ ...prev, minCompensation: e.target.value }))}
                        className="bg-white"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxCompensation}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxCompensation: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  {/* Effort Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Commitment
                    </label>
                    <Select value={filters.effort} onValueChange={(v) => setFilters(prev => ({ ...prev, effort: v }))}>
                      <SelectTrigger className="bg-white">
                        <Clock className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Hours</SelectItem>
                        <SelectItem value="low">Low (1-2 hrs/week)</SelectItem>
                        <SelectItem value="medium">Medium (3-5 hrs/week)</SelectItem>
                        <SelectItem value="high">High (6+ hrs/week)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Location
                    </label>
                    <Select value={filters.locationType} onValueChange={(v) => setFilters(prev => ({ ...prev, locationType: v }))}>
                      <SelectTrigger className="bg-white">
                        <MapPin className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Location</SelectItem>
                        <SelectItem value="remote">Remote Only</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="on-site">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Trial Task */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trial Task
                    </label>
                    <Select value={filters.hasTrialTask} onValueChange={(v) => setFilters(prev => ({ ...prev, hasTrialTask: v }))}>
                      <SelectTrigger className="bg-white">
                        <Target className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="yes">Has Trial Task</SelectItem>
                        <SelectItem value="no">No Trial Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Match Threshold */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Match Threshold: {filters.matchThreshold[0]}% - {filters.matchThreshold[1]}%
                    </label>
                    <Slider
                      value={filters.matchThreshold}
                      onValueChange={(v) => setFilters(prev => ({ ...prev, matchThreshold: v }))}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Opportunities Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : sortedOpportunities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedOpportunities.map((opp, i) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <OpportunityCard
                  opportunity={opp}
                  onClick={() => setSelectedOpp(opp)}
                  onExpress={user ? (o) => expressInterestMutation.mutate(o) : () => base44.auth.redirectToLogin()}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/60 rounded-2xl border border-gray-100">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No opportunities found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Opportunity Detail Modal */}
      <Dialog open={!!selectedOpp} onOpenChange={() => setSelectedOpp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOpp && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedOpp.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Meta Info */}
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedOpp.effort}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {selectedOpp.compensation_amount}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <MapPin className="w-3 h-3 mr-1" />
                    {selectedOpp.location_type}
                  </Badge>
                  {selectedOpp.has_trial_task && (
                    <Badge className="bg-purple-100 text-purple-700 border-0">
                      <Target className="w-3 h-3 mr-1" />
                      Paid Trial
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About This Opportunity</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedOpp.description}</p>
                </div>

                {/* Required Skills */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOpp.skills_required?.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Trial Task */}
                {selectedOpp.has_trial_task && (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900 mb-1">Paid Trial Task</h4>
                        <p className="text-sm text-purple-700 mb-2">{selectedOpp.trial_task_description}</p>
                        <p className="text-sm font-medium text-purple-900">
                          Payment: {selectedOpp.trial_task_pay}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Completion Path */}
                {selectedOpp.path?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Path to Success</h3>
                    <div className="flex items-center gap-2">
                      {selectedOpp.path.map((step, i) => (
                        <React.Fragment key={i}>
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 capitalize">
                              {step.replace('_', ' ')}
                            </span>
                          </div>
                          {i < selectedOpp.path.length - 1 && (
                            <div className="w-4 h-0.5 bg-gray-200" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action */}
                {user ? (
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => expressInterestMutation.mutate(selectedOpp)}
                    disabled={expressInterestMutation.isLoading}
                  >
                    {expressInterestMutation.isLoading ? 'Submitting...' : 'Express Interest'}
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => base44.auth.redirectToLogin()}
                  >
                    Sign In to Express Interest
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}