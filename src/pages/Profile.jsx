import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Bookmark, Send, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ExperienceSection from "@/components/profile/ExperienceSection";
import EducationSection from "@/components/profile/EducationSection";
import JobCard from "@/components/jobs/JobCard";

const statusConfig = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700', icon: Clock },
  reviewed: { label: 'Reviewed', color: 'bg-indigo-100 text-indigo-700', icon: FileText },
  interviewing: { label: 'Interviewing', color: 'bg-purple-100 text-purple-700', icon: Send },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Not Selected', color: 'bg-red-100 text-red-700', icon: XCircle },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', user?.email],
    queryFn: () => base44.entities.Application.filter({ applicant_email: user.email }, '-created_date'),
    enabled: !!user
  });

  const { data: savedJobs = [] } = useQuery({
    queryKey: ['savedJobs', user?.email],
    queryFn: () => base44.entities.SavedJob.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    enabled: !!user
  });

  const savedJobsList = savedJobs.map(s => jobs.find(j => j.id === s.job_id)).filter(Boolean);
  const applicationJobs = applications.map(a => ({
    ...a,
    job: jobs.find(j => j.id === a.job_id)
  })).filter(a => a.job);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Card className="max-w-md w-full mx-4 border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your profile</h2>
            <p className="text-gray-500 mb-6">Access your applications, saved jobs, and manage your career profile.</p>
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
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Header */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <ProfileHeader 
            user={user} 
            isOwnProfile={true}
            onEdit={() => window.location.href = createPageUrl('EditProfile')}
          />
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="w-full justify-start bg-white/80 p-1 rounded-xl border border-gray-100">
            <TabsTrigger value="applications" className="gap-2">
              <Send className="w-4 h-4" />
              Applications ({applicationJobs.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Saved ({savedJobsList.length})
            </TabsTrigger>
            <TabsTrigger value="experience" className="gap-2">
              Experience
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-6">
            {applicationJobs.length > 0 ? (
              <div className="space-y-4">
                {applicationJobs.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{app.job.title}</h3>
                            <p className="text-indigo-600">{app.job.company_name}</p>
                            <p className="text-sm text-gray-500 mt-1">{app.job.location}</p>
                          </div>
                          <Badge className={`${statusConfig[app.status]?.color} border-0`}>
                            {statusConfig[app.status]?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                          <span>Applied {new Date(app.created_date).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-12 text-center">
                  <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No applications yet</h3>
                  <p className="text-gray-500 mt-1">Start applying to jobs to track your progress here</p>
                  <Link to={createPageUrl('Home')}>
                    <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                      Browse Jobs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {savedJobsList.length > 0 ? (
              <div className="space-y-4">
                {savedJobsList.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <JobCard job={job} isSaved={true} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-12 text-center">
                  <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No saved jobs</h3>
                  <p className="text-gray-500 mt-1">Save jobs you're interested in to review later</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="experience" className="mt-6 space-y-6">
            <ExperienceSection 
              experience={user.experience} 
              isOwnProfile={true}
              onAdd={() => window.location.href = createPageUrl('EditProfile')}
            />
            <EducationSection 
              education={user.education} 
              isOwnProfile={true}
              onAdd={() => window.location.href = createPageUrl('EditProfile')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}