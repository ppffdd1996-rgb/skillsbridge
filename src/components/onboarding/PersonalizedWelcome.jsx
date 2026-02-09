import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, Users, BookOpen, Target, CheckCircle, Clock, 
  TrendingUp, Award, Mail, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PersonalizedWelcome({ employeeEmail }) {
  const { data: plan, isLoading } = useQuery({
    queryKey: ['personalized-onboarding', employeeEmail],
    queryFn: () => base44.entities.PersonalizedOnboardingPlan.filter({ 
      employee_email: employeeEmail 
    }).then(plans => plans.length > 0 ? plans[0] : null),
    enabled: !!employeeEmail
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['onboarding-tasks', employeeEmail],
    queryFn: () => base44.entities.OnboardingTask.filter({ employee_email: employeeEmail }),
    enabled: !!employeeEmail
  });

  if (isLoading || !plan) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  const completedMilestones = plan.milestones?.filter(m => m.completed).length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <Sparkles className="w-8 h-8 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3">Welcome, {plan.employee_name}! 🎉</h2>
                <p className="text-white/90 whitespace-pre-wrap">{plan.welcome_message}</p>
                <div className="flex gap-2 mt-4">
                  <Badge className="bg-white/20 text-white border-white/40">
                    {plan.role}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/40">
                    {plan.department}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/40">
                    {plan.user_type === 'employer' ? 'Recruiter' : 'Talent'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasks Completed</p>
                <p className="text-2xl font-bold">{completedTasks}/{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Milestones</p>
                <p className="text-2xl font-bold">{completedMilestones}/{plan.milestones?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Training Modules</p>
                <p className="text-2xl font-bold">{plan.recommended_training?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-indigo-600">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Team Introductions */}
      {plan.team_introductions && plan.team_introductions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Meet Your Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plan.team_introductions.map((member, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-indigo-600">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      <a href={`mailto:${member.email}`}>
                        <Button variant="ghost" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{member.introduction}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Training */}
      {plan.recommended_training && plan.recommended_training.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Personalized Learning Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.recommended_training.map((resource, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{resource.title}</h4>
                        <Badge 
                          className={
                            resource.priority === 'high' ? 'bg-red-100 text-red-800' :
                            resource.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {resource.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {resource.estimated_hours}h
                        </span>
                        <span className="flex flex-wrap gap-1">
                          {resource.skills_addressed?.map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                        </span>
                      </div>
                    </div>
                    {resource.resource_url !== 'Internal Resource' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(resource.resource_url, '_blank')}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      {plan.milestones && plan.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Your Onboarding Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.milestones.map((milestone, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-3 p-3 border rounded-lg ${
                    milestone.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                  }`}
                >
                  {milestone.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${milestone.completed ? 'text-green-900' : 'text-gray-900'}`}>
                      {milestone.title}
                    </h4>
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(milestone.target_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Buddy */}
      {plan.onboarding_buddy && (
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Your Onboarding Buddy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">
                  {plan.onboarding_buddy.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{plan.onboarding_buddy.name}</h4>
                <p className="text-sm text-gray-600">{plan.onboarding_buddy.role}</p>
                <a 
                  href={`mailto:${plan.onboarding_buddy.email}`}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {plan.onboarding_buddy.email}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}