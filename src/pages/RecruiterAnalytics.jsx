import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, Clock, Users, CheckCircle, Target, 
  Loader2, Sparkles, Calendar, Award, BarChart3
} from "lucide-react";
import MetricsCard from "@/components/analytics/MetricsCard";
import TrendChart from "@/components/analytics/TrendChart";
import { toast } from 'sonner';

export default function RecruiterAnalytics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [aiInsights, setAiInsights] = useState(null);
  const [analyzingInsights, setAnalyzingInsights] = useState(false);

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

  const { data: allApplications = [] } = useQuery({
    queryKey: ['allApplications'],
    queryFn: async () => {
      const opportunityIds = myOpportunities.map(o => o.id);
      if (opportunityIds.length === 0) return [];
      const allApps = await base44.entities.Application.list();
      return allApps.filter(app => opportunityIds.includes(app.opportunity_id));
    },
    enabled: myOpportunities.length > 0
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['allInterviews'],
    queryFn: () => base44.entities.Interview.filter({ recruiter_email: user?.email }),
    enabled: !!user
  });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

  const filteredApplications = allApplications.filter(app => 
    new Date(app.created_date) >= cutoffDate
  );

  // Calculate metrics
  const calculateMetrics = () => {
    const hiredApps = filteredApplications.filter(a => a.status === 'hired');
    const offeredApps = filteredApplications.filter(a => a.status === 'offered');
    const rejectedApps = filteredApplications.filter(a => a.status === 'rejected');

    // Time to hire
    const timeToHire = hiredApps.map(app => {
      const created = new Date(app.created_date);
      const updated = new Date(app.updated_date);
      return (updated - created) / (1000 * 60 * 60 * 24);
    });
    const avgTimeToHire = timeToHire.length > 0 
      ? Math.round(timeToHire.reduce((a, b) => a + b, 0) / timeToHire.length) 
      : 0;

    // Offer acceptance rate
    const offerAcceptanceRate = offeredApps.length > 0
      ? Math.round((hiredApps.length / offeredApps.length) * 100)
      : 0;

    // Interview completion rate
    const interviewingApps = filteredApplications.filter(a => 
      ['interviewing', 'offered', 'hired'].includes(a.status)
    );
    const interviewCompletionRate = filteredApplications.length > 0
      ? Math.round((interviewingApps.length / filteredApplications.length) * 100)
      : 0;

    // Conversion rate (applied to hired)
    const conversionRate = filteredApplications.length > 0
      ? Math.round((hiredApps.length / filteredApplications.length) * 100)
      : 0;

    // Top performing opportunities
    const opportunityStats = myOpportunities.map(opp => {
      const oppApps = filteredApplications.filter(a => a.opportunity_id === opp.id);
      const hired = oppApps.filter(a => a.status === 'hired').length;
      const avgMatch = oppApps.length > 0
        ? Math.round(oppApps.reduce((sum, a) => sum + (a.match_score || 0), 0) / oppApps.length)
        : 0;
      
      return {
        ...opp,
        applicationCount: oppApps.length,
        hiredCount: hired,
        avgMatchScore: avgMatch
      };
    }).sort((a, b) => b.hiredCount - a.hiredCount);

    return {
      avgTimeToHire,
      offerAcceptanceRate,
      interviewCompletionRate,
      conversionRate,
      totalApplications: filteredApplications.length,
      totalHired: hiredApps.length,
      totalInterviews: interviews.filter(i => 
        new Date(i.created_date) >= cutoffDate
      ).length,
      topOpportunities: opportunityStats
    };
  };

  const metrics = calculateMetrics();

  // Generate trend data
  const generateTrendData = () => {
    const days = parseInt(timeRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i -= Math.max(1, Math.floor(days / 10))) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayApps = allApplications.filter(a => {
        const created = new Date(a.created_date);
        return created >= dayStart && created <= dayEnd;
      });

      data.push({
        name: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        applications: dayApps.length,
        hired: dayApps.filter(a => a.status === 'hired').length,
        rejected: dayApps.filter(a => a.status === 'rejected').length
      });
    }
    
    return data;
  };

  const trendData = generateTrendData();

  // Status funnel data
  const funnelData = [
    { name: 'Applied', count: filteredApplications.filter(a => a.status === 'applied').length },
    { name: 'Screening', count: filteredApplications.filter(a => a.status === 'screening').length },
    { name: 'Interviewing', count: filteredApplications.filter(a => a.status === 'interviewing').length },
    { name: 'Offered', count: filteredApplications.filter(a => a.status === 'offered').length },
    { name: 'Hired', count: filteredApplications.filter(a => a.status === 'hired').length }
  ];

  const analyzeWithAI = async () => {
    setAnalyzingInsights(true);
    try {
      const response = await base44.functions.invoke('analyzeRecruitmentMetrics', {
        metrics,
        opportunities: metrics.topOpportunities,
        applications: filteredApplications
      });
      setAiInsights(response.data.insights);
      toast.success('AI analysis complete!');
    } catch (error) {
      toast.error('Failed to generate insights');
      console.error(error);
    } finally {
      setAnalyzingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruitment Analytics</h1>
            <p className="text-gray-600">AI-powered insights and performance metrics</p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={analyzeWithAI}
              disabled={analyzingInsights || filteredApplications.length === 0}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {analyzingInsights ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Insights
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <MetricsCard
            title="Avg Time to Hire"
            value={`${metrics.avgTimeToHire} days`}
            icon={Clock}
            color="indigo"
          />
          <MetricsCard
            title="Offer Acceptance"
            value={`${metrics.offerAcceptanceRate}%`}
            icon={CheckCircle}
            color="green"
          />
          <MetricsCard
            title="Conversion Rate"
            value={`${metrics.conversionRate}%`}
            subtitle="Applied → Hired"
            icon={TrendingUp}
            color="purple"
          />
          <MetricsCard
            title="Total Hired"
            value={metrics.totalHired}
            subtitle={`${metrics.totalApplications} applications`}
            icon={Award}
            color="amber"
          />
        </div>

        {/* AI Insights */}
        {aiInsights && (
          <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✨ Key Insights</h4>
                <ul className="space-y-1">
                  {aiInsights.key_insights?.map((insight, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Success Patterns</h4>
                <ul className="space-y-1">
                  {aiInsights.success_patterns?.map((pattern, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">💡 Recommendations</h4>
                <ul className="space-y-1">
                  {aiInsights.recommendations?.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {aiInsights.action_items && aiInsights.action_items.length > 0 && (
                <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Action Items</h4>
                  <ul className="space-y-1">
                    {aiInsights.action_items.map((action, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <TrendChart
              title="Application Trends"
              data={trendData}
              type="line"
              dataKeys={['applications', 'hired', 'rejected']}
            />
          </TabsContent>

          <TabsContent value="funnel">
            <TrendChart
              title="Hiring Funnel"
              data={funnelData}
              type="bar"
              dataKeys={['count']}
            />
          </TabsContent>

          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Performance</CardTitle>
                <CardDescription>Compare success rates across your job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topOpportunities.slice(0, 10).map((opp, idx) => (
                    <div key={opp.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-semibold text-gray-400">#{idx + 1}</span>
                          <h4 className="font-semibold text-gray-900">{opp.title}</h4>
                          <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                            {opp.avgMatchScore}% avg match
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {opp.applicationCount} applications • {opp.hiredCount} hired
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <div className="text-center px-3 py-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-600 mb-1">Hired</p>
                          <p className="text-lg font-bold text-green-700">{opp.hiredCount}</p>
                        </div>
                        <div className="text-center px-3 py-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-600 mb-1">Applications</p>
                          <p className="text-lg font-bold text-blue-700">{opp.applicationCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {metrics.topOpportunities.length === 0 && (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No opportunities yet</p>
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