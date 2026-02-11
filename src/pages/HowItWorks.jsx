import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, Search, Target, MessageSquare, Calendar, 
  CheckCircle, Shield, Sparkles, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: "Create Your Profile",
      description: "Sign up and build your skill-based profile. Add your expertise, portfolio links, and verify your skills with AI-powered validation.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Search,
      title: "Discover Opportunities",
      description: "Browse opportunities matched to your skills. Our AI finds the best matches based on your verified capabilities, not just keywords.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      title: "Get Matched",
      description: "See your match score for each opportunity. Express interest and unlock direct communication when both parties are interested.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: Calendar,
      title: "Schedule Interviews",
      description: "Book interviews directly through our calendar integration. Self-schedule based on recruiter availability with automated reminders.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: MessageSquare,
      title: "Collaborate & Chat",
      description: "Communicate directly with recruiters and hiring managers. Share work samples, discuss requirements, and build relationships.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: CheckCircle,
      title: "Land the Job",
      description: "Complete the hiring process with automated onboarding. Get personalized training recommendations and welcome materials.",
      color: "from-teal-500 to-cyan-500"
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "AI-Powered Skill Verification",
      description: "Verify your skills through portfolio analysis, GitHub evaluation, and project reviews"
    },
    {
      icon: Sparkles,
      title: "Smart Matching Algorithm",
      description: "Get matched with opportunities based on verified skills and experience level"
    },
    {
      icon: TrendingUp,
      title: "Career Growth Tools",
      description: "Access personalized learning paths, skill gap analysis, and career progression insights"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-bold mb-6">How SkillsBridge Works</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Connect with opportunities through skill-based matching, AI verification, 
              and streamlined hiring processes. No resumes. No spam. Just results.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to={createPageUrl('Opportunities')}>
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                  Browse Opportunities
                </Button>
              </Link>
              <Link to={createPageUrl('Profile')}>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Build Your Profile
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Journey to Success</h2>
          <p className="text-xl text-gray-600">Six simple steps to find your perfect opportunity</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl font-bold text-gray-300">{index + 1}</span>
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need to succeed in your job search</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of professionals finding their dream opportunities through skill-based matching
          </p>
          <Link to={createPageUrl('Discover')}>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}