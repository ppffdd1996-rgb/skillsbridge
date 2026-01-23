import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, Users, AlertTriangle, Target, Sparkles, 
  RefreshCw, Loader2, BarChart3, PieChart, Activity
} from "lucide-react";
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export default function TalentPoolDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);
  const [rawData, setRawData] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const u = await base44.auth.me();
      if (u.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(u);
      setLoading(false);
    };
    loadUser();
  }, []);

  const analyzePool = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzeTalentPoolInsights', {});
      setInsights(response.data.insights);
      setRawData(response.data.raw_data);
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setAnalyzing(false);
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Talent Pool Analytics</h1>
            <p className="text-gray-600 mt-1">AI-powered insights on your talent ecosystem</p>
          </div>
          <Button
            onClick={analyzePool}
            disabled={analyzing}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>

        {!insights && !analyzing && (
          <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/50">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generate AI-Powered Insights
              </h3>
              <p className="text-gray-600 mb-6">
                Click "Run AI Analysis" to get comprehensive insights on your talent pool
              </p>
            </CardContent>
          </Card>
        )}

        {analyzing && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">AI is analyzing your talent pool data...</p>
            </CardContent>
          </Card>
        )}

        {insights && (
          <>
            {/* Key Metrics Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Skill Utilization</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {Math.round(insights.key_metrics.skill_utilization_rate * 100)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-indigo-300" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(insights.key_metrics.application_conversion_rate * 100)}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-green-300" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Engagement Score</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round(insights.engagement_analysis.engagement_score)}%
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-300" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pool Health</p>
                      <p className="text-sm font-bold text-gray-900">
                        {insights.key_metrics.talent_pool_health}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-gray-300" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="trends" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="trends">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Skill Trends
                </TabsTrigger>
                <TabsTrigger value="demographics">
                  <PieChart className="w-4 h-4 mr-2" />
                  Demographics
                </TabsTrigger>
                <TabsTrigger value="engagement">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Engagement
                </TabsTrigger>
                <TabsTrigger value="sourcing">
                  <Target className="w-4 h-4 mr-2" />
                  Sourcing
                </TabsTrigger>
              </TabsList>

              {/* Skill Trends */}
              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Emerging Skill Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={insights.skill_trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="skill" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="candidate_count" fill="#4F46E5" name="Candidates" />
                        <Bar dataKey="demand_count" fill="#EC4899" name="Demand" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  {insights.skill_trends.map((skill, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{skill.skill}</h4>
                            <Badge className={
                              skill.trend === 'High Demand' ? 'bg-red-100 text-red-700' :
                              skill.trend === 'Growing' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }>
                              {skill.trend}
                            </Badge>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-gray-600">Supply: {skill.candidate_count}</p>
                            <p className="text-gray-600">Demand: {skill.demand_count}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{skill.insight}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Skill Gaps */}
                <Card className="bg-red-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-900">Critical Skill Gaps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {insights.key_metrics.skill_gaps.map((gap, idx) => (
                        <Badge key={idx} className="bg-red-600 text-white">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-red-800 mt-3">
                      These skills are in high demand but underrepresented in your talent pool
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Demographics */}
              <TabsContent value="demographics" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Locations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {insights.demographics.top_locations.map((location, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">{location}</span>
                            <Badge variant="outline">{idx + 1}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Availability Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                          <Pie
                            data={Object.entries(insights.demographics.availability_breakdown || {}).map(([key, value]) => ({
                              name: key,
                              value: value
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.name}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.keys(insights.demographics.availability_breakdown || {}).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Diversity Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{insights.demographics.diversity_notes}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Engagement & Flight Risks */}
              <TabsContent value="engagement" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600 mb-1">Active Candidates</p>
                      <p className="text-3xl font-bold text-green-600">
                        {insights.engagement_analysis.active_candidates}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-6">
                      <p className="text-sm text-orange-800 mb-1">At-Risk Candidates</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {insights.engagement_analysis.at_risk_candidates}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600 mb-1">Engagement Score</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {Math.round(insights.engagement_analysis.engagement_score)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {insights.engagement_analysis.risk_factors.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span className="text-gray-700">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Engagement Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.engagement_analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sourcing Strategies */}
              <TabsContent value="sourcing" className="space-y-4">
                <div className="grid gap-4">
                  {insights.sourcing_strategies.map((strategy, idx) => (
                    <Card key={idx} className={
                      strategy.priority === 'High' ? 'border-l-4 border-l-red-500' :
                      strategy.priority === 'Medium' ? 'border-l-4 border-l-yellow-500' :
                      'border-l-4 border-l-green-500'
                    }>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{strategy.strategy}</h4>
                              <Badge className={
                                strategy.priority === 'High' ? 'bg-red-100 text-red-700' :
                                strategy.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }>
                                {strategy.priority} Priority
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-3">{strategy.description}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-4 h-4 text-indigo-600" />
                              <span className="text-indigo-600 font-medium">Expected Impact: {strategy.expected_impact}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}