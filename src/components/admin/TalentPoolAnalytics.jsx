import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, Users, AlertCircle, Lightbulb, Target } from "lucide-react";
import { toast } from 'sonner';

export default function TalentPoolAnalytics() {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('analyzeTalentPool', {});
      setAnalytics(response.data.analytics);
      setStats(response.data.stats);
      toast.success('Talent pool analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze talent pool');
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Talent Pool Analytics</CardTitle>
              <CardDescription>AI-powered insights into your applicant ecosystem</CardDescription>
            </div>
            <Button
              onClick={runAnalysis}
              disabled={loading}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {stats && (
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Applicants</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total_applicants}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Applications</p>
                <p className="text-2xl font-bold text-purple-900">{stats.total_applications}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Top Performers</p>
                <p className="text-2xl font-bold text-green-900">{stats.high_performers}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-600 font-medium">Unique Skills</p>
                <p className="text-2xl font-bold text-amber-900">{stats.top_skills?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {analytics && (
        <>
          {/* Emerging Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Emerging Skill Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.emerging_trends?.map((trend, idx) => (
                  <div key={idx} className="p-4 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{trend.skill}</h4>
                      <Badge className="bg-indigo-600">Trending</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{trend.trend}</p>
                    <p className="text-xs text-gray-600">💡 {trend.recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Talent Pool Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Talent Pool Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {analytics.talent_pool_strengths?.map((strength, idx) => (
                  <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-gray-800 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      {strength}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skill Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Skill Gaps & Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.skill_gaps?.map((gap, idx) => (
                  <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-gray-800 flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">⚠</span>
                      {gap}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Passive Candidates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                High-Potential Passive Candidates
              </CardTitle>
              <CardDescription>Top candidates for future opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.passive_candidates?.map((candidate, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-gray-900 mb-2">{candidate.profile}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Key Strengths: </span>
                        <span className="text-gray-600">{candidate.strengths}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Potential Roles: </span>
                        <span className="text-gray-600">{candidate.potential_roles}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Market Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.market_insights?.map((insight, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-800">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strategic Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.strategic_recommendations?.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-800 flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">💡</span>
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!analytics && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Click "Run Analysis" to generate AI-powered insights</p>
            <p className="text-sm text-gray-400">
              Analysis includes skill trends, talent pool strengths, gaps, passive candidates, and strategic recommendations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}