import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Briefcase, MapPin, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import JobCard from "@/components/jobs/JobCard";
import JobFilters from "@/components/jobs/JobFilters";
import JobDetailModal from "@/components/jobs/JobDetailModal";

export default function Home() {
  const [user, setUser] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: 'all',
    remoteType: 'all',
    experienceLevel: 'all'
  });

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

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.filter({ status: 'active' }, '-created_date')
  });

  const { data: savedJobs = [] } = useQuery({
    queryKey: ['savedJobs', user?.email],
    queryFn: () => user ? base44.entities.SavedJob.filter({ user_email: user.email }) : [],
    enabled: !!user
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', user?.email],
    queryFn: () => user ? base44.entities.Application.filter({ applicant_email: user.email }) : [],
    enabled: !!user
  });

  const savedJobIds = savedJobs.map(s => s.job_id);
  const appliedJobIds = applications.map(a => a.job_id);

  const saveJobMutation = useMutation({
    mutationFn: async (job) => {
      const existing = savedJobs.find(s => s.job_id === job.id);
      if (existing) {
        await base44.entities.SavedJob.delete(existing.id);
      } else {
        await base44.entities.SavedJob.create({ job_id: job.id, user_email: user.email });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedJobs'] })
  });

  const applyMutation = useMutation({
    mutationFn: async ({ job, coverLetter }) => {
      await base44.entities.Application.create({
        job_id: job.id,
        applicant_email: user.email,
        cover_letter: coverLetter,
        resume_url: user.resume_url
      });
      await base44.entities.Job.update(job.id, { 
        applicants_count: (job.applicants_count || 0) + 1 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSelectedJob(null);
    }
  });

  const filteredJobs = jobs.filter(job => {
    const searchMatch = !filters.search || 
      job.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.skills?.some(s => s.toLowerCase().includes(filters.search.toLowerCase()));
    
    const locationMatch = !filters.location ||
      job.location?.toLowerCase().includes(filters.location.toLowerCase());
    
    const jobTypeMatch = filters.jobType === 'all' || job.job_type === filters.jobType;
    const remoteMatch = filters.remoteType === 'all' || job.remote_type === filters.remoteType;
    const expMatch = filters.experienceLevel === 'all' || job.experience_level === filters.experienceLevel;

    return searchMatch && locationMatch && jobTypeMatch && remoteMatch && expMatch;
  });

  const featuredJobs = jobs.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-10 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400 rounded-full blur-3xl opacity-10 translate-y-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">
              Find Your Next
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent"> Dream Role</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              Connect with innovative companies and discover opportunities that match your skills and ambitions.
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 max-w-4xl mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-200/50 p-4 md:p-6 border border-gray-100">
              <JobFilters 
                filters={filters}
                setFilters={setFilters}
                showAdvanced={showAdvancedFilters}
                setShowAdvanced={setShowAdvancedFilters}
              />
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap justify-center gap-6 md:gap-12"
          >
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-gray-900">{jobs.length}</span>
              <span>Active Jobs</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gray-900">2.5k+</span>
              <span>Companies</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-gray-900">48hr</span>
              <span>Avg Response</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Latest Opportunities</h2>
            <p className="text-gray-500 mt-1">{filteredJobs.length} jobs found</p>
          </div>
          <Tabs defaultValue="all" className="hidden md:block">
            <TabsList className="bg-gray-100/80">
              <TabsTrigger value="all">All Jobs</TabsTrigger>
              <TabsTrigger value="remote">Remote</TabsTrigger>
              <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {jobsLoading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-4">
            {filteredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <JobCard
                  job={job}
                  onClick={() => setSelectedJob(job)}
                  onSave={(j) => user ? saveJobMutation.mutate(j) : base44.auth.redirectToLogin()}
                  isSaved={savedJobIds.includes(job.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/60 rounded-2xl border border-gray-100">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No jobs found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search filters</p>
          </div>
        )}
      </section>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={(job, coverLetter) => {
          if (!user) {
            base44.auth.redirectToLogin();
            return;
          }
          applyMutation.mutate({ job, coverLetter });
        }}
        onSave={(j) => user ? saveJobMutation.mutate(j) : base44.auth.redirectToLogin()}
        isSaved={selectedJob ? savedJobIds.includes(selectedJob.id) : false}
        hasApplied={selectedJob ? appliedJobIds.includes(selectedJob.id) : false}
      />
    </div>
  );
}