import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase, Mail, Clock, TrendingUp, CheckCircle, 
  AlertCircle, Loader2, ExternalLink, Calendar, FileText, Video
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STATUS_CONFIG = {
  applied: { label: 'Applied', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  screening: { label: 'Under Review', icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
  interviewing: { label: 'Interviewing', icon: Calendar, color: 'bg-indigo-100 text-indigo-700' },
  offered: { label: 'Offer Extended', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Not Selected', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  hired: { label: 'Hired', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' }
};

export default function CandidateDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
      setLoading(false);
    };
    loadUser();
  }, []);

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['my-applications', user?.email],
    queryFn: () => base44.entities.Application.filter({ applicant_email: user.email }),
    enabled: !!user
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['my-messages', user?.email],
    queryFn: () => base44.entities.Message.filter({ recipient_email: user.email }),
    enabled: !!user
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['my-interviews', user?.email],
    queryFn: () => base44.entities.Interview.filter({ candidate_email: user.email }),
    enabled: !!user
  });

  const markMessageAsRead = async (messageId) => {
    try {
      await base44.entities.Message.update(messageId, {
        read: true,
        read_at: new Date().toISOString()
      });
      refetchMessages();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const getOpportunityForApplication = async (app) => {
    const opps = await base44.entities.Opportunity.filter({ id: app.opportunity_id });
    return opps[0];
  };

  if (loading || appsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const unreadMessages = messages.filter(m => !m.read).length;
  const activeApplications = applications.filter(a => 
    ['applied', 'screening', 'interviewing'].includes(a.status)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Track your applications and communications</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
                </div>
                <Briefcase className="w-10 h-10 text-gray-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Applications</p>
                  <p className="text-3xl font-bold text-indigo-600">{activeApplications}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-indigo-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unread Messages</p>
                  <p className="text-3xl font-bold text-purple-600">{unreadMessages}</p>
                </div>
                <Mail className="w-10 h-10 text-purple-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">
              <Briefcase className="w-4 h-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="messages">
              <Mail className="w-4 h-4 mr-2" />
              Messages {unreadMessages > 0 && `(${unreadMessages})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No applications yet</p>
                  <Button onClick={() => navigate(createPageUrl('Opportunities'))}>
                    Browse Opportunities
                  </Button>
                </CardContent>
              </Card>
            ) : (
              applications.map((app) => {
                const statusConfig = STATUS_CONFIG[app.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={app.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Application #{app.id.slice(0, 8)}
                            </h3>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Applied: {new Date(app.created_date).toLocaleDateString()}
                          </p>
                          {app.match_score && (
                            <div className="flex items-center gap-2 mt-2">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-gray-900">
                                {app.match_score}% Match
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {app.ai_summary && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700">{app.ai_summary}</p>
                        </div>
                      )}

                      {app.strengths && app.strengths.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-700 mb-2">Your Strengths:</p>
                          <div className="flex flex-wrap gap-2">
                            {app.strengths.map((strength, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {app.technical_assessment?.ai_score && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <span>Technical Score: {app.technical_assessment.ai_score}/100</span>
                        </div>
                      )}

                      {app.recruiter_notes && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
                          <p className="text-xs font-medium text-blue-900 mb-1">Recruiter Note:</p>
                          <p className="text-sm text-blue-800">{app.recruiter_notes}</p>
                        </div>
                      )}

                      {(() => {
                        const appInterviews = interviews.filter(i => 
                          i.application_id === app.id && 
                          ['scheduled', 'confirmed'].includes(i.status)
                        );
                        return appInterviews.length > 0 && (
                          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 mb-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-indigo-900 mb-2">
                              <Calendar className="w-4 h-4" />
                              Upcoming Interview
                            </div>
                            {appInterviews.map(interview => (
                              <div key={interview.id} className="text-sm text-indigo-800 space-y-1">
                                <p>{new Date(interview.scheduled_time).toLocaleString('en-US', {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}</p>
                                {interview.meeting_link && (
                                  <a 
                                    href={interview.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                                  >
                                    <Video className="w-3 h-3" />
                                    Join Meeting
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No messages yet</p>
                </CardContent>
              </Card>
            ) : (
              messages.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((msg) => (
                <Card 
                  key={msg.id} 
                  className={`${!msg.read ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30' : ''}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {!msg.read && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                          {msg.subject}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          From: {msg.sender_email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.created_date).toLocaleString()}
                        </p>
                      </div>
                      {!msg.read && (
                        <Badge variant="outline" className="bg-indigo-100 text-indigo-700">
                          New
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{msg.body}</p>
                    </div>
                    {!msg.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => markMessageAsRead(msg.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}