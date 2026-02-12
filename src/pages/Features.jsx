import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Target, Search, Users, Sparkles, TrendingUp, MessageSquare, Home, 
  PlusCircle, ClipboardList, BarChart3, Shield, User, HelpCircle,
  FileText, Calendar, Award, Briefcase, Lock, Map, Database, Bot
} from 'lucide-react';

export default function FeaturesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      return isAuth ? await base44.auth.me() : null;
    }
  });

  const allFeatures = [
    {
      category: 'Discovery & Matching',
      icon: Target,
      color: 'indigo',
      features: [
        { name: 'Discover', page: 'Discover', description: 'AI-powered opportunity discovery', icon: Target, authRequired: true },
        { name: 'Search Opportunities', page: 'Opportunities', description: 'Browse and filter job listings', icon: Search },
        { name: 'My Matches', page: 'Matches', description: 'View your matched opportunities', icon: Users, authRequired: true },
        { name: 'Enhanced Matching', page: 'EnhancedMatching', description: 'Advanced AI matching with scoring', icon: Sparkles, authRequired: true },
        { name: 'Career Match', page: 'CareerMatch', description: 'Find your ideal career path', icon: Map },
      ]
    },
    {
      category: 'Career Development',
      icon: TrendingUp,
      color: 'green',
      features: [
        { name: 'Skill Development', page: 'SkillDevelopment', description: 'AI-driven skill gap analysis and learning', icon: TrendingUp, authRequired: true },
        { name: 'Skill Passport', page: 'SkillPassport', description: 'Verified skills portfolio', icon: Award, authRequired: true },
        { name: 'Career Pathway', page: 'CareerPathway', description: 'Explore career progression paths', icon: Map },
      ]
    },
    {
      category: 'Candidate Hub',
      icon: User,
      color: 'purple',
      features: [
        { name: 'My Dashboard', page: 'CandidateDashboard', description: 'Personal candidate dashboard', icon: User, authRequired: true },
        { name: 'Profile Settings', page: 'Profile', description: 'Manage your profile and preferences', icon: User, authRequired: true },
        { name: 'Messages', page: 'Messages', description: 'In-app communication', icon: MessageSquare, authRequired: true },
      ]
    },
    {
      category: 'Recruiter Tools',
      icon: Briefcase,
      color: 'blue',
      features: [
        { name: 'Company Profile', page: 'CompanyProfile', description: 'AI-generated company profiles', icon: Home, authRequired: true },
        { name: 'Create Opportunity', page: 'CreateOpportunity', description: 'Post new job opportunities', icon: PlusCircle, authRequired: true },
        { name: 'Applications', page: 'Applications', description: 'Manage candidate applications', icon: ClipboardList, authRequired: true },
        { name: 'Recruiter Analytics', page: 'RecruiterAnalytics', description: 'Track recruitment metrics', icon: BarChart3, authRequired: true },
        { name: 'AI Assistant', page: 'RecruiterAI', description: 'AI-powered recruitment help', icon: Sparkles, authRequired: true },
      ]
    },
    {
      category: 'Admin & Management',
      icon: Shield,
      color: 'red',
      features: [
        { name: 'Admin Home', page: 'AdminHome', description: 'Admin control center', icon: Shield, adminOnly: true },
        { name: 'Admin Dashboard', page: 'Admin', description: 'Platform analytics and management', icon: BarChart3, adminOnly: true },
        { name: 'Admin Support', page: 'AdminSupport', description: 'Handle support tickets', icon: MessageSquare, adminOnly: true },
        { name: 'Talent Pool AI', page: 'TalentPoolDashboard', description: 'AI talent pool insights', icon: Bot, adminOnly: true },
      ]
    },
    {
      category: 'Information & Support',
      icon: HelpCircle,
      color: 'gray',
      features: [
        { name: 'How It Works', page: 'HowItWorks', description: 'Learn about the platform', icon: HelpCircle },
        { name: 'Support', page: 'Support', description: 'Get help and submit tickets', icon: MessageSquare },
        { name: 'Privacy Policy', page: 'Privacy', description: 'Privacy and data protection', icon: Lock },
      ]
    }
  ];

  const filteredFeatures = allFeatures.map(category => ({
    ...category,
    features: category.features.filter(feature => {
      const matchesSearch = searchQuery === '' || 
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const hasAccess = !feature.adminOnly || (user?.role === 'admin');
      const canView = !feature.authRequired || user;
      
      return matchesSearch && hasAccess && canView;
    })
  })).filter(category => category.features.length > 0);

  const totalFeatures = filteredFeatures.reduce((sum, cat) => sum + cat.features.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Platform Features</h1>
          <p className="text-lg text-gray-600 mb-6">
            Explore all {totalFeatures} features available on SkillsBridge
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features..."
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Feature Categories */}
        <div className="space-y-8">
          {filteredFeatures.map((category, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 bg-${category.color}-100 rounded-lg`}>
                    <category.icon className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  {category.category}
                  <Badge variant="outline" className="ml-auto">
                    {category.features.length} feature{category.features.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.features.map((feature, featureIdx) => (
                    <Link key={featureIdx} to={createPageUrl(feature.page)}>
                      <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group h-full">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <feature.icon className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {feature.name}
                            </h3>
                            {(feature.authRequired || feature.adminOnly) && (
                              <div className="flex gap-1 mt-1">
                                {feature.authRequired && (
                                  <Badge variant="outline" className="text-xs">Login Required</Badge>
                                )}
                                {feature.adminOnly && (
                                  <Badge className="bg-red-100 text-red-800 text-xs">Admin Only</Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-11">{feature.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No features found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Stats Footer */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-600">{totalFeatures}</p>
                <p className="text-sm text-gray-600 mt-1">Total Features</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">
                  {allFeatures.filter(c => c.features.some(f => f.authRequired)).length}
                </p>
                <p className="text-sm text-gray-600 mt-1">User Features</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {allFeatures.find(c => c.category === 'Recruiter Tools')?.features.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Recruiter Tools</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">
                  {allFeatures.find(c => c.category === 'Admin & Management')?.features.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Admin Features</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}