import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, Plus, Users, Eye, EyeOff, Edit2, Trash2, 
  MapPin, Clock, MoreVertical, CheckCircle, XCircle
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  active: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  draft: "bg-yellow-100 text-yellow-700"
};

export default function MyJobs() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  const queryClient = useQueryClient();

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

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['myJobs', user?.email],
    queryFn: () => base44.entities.Job.filter({ posted_by: user.email }, '-created_date'),
    enabled: !!user
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['allApplications'],
    queryFn: () => base44.entities.Application.list('-created_date'),
    enabled: !!user
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myJobs'] })
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id) => base44.entities.Job.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myJobs'] })
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Application.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allApplications'] })
  });

  const activeJobs = jobs.filter(j => j.status === 'active');
  const closedJobs = jobs.filter(j => j.status === 'closed');
  const draftJobs = jobs.filter(j => j.status === 'draft');

  const getApplicationsForJob = (jobId) => allApplications.filter(a => a.job_id === jobId);

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Briefcase className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Job Listings</h2>
            <p className="text-gray-500 mb-6">Sign in to view and manage your posted jobs.</p>
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

  const JobListItem = ({ job }) => {
    const applications = getApplicationsForJob(job.id);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 cursor-pointer" onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <Badge className={`${statusColors[job.status]} border-0`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mt-1">{job.company_name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(job.created_date), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-indigo-600">
                    <Users className="w-3.5 h-3.5" />
                    {applications.length} applicants
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {job.status === 'active' ? (
                    <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, data: { status: 'closed' } })}>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Close Listing
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, data: { status: 'active' } })}>
                      <Eye className="w-4 h-4 mr-2" />
                      Reopen Listing
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-red-600" onClick={() => deleteJobMutation.mutate(job.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Expandable Applications Section */}
            <AnimatePresence>
              {selectedJob?.id === job.id && applications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t"
                >
                  <h4 className="font-medium text-gray-900 mb-3">Applicants</h4>
                  <div className="space-y-3">
                    {applications.map(app => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{app.applicant_email}</p>
                          <p className="text-sm text-gray-500">Applied {format(new Date(app.created_date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={
                            app.status === 'applied' ? 'bg-blue-50 text-blue-700' :
                            app.status === 'reviewed' ? 'bg-indigo-50 text-indigo-700' :
                            app.status === 'interviewing' ? 'bg-purple-50 text-purple-700' :
                            app.status === 'offered' ? 'bg-green-50 text-green-700' :
                            app.status === 'rejected' ? 'bg-red-50 text-red-700' :
                            'bg-gray-50 text-gray-700'
                          }>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Update
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateApplicationMutation.mutate({ id: app.id, data: { status: 'reviewed' } })}>
                                Mark as Reviewed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateApplicationMutation.mutate({ id: app.id, data: { status: 'interviewing' } })}>
                                Move to Interviewing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateApplicationMutation.mutate({ id: app.id, data: { status: 'offered' } })}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Send Offer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateApplicationMutation.mutate({ id: app.id, data: { status: 'rejected' } })}>
                                <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Job Listings</h1>
            <p className="text-gray-500 mt-1">{jobs.length} total jobs posted</p>
          </div>
          <Link to={createPageUrl('PostJob')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="w-4 h-4" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{activeJobs.length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {allApplications.filter(a => jobs.some(j => j.id === a.job_id)).length}
              </p>
              <p className="text-sm text-gray-500">Total Applicants</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-600">{closedJobs.length}</p>
              <p className="text-sm text-gray-500">Closed</p>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full justify-start bg-white/80 p-1 rounded-xl border border-gray-100">
            <TabsTrigger value="active">Active ({activeJobs.length})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({closedJobs.length})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({draftJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6 space-y-4">
            {jobsLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            ) : activeJobs.length > 0 ? (
              activeJobs.map(job => <JobListItem key={job.id} job={job} />)
            ) : (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No active jobs</h3>
                  <p className="text-gray-500 mt-1">Start by posting your first job listing</p>
                  <Link to={createPageUrl('PostJob')}>
                    <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                      Post a Job
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="closed" className="mt-6 space-y-4">
            {closedJobs.length > 0 ? (
              closedJobs.map(job => <JobListItem key={job.id} job={job} />)
            ) : (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">No closed jobs</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="draft" className="mt-6 space-y-4">
            {draftJobs.length > 0 ? (
              draftJobs.map(job => <JobListItem key={job.id} job={job} />)
            ) : (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">No draft jobs</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}