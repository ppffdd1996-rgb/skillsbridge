import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Sparkles, Loader2, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function AdvancedReporting() {
  const [reportType, setReportType] = useState('funnel_performance');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    roles: '',
    departments: '',
    recruiters: ''
  });
  const [reportData, setReportData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictLoading, setPredictLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateAdvancedReport', {
        report_type: reportType,
        filters: {
          ...filters,
          roles: filters.roles ? filters.roles.split(',').map(r => r.trim()) : undefined,
          departments: filters.departments ? filters.departments.split(',').map(d => d.trim()) : undefined,
          recruiters: filters.recruiters ? filters.recruiters.split(',').map(r => r.trim()) : undefined
        }
      });
      setReportData(response.data);
      toast.success('Report generated');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async (type) => {
    setPredictLoading(true);
    try {
      const response = await base44.functions.invoke('generatePredictiveAnalytics', {
        prediction_type: type,
        filters
      });
      setPredictions(response.data);
      toast.success('Predictions generated');
    } catch (error) {
      toast.error('Failed to generate predictions');
    } finally {
      setPredictLoading(false);
    }
  };

  const exportReport = () => {
    const data = JSON.stringify({ report: reportData, predictions }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportType}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Reporting & Analytics</CardTitle>
          <CardDescription>Generate custom reports with predictive insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funnel_performance">Hiring Funnel Performance</SelectItem>
                  <SelectItem value="source_effectiveness">Source Effectiveness</SelectItem>
                  <SelectItem value="offer_acceptance">Offer Acceptance Rates</SelectItem>
                  <SelectItem value="time_to_hire">Time to Hire Analysis</SelectItem>
                  <SelectItem value="recruiter_performance">Recruiter Performance</SelectItem>
                  <SelectItem value="diversity_metrics">Diversity Metrics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Filter by Roles (comma-separated)</Label>
              <Input
                value={filters.roles}
                onChange={(e) => setFilters({ ...filters, roles: e.target.value })}
                placeholder="Engineer, Designer, Manager"
              />
            </div>
            <div>
              <Label>Filter by Departments</Label>
              <Input
                value={filters.departments}
                onChange={(e) => setFilters({ ...filters, departments: e.target.value })}
                placeholder="Engineering, Sales, Marketing"
              />
            </div>
            <div>
              <Label>Filter by Recruiters (emails)</Label>
              <Input
                value={filters.recruiters}
                onChange={(e) => setFilters({ ...filters, recruiters: e.target.value })}
                placeholder="recruiter@company.com"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={loading} className="gap-2 bg-indigo-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Generate Report
            </Button>
            {reportData && (
              <Button onClick={exportReport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Insights */}
          {reportData.insights?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.insights.map((insight, idx) => (
                    <div key={idx} className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Funnel Performance */}
          {reportType === 'funnel_performance' && reportData.data?.stages && (
            <Card>
              <CardHeader>
                <CardTitle>Hiring Funnel Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(reportData.data.stages).map(([stage, count]) => ({
                    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
                    count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid md:grid-cols-4 gap-4">
                  {Object.entries(reportData.data.conversion_rates).map(([key, rate]) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{key.replace(/_/g, ' ')}</p>
                      <p className="text-2xl font-bold text-indigo-600">{rate}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time to Hire */}
          {reportType === 'time_to_hire' && reportData.data?.average_days && (
            <Card>
              <CardHeader>
                <CardTitle>Time to Hire Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Average Days</p>
                    <p className="text-3xl font-bold text-indigo-600">{reportData.data.average_days}</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Fastest</p>
                    <p className="text-3xl font-bold text-green-600">{reportData.data.fastest} days</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Slowest</p>
                    <p className="text-3xl font-bold text-amber-600">{reportData.data.slowest} days</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Hires</p>
                    <p className="text-3xl font-bold text-purple-600">{reportData.data.total_hires}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Offer Acceptance */}
          {reportType === 'offer_acceptance' && reportData.data?.total_offers && (
            <Card>
              <CardHeader>
                <CardTitle>Offer Acceptance Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Accepted', value: reportData.data.accepted },
                          { name: 'Declined', value: reportData.data.declined },
                          { name: 'Pending', value: reportData.data.pending }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                        dataKey="value"
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Acceptance Rate</p>
                  <p className="text-5xl font-bold text-indigo-600">{reportData.data.acceptance_rate}%</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source Effectiveness */}
          {reportType === 'source_effectiveness' && reportData.data?.sources && (
            <Card>
              <CardHeader>
                <CardTitle>Source Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(reportData.data.sources).map(([source, count]) => ({
                    source,
                    applications: count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recruiter Performance */}
          {reportType === 'recruiter_performance' && reportData.data?.recruiter_stats && (
            <Card>
              <CardHeader>
                <CardTitle>Recruiter Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.data.recruiter_stats).map(([email, stats]) => (
                    <div key={email} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">{email}</p>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Applications</p>
                          <p className="font-bold text-indigo-600">{stats.applications}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Interviews</p>
                          <p className="font-bold text-purple-600">{stats.interviews}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Offers</p>
                          <p className="font-bold text-green-600">{stats.offers}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Hires</p>
                          <p className="font-bold text-blue-600">{stats.hires}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Predictive Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Predictive Analytics
          </CardTitle>
          <CardDescription>AI-powered forecasting and trend analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => generatePredictions('time_to_hire')}
              disabled={predictLoading}
              variant="outline"
              className="gap-2"
            >
              {predictLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Predict Time-to-Hire
            </Button>
            <Button
              onClick={() => generatePredictions('candidate_pool_quality')}
              disabled={predictLoading}
              variant="outline"
              className="gap-2"
            >
              Candidate Pool Quality
            </Button>
            <Button
              onClick={() => generatePredictions('hiring_demand')}
              disabled={predictLoading}
              variant="outline"
              className="gap-2"
            >
              Hiring Demand Forecast
            </Button>
          </div>

          {predictions && (
            <div className="space-y-4 mt-6">
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">
                  {predictions.prediction_type.replace(/_/g, ' ').toUpperCase()}
                </h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(predictions.predictions, null, 2)}
                </pre>
              </div>

              {predictions.ai_insights?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI Insights</h4>
                  <div className="space-y-2">
                    {predictions.ai_insights.map((insight, idx) => (
                      <div key={idx} className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}