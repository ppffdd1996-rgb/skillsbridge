import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, TrendingUp, BookOpen, Award, Target, 
  Loader2, ExternalLink, CheckCircle, AlertCircle,
  Lightbulb, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function SkillDevelopmentPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [resources, setResources] = useState(null);
  const [profileFeedback, setProfileFeedback] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const analyzeGaps = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzeSkillGaps');
      setGapAnalysis(response.data);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze skill gaps');
    } finally {
      setAnalyzing(false);
    }
  };

  const getResources = async () => {
    if (!gapAnalysis) return;
    
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('recommendLearningResources', {
        skill_gaps: gapAnalysis.critical_gaps
      });
      setResources(response.data);
      toast.success('Resources loaded!');
    } catch (error) {
      toast.error('Failed to load resources');
    } finally {
      setAnalyzing(false);
    }
  };

  const getProfileFeedback = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('generateProfileFeedback');
      setProfileFeedback(response.data);
      toast.success('Feedback generated!');
    } catch (error) {
      toast.error('Failed to generate feedback');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to access skill development</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            AI Skill Development
          </h1>
          <p className="text-gray-600 mt-1">
            Personalized insights to grow your skills and boost your career
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={analyzeGaps}>
            <CardContent className="pt-6 text-center">
              <Target className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Analyze Skill Gaps</h3>
              <p className="text-sm text-gray-600">Identify what's missing in your profile</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={getProfileFeedback}>
            <CardContent className="pt-6 text-center">
              <Lightbulb className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Profile Feedback</h3>
              <p className="text-sm text-gray-600">Get AI suggestions to improve your profile</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={getResources}>
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Learning Resources</h3>
              <p className="text-sm text-gray-600">Discover courses and materials</p>
            </CardContent>
          </Card>
        </div>

        {analyzing && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600 mb-4" />
            <p className="text-gray-600">Analyzing with AI...</p>
          </div>
        )}

        <Tabs defaultValue="gaps" className="space-y-6">
          <TabsList>
            <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
            <TabsTrigger value="feedback">Profile Feedback</TabsTrigger>
            <TabsTrigger value="resources">Learning Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="gaps">
            {gapAnalysis ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Overall Assessment</CardTitle>
                      <Badge className="bg-indigo-100 text-indigo-800">
                        Competitive Edge: {gapAnalysis.competitive_edge}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{gapAnalysis.overall_assessment}</p>
                  </CardContent>
                </Card>

                {gapAnalysis.critical_gaps?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        Critical Skill Gaps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {gapAnalysis.critical_gaps.map((gap, idx) => (
                          <div key={idx} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{gap.skill}</h4>
                                <p className="text-sm text-gray-600 mt-1">{gap.reason}</p>
                              </div>
                              <Badge className={
                                gap.priority === 'high' ? 'bg-red-100 text-red-800' :
                                gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }>
                                {gap.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">Market Impact</span>
                                  <span className="text-xs font-semibold">{gap.impact_score}%</span>
                                </div>
                                <Progress value={gap.impact_score} className="h-2" />
                              </div>
                              <span className="text-xs text-gray-600">{gap.market_demand}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {gapAnalysis.skills_to_improve?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-yellow-600" />
                        Skills to Strengthen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {gapAnalysis.skills_to_improve.map((skill, idx) => (
                          <div key={idx} className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{skill.skill}</h4>
                              <div className="text-sm">
                                <span className="text-gray-600">{skill.current_level}</span>
                                <span className="mx-2">→</span>
                                <span className="text-green-600 font-semibold">{skill.target_level}</span>
                              </div>
                            </div>
                            {skill.improvement_areas?.length > 0 && (
                              <ul className="space-y-1 mt-2">
                                {skill.improvement_areas.map((area, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-yellow-600">•</span>
                                    {area}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {gapAnalysis.emerging_skills?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        Emerging Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-3">
                        {gapAnalysis.emerging_skills.map((skill, idx) => (
                          <div key={idx} className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                            <h4 className="font-semibold text-gray-900">{skill.skill}</h4>
                            <p className="text-sm text-gray-600 mt-1">{skill.trend}</p>
                            <p className="text-xs text-purple-600 mt-2">{skill.relevance}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Click "Analyze Skill Gaps" to get started</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="feedback">
            {profileFeedback ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Profile Completeness</CardTitle>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-indigo-600">
                          {profileFeedback.completeness_score}%
                        </div>
                        <p className="text-sm text-gray-600">{profileFeedback.overall_rating}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={profileFeedback.completeness_score} className="h-3" />
                    {profileFeedback.match_potential_increase > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        Potential to increase match rate by {profileFeedback.match_potential_increase}%
                      </p>
                    )}
                  </CardContent>
                </Card>

                {profileFeedback.quick_wins?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        Quick Wins
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {profileFeedback.quick_wins.map((win, idx) => (
                          <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-yellow-600" />
                              {win.action}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{win.benefit}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {profileFeedback.areas_to_improve?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Areas to Improve</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {profileFeedback.areas_to_improve.map((area, idx) => (
                          <div key={idx} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{area.area}</h4>
                              <Badge className={
                                area.impact === 'high' ? 'bg-red-100 text-red-800' :
                                area.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }>
                                {area.impact} impact
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{area.current_issue}</p>
                            <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                              💡 {area.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Click "Profile Feedback" to get AI suggestions</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="resources">
            {resources ? (
              <div className="space-y-6">
                {resources.resources?.map((resource, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{resource.skill}</CardTitle>
                        <Badge className="bg-blue-100 text-blue-800">
                          ~{resource.estimated_weeks} weeks
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resource.courses?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Online Courses</h4>
                          <div className="space-y-2">
                            {resource.courses.map((course, i) => (
                              <div key={i} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{course.title}</h5>
                                    <p className="text-sm text-gray-600">{course.platform} • {course.duration}</p>
                                  </div>
                                  <Badge variant="outline">{course.level}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {resource.books?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Recommended Books</h4>
                          <div className="space-y-2">
                            {resource.books.map((book, i) => (
                              <div key={i} className="p-2 bg-gray-50 rounded-lg">
                                <p className="font-medium text-gray-900">{book.title}</p>
                                <p className="text-sm text-gray-600">by {book.author}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {resource.practice_resources?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Practice Resources</h4>
                          <ul className="space-y-1">
                            {resource.practice_resources.map((practice, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {practice}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Analyze skill gaps first</p>
                  <p className="text-sm text-gray-500">Then click "Learning Resources" to get personalized recommendations</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}