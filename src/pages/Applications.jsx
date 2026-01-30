import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Briefcase, TrendingUp, Clock, CheckCircle, XCircle, 
  UserCheck, FileText, Loader2, Sparkles, AlertCircle,
  Calendar, ExternalLink, Award, MessageSquare, Shield, Mail
} from "lucide-react";
import { toast } from "sonner";
import InterviewAssistant from "@/components/applications/InterviewAssistant";
import SkillValidation from "@/components/applications/SkillValidation";
import MessageComposer from "@/components/communication/MessageComposer";
import InterviewScheduler from "@/components/scheduling/InterviewScheduler";
import RecruiterNotes from "@/components/collaboration/RecruiterNotes";
import TeamChat from "@/components/collaboration/TeamChat";

const STATUS_CONFIG = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800', icon: FileText },
  screening: { label: 'Screening', color: 'bg-purple-100 text-purple-800', icon: Sparkles },
  interviewing: { label: 'Interviewing', color: 'bg-yellow-100 text-yellow-800', icon: UserCheck },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  hired: { label: 'Hired', color: 'bg-emerald-100 text-emerald-800', icon: Award }
};

export default function ApplicationsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [interviewAssistantOpen, setInterviewAssistantOpen] = useState(null);
  const [skillValidationOpen, setSkillValidationOpen] = useState(null);
  const [messageComposerOpen, setMessageComposerOpen] = useState(null);
  const [selectedAppsForMessage, setSelectedAppsForMessage] = useState([]);
  const [schedulerOpen, setSchedulerOpen] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const u = await base44.auth.me();
      setUser(u);
      setLoading(false);
    };
    loadUser();
  }, []);

  const { data: myOpportunities = [] } = useQuery({
    queryKey: ['myOpportunities'],
    queryFn: () => base44.entities.Opportunity.filter({ creator_id: user?.email }),
    enabled: !!user
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const opportunityIds = myOpportunities.map(o => o.id);
      if (opportunityIds.length === 0) return [];
      
      const allApps = await base44.entities.Application.list();
      return allApps.filter(app => opportunityIds.includes(app.opportunity_id));
    },
    enabled: myOpportunities.length > 0
  });

  const screenMutation = useMutation({
    mutationFn: async (applicationId) => {
      return await base44.functions.invoke('screenApplication', { application_id: applicationId });
    },
    onSuccess: () => {
      toast.success('Application screened successfully!');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: () => {
      toast.error('Failed to screen application');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status, notes }) => {
      return await base44.entities.Application.update(applicationId, {
        status,
        recruiter_notes: notes
      });
    },
    onSuccess: () => {
      toast.success('Status updated!');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedApplication(null);
    }
  });

  const getOpportunityTitle = (oppId) => {
    const opp = myOpportunities.find(o => o.id === oppId);
    return opp?.title || 'Unknown';
  };

  const sortedApplications = [...applications].sort((a, b) => {
    if (!a.match_score && !b.match_score) return 0;
    if (!a.match_score) return 1;
    if (!b.match_score) return -1;
    return b.match_score - a.match_score;
  });

  const filterByStatus = (status) => {
    return sortedApplications.filter(app => app.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const stats = {
    total: applications.length,
    applied: filterByStatus('applied').length,
    screening: filterByStatus('screening').length,
    interviewing: filterByStatus('interviewing').length,
    offered: filterByStatus('offered').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Tracking</h1>
          <p className="text-gray-600">AI-powered candidate screening and management</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.applied}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Screening</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.screening}</p>
                </div>
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Interviewing</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.interviewing}</p>
                </div>
                <UserCheck className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Offered</p>
                  <p className="text-2xl font-bold text-green-600">{stats.offered}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="applied">New ({stats.applied})</TabsTrigger>
            <TabsTrigger value="screening">Screening ({stats.screening})</TabsTrigger>
            <TabsTrigger value="interviewing">Interviewing ({stats.interviewing})</TabsTrigger>
            <TabsTrigger value="offered">Offered ({stats.offered})</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            onClick={() => {
              if (sortedApplications.length === 0) {
                toast.error('No applications to message');
                return;
              }
              setSelectedAppsForMessage(sortedApplications);
              setMessageComposerOpen(myOpportunities[0] || { id: 'general', title: 'General' });
            }}
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            Message All ({sortedApplications.length})
          </Button>
          </div>

          {['all', 'applied', 'screening', 'interviewing', 'offered'].map(status => (
            <TabsContent key={status} value={status}>
              <div className="space-y-4">
                {(status === 'all' ? sortedApplications : filterByStatus(status)).map(app => {
                  const StatusIcon = STATUS_CONFIG[app.status].icon;
                  return (
                    <Card key={app.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {app.applicant_name}
                              </h3>
                              <Badge className={STATUS_CONFIG[app.status].color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {STATUS_CONFIG[app.status].label}
                              </Badge>
                              {app.match_score && (
                                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                  {app.match_score}% Match
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Applied for: <span className="font-medium">{getOpportunityTitle(app.opportunity_id)}</span>
                            </p>
                            {app.ai_summary && (
                              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{app.ai_summary}</p>
                            )}
                            {app.strengths && app.strengths.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {app.strengths.slice(0, 3).map((strength, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    ✓ {strength}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-500">
                              Applied: {new Date(app.created_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {app.status === 'applied' && (
                              <Button
                                size="sm"
                                onClick={() => screenMutation.mutate(app.id)}
                                disabled={screenMutation.isPending}
                                className="gap-2"
                              >
                                {screenMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Screening...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4" />
                                    Screen with AI
                                  </>
                                )}
                              </Button>
                            )}
                            {app.status === 'screening' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSchedulerOpen(app)}
                                className="gap-2 border-indigo-300 hover:bg-indigo-50"
                              >
                                <Calendar className="w-4 h-4" />
                                Schedule
                              </Button>
                            )}
                            {(app.status === 'screening' || app.status === 'interviewing') && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setInterviewAssistantOpen(app)}
                                  className="gap-2 border-purple-300 hover:bg-purple-50"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Interview
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSkillValidationOpen(app)}
                                  className="gap-2 border-green-300 hover:bg-green-50"
                                >
                                  <Shield className="w-4 h-4" />
                                  Assess
                                </Button>
                              </>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setRecruiterNotes(app.recruiter_notes || '');
                                  }}
                                >
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-3">
                                    {app.applicant_name}
                                    <Badge className={STATUS_CONFIG[app.status].color}>
                                      {STATUS_CONFIG[app.status].label}
                                    </Badge>
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                  {app.match_score && (
                                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-900">Match Score</span>
                                        <span className="text-3xl font-bold text-indigo-600">{app.match_score}%</span>
                                      </div>
                                      {app.ai_summary && (
                                        <p className="text-sm text-gray-700">{app.ai_summary}</p>
                                      )}
                                    </div>
                                  )}

                                  {app.strengths && app.strengths.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        Strengths
                                      </h4>
                                      <ul className="space-y-1">
                                        {app.strengths.map((strength, idx) => (
                                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            {strength}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {app.concerns && app.concerns.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        Areas for Discussion
                                      </h4>
                                      <ul className="space-y-1">
                                        {app.concerns.map((concern, idx) => (
                                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-amber-600 mt-0.5">•</span>
                                            {concern}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {app.screening_notes && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Detailed Analysis</h4>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.screening_notes}</p>
                                    </div>
                                  )}

                                  {app.cover_letter && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Cover Letter</h4>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.cover_letter}</p>
                                    </div>
                                  )}

                                  {(app.portfolio_url || app.resume_url) && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Links</h4>
                                      <div className="flex gap-2">
                                        {app.portfolio_url && (
                                          <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline" className="gap-2">
                                              <ExternalLink className="w-4 h-4" />
                                              Portfolio
                                            </Button>
                                          </a>
                                        )}
                                        {app.resume_url && (
                                          <a href={app.resume_url} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline" className="gap-2">
                                              <FileText className="w-4 h-4" />
                                              Resume
                                            </Button>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Update Status</h4>
                                    <Select
                                      value={app.status}
                                      onValueChange={(status) => 
                                        updateStatusMutation.mutate({ 
                                          applicationId: app.id, 
                                          status,
                                          notes: recruiterNotes 
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                          <SelectItem key={key} value={key}>
                                            {config.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Recruiter Notes</h4>
                                    <Textarea
                                      value={recruiterNotes}
                                      onChange={(e) => setRecruiterNotes(e.target.value)}
                                      placeholder="Add your notes about this candidate..."
                                      rows={4}
                                    />
                                    <Button
                                      className="mt-2"
                                      onClick={() => 
                                        updateStatusMutation.mutate({ 
                                          applicationId: app.id, 
                                          status: app.status,
                                          notes: recruiterNotes 
                                        })
                                      }
                                    >
                                      Save Notes
                                    </Button>
                                  </div>

                                  <RecruiterNotes 
                                    applicationId={app.id} 
                                    currentUserEmail={user?.email} 
                                  />

                                  <TeamChat 
                                    opportunityId={app.opportunity_id} 
                                    currentUserEmail={user?.email} 
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {(status === 'all' ? sortedApplications : filterByStatus(status)).length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No applications yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {interviewAssistantOpen && (
        <InterviewAssistant 
          application={interviewAssistantOpen} 
          onClose={() => setInterviewAssistantOpen(null)}
        />
      )}

      {skillValidationOpen && (
        <SkillValidation
          application={skillValidationOpen}
          onClose={() => setSkillValidationOpen(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['applications'] })}
        />
      )}

      {messageComposerOpen && (
        <MessageComposer
          applications={selectedAppsForMessage}
          opportunity={messageComposerOpen}
          onClose={() => {
            setMessageComposerOpen(null);
            setSelectedAppsForMessage([]);
          }}
          onSent={() => queryClient.invalidateQueries({ queryKey: ['applications'] })}
        />
      )}

      {schedulerOpen && (
        <InterviewScheduler
          application={schedulerOpen}
          recruiter={user}
          onClose={() => setSchedulerOpen(null)}
          onScheduled={() => queryClient.invalidateQueries({ queryKey: ['applications'] })}
        />
      )}
    </div>
  );
}