import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, Users, TrendingUp, Settings, BarChart3, 
  MessageSquare, Briefcase, Award, ArrowRight, Loader2,
  Target, Sparkles, FileText, Database
} from 'lucide-react';

export default function AdminHomePage() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: quickStats, isLoading } = useQuery({
    queryKey: ['admin-quick-stats'],
    queryFn: async () => {
      const [users, opportunities, applications, tickets] = await Promise.all([
        base44.entities.User.list('-created_date', 10),
        base44.entities.Opportunity.list('-created_date', 10),
        base44.entities.Application.list('-created_date', 10),
        base44.entities.SupportTicket.filter({ status: 'open' })
      ]);
      
      return {
        total_users: users.length,
        recent_opportunities: opportunities.length,
        pending_applications: applications.filter(a => a.status === 'pending').length,
        open_tickets: tickets.length
      };
    },
    enabled: !!user && user.role === 'admin'
  });

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

  const quickActions = [
    { 
      title: 'Analytics Dashboard', 
      description: 'View platform metrics and reports',
      icon: BarChart3, 
      page: 'Admin',
      color: 'indigo'
    },
    { 
      title: 'User Management', 
      description: 'Manage users and permissions',
      icon: Users, 
      page: 'Admin',
      color: 'purple'
    },
    { 
      title: 'Support Tickets', 
      description: 'Respond to user requests',
      icon: MessageSquare, 
      page: 'AdminSupport',
      color: 'green'
    },
    { 
      title: 'Talent Pool AI', 
      description: 'AI-powered talent insights',
      icon: Sparkles, 
      page: 'TalentPoolDashboard',
      color: 'pink'
    }
  ];

  const platformOverview = [
    { label: 'Total Users', value: quickStats?.total_users || 0, icon: Users, color: 'blue' },
    { label: 'Active Opportunities', value: quickStats?.recent_opportunities || 0, icon: Briefcase, color: 'green' },
    { label: 'Pending Applications', value: quickStats?.pending_applications || 0, icon: FileText, color: 'orange' },
    { label: 'Open Support Tickets', value: quickStats?.open_tickets || 0, icon: MessageSquare, color: 'red' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
              <p className="text-gray-600">Welcome back, {user.full_name}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {platformOverview.map((stat, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                        <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, idx) => (
                    <Link key={idx} to={createPageUrl(action.page)}>
                      <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                        <div className={`p-3 bg-${action.color}-100 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}>
                          <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Management Sections */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Platform Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to={createPageUrl('Admin')}>
                    <Button variant="outline" className="w-full justify-between group">
                      <span>Full Analytics Dashboard</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl('AdminSupport')}>
                    <Button variant="outline" className="w-full justify-between group">
                      <span>Support & Tickets</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between group"
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
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                  >
                    <span>Download App Code</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    AI & Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to={createPageUrl('TalentPoolDashboard')}>
                    <Button variant="outline" className="w-full justify-between group">
                      <span>Talent Pool AI</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Admin')}>
                    <Button variant="outline" className="w-full justify-between group">
                      <span>AI Configuration</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Admin')}>
                    <Button variant="outline" className="w-full justify-between group">
                      <span>Advanced Reports</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}