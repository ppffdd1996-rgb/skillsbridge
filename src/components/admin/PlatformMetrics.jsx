import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export default function PlatformMetrics({ report }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">New Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{report.trends.new_registrations_trend}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">New Applications</p>
                <p className="text-2xl font-bold text-gray-900">{report.trends.applications_trend}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Interviews Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{report.trends.interviews_trend}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Key Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-700">Average Time to Hire</span>
              <span className="font-bold text-gray-900">{report.summary.avg_time_to_hire_days} days</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-700">Candidate Engagement</span>
              <span className="font-bold text-gray-900">{report.summary.candidate_engagement_rate}%</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-700">Total Active Users</span>
              <span className="font-bold text-gray-900">{report.user_activity.total_users}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-700">Verified Skills</span>
              <span className="font-bold text-gray-900">{report.user_activity.verified_skills}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-700">Active Opportunities</span>
              <span className="font-bold text-gray-900">{report.summary.active_opportunities}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}