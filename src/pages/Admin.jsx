import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, TrendingUp, Briefcase, Calendar, Award, 
  Settings, Download, RefreshCw, Loader2, Shield,
  CheckCircle, Clock, Target, MessageSquare, Sparkles,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import AIConfigPanel from '@/components/admin/AIConfigPanel';
import HiringFunnelChart from '@/components/admin/HiringFunnelChart';
import PlatformMetrics from '@/components/admin/PlatformMetrics';
import AdvancedReporting from '@/components/admin/AdvancedReporting';
import { toast } from 'sonner';

export default function AdminPage() {
  const [dateRange, setDateRange] = useState('30');
  const [generatingReport, setGeneratingReport] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['platform-report', dateRange],
    queryFn: async () => {
      const response = await base44.functions.invoke('generatePlatformReport', {
        date_range_start: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()
      });
      return response.data;
    },
    enabled: !!user && user.role === 'admin'
  });

  const generateCSVReport = async () => {
    setGeneratingReport(true);
    try {
      if (!report) return;
      
      const csvData = [
        ['Platform Report', `Last ${dateRange} Days`],
        [''],
        ['Summary Metrics'],
        ['Metric', 'Value'],
        ['Average Time to Hire (days)', report.summary.avg_time_to_hire_days],
        ['Candidate Engagement Rate (%)', report.summary.candidate_engagement_rate],
        ['Total Hires', report.summary.total_hires],
        ['Active Opportunities', report.summary.active_opportunities],
        [''],
        ['Hiring Funnel'],
        ['Stage', 'Count'],
        ['Applications', report.hiring_funnel.applications],
        ['Screening', report.hiring_funnel.screening],
        ['Interviews', report.hiring_funnel.interviews],
        ['Offers', report.hiring_funnel.offers],
        ['Hires', report.hiring_funnel.hires],
        [''],
        ['Conversion Rates'],
        ['Stage', 'Rate (%)'],
        ['Application to Interview', report.conversion_rates.application_to_interview.toFixed(2)],
        ['Interview to Offer', report.conversion_rates.interview_to_offer.toFixed(2)],
        ['Offer to Hire', report.conversion_rates.offer_to_hire.toFixed(2)]
      ];

      const csv = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Platform insights and management</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['platform-report'] })}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await base44.functions.invoke('downloadAppCode');
                  const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `skillsbridge-code-${Date.now()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  a.remove();
                  toast.success('App code downloaded');
                } catch (error) {
                  toast.error('Failed to download code');
                }
              }}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Code
            </Button>
            <Button
              onClick={generateCSVReport}
              disabled={generatingReport || !report}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {generatingReport ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export Report
            </Button>
          </div>
        </div>

        {reportLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-gray-600 mt-4">Loading analytics...</p>
          </div>
        ) : report ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="funnel">Hiring Funnel</TabsTrigger>
              <TabsTrigger value="reports">Advanced Reports</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="ai">AI Config</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg. Time to Hire</p>
                        <p className="text-2xl font-bold">{report.summary.avg_time_to_hire_days} days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Engagement Rate</p>
                        <p className="text-2xl font-bold">{report.summary.candidate_engagement_rate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Hires</p>
                        <p className="text-2xl font-bold">{report.summary.total_hires}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Briefcase className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active Opportunities</p>
                        <p className="text-2xl font-bold">{report.summary.active_opportunities}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-gray-900">{report.user_activity.total_users}</p>
                      <p className="text-sm text-gray-600 mt-1">Total Users</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">{report.user_activity.new_users}</p>
                      <p className="text-sm text-gray-600 mt-1">New Users</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-indigo-600">{report.user_activity.candidates}</p>
                      <p className="text-sm text-gray-600 mt-1">Candidates</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">{report.user_activity.verified_skills}</p>
                      <p className="text-sm text-gray-600 mt-1">Verified Skills</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Top Performing Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.top_opportunities.slice(0, 5).map((opp, idx) => (
                      <div key={opp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-400">#{idx + 1}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{opp.title}</p>
                            <p className="text-sm text-gray-600">{opp.applications} applications • {opp.interviews} interviews</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{opp.views} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="funnel">
              <HiringFunnelChart data={report.hiring_funnel} conversionRates={report.conversion_rates} />
            </TabsContent>

            <TabsContent value="reports">
              <AdvancedReporting />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="ai">
              <AIConfigPanel />
            </TabsContent>

            <TabsContent value="metrics">
              <PlatformMetrics report={report} />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  );
}