import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, TrendingUp, BookOpen, ExternalLink, Users, 
  Loader2, CheckCircle, AlertTriangle, Clock, Sparkles,
  ArrowRight, GraduationCap, Briefcase
} from "lucide-react";
import { toast } from 'sonner';

export default function SkillGapAnalysis() {
  const [targetRole, setTargetRole] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resources, setResources] = useState(null);

  const analyzeGaps = async () => {
    if (!targetRole.trim()) {
      toast.error('Please enter a target role');
      return;
    }

    setAnalyzing(true);
    try {
      const user = await base44.auth.me();
      const response = await base44.functions.invoke('analyzeSkillGaps', {
        target_role: targetRole,
        user_profile: {
          bio: user.bio,
          years_experience: user.years_experience,
          industry: user.industry
        }
      });
      setAnalysis(response.data.analysis);
      toast.success('Skill gap analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze skill gaps');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getRecommendations = async () => {
    if (!analysis) return;

    const skillsToLearn = [
      ...analysis.critical_gaps.map(g => g.skill),
      ...analysis.desirable_skills.slice(0, 3).map(s => s.skill)
    ];

    setLoadingResources(true);
    try {
      const response = await base44.functions.invoke('recommendLearningResources', {
        skills_to_learn: skillsToLearn,
        learning_style: 'mixed',
        time_commitment: 'moderate'
      });
      setResources(response.data);
      toast.success('Learning resources loaded!');
    } catch (error) {
      toast.error('Failed to load recommendations');
      console.error(error);
    } finally {
      setLoadingResources(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            AI Skill Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Discover what skills you need to land your dream role and get personalized learning recommendations.
          </p>
          <div className="flex gap-2">
            <Input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Enter target role (e.g., Senior React Developer, Product Designer)"
              onKeyPress={(e) => e.key === 'Enter' && analyzeGaps()}
              className="flex-1"
            />
            <Button onClick={analyzeGaps} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analyze
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          {/* Readiness Score */}
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Readiness Score</h3>
                  <p className="text-white/90">{analysis.summary}</p>
                </div>
                <div className="text-5xl font-bold">{analysis.readiness_score}%</div>
              </div>
              <Progress value={analysis.readiness_score} className="h-3 bg-white/20" />
              <p className="text-sm text-white/80 mt-2">
                ⏱️ Estimated time to job-ready: {analysis.time_to_ready}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="gaps" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="gaps">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Skill Gaps
              </TabsTrigger>
              <TabsTrigger value="strengths">
                <CheckCircle className="w-4 h-4 mr-2" />
                Strengths
              </TabsTrigger>
              <TabsTrigger value="roadmap">
                <Clock className="w-4 h-4 mr-2" />
                Roadmap
              </TabsTrigger>
              <TabsTrigger value="resources">
                <BookOpen className="w-4 h-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gaps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Critical Skill Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.critical_gaps.sort((a, b) => a.priority - b.priority).map((gap, idx) => (
                      <div key={idx} className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{gap.skill}</h4>
                          <Badge variant="destructive">Priority {gap.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{gap.why_needed}</p>
                        <p className="text-xs text-gray-600">Importance: {gap.importance}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {analysis.improvement_areas?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-amber-600">Skills to Level Up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.improvement_areas.map((area, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{area.skill}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{area.current_level}</Badge>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <Badge>{area.target_level}</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{area.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysis.desirable_skills?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Nice-to-Have Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                      {analysis.desirable_skills.map((skill, idx) => (
                        <div key={idx} className="p-3 border rounded-lg bg-blue-50">
                          <h4 className="font-medium text-gray-900 mb-1">{skill.skill}</h4>
                          <p className="text-xs text-gray-600">{skill.benefit}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="strengths" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Your Matching Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.matching_skills?.map((skill, idx) => (
                      <div key={idx} className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{skill.skill}</h4>
                          <Badge variant="outline" className="bg-white">{skill.current_level}</Badge>
                        </div>
                        <p className="text-sm text-gray-700">{skill.why_valuable}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roadmap" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Your Learning Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analysis.learning_roadmap?.map((phase, idx) => (
                      <div key={idx} className="relative pl-8 pb-6 border-l-2 border-indigo-200 last:border-0">
                        <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg text-gray-900">{phase.phase}</h4>
                            <Badge variant="outline">{phase.duration}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {phase.focus_areas?.map((area, aIdx) => (
                              <Badge key={aIdx} className="bg-indigo-100 text-indigo-700">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              {!resources ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">Get personalized learning resource recommendations</p>
                    <Button onClick={getRecommendations} disabled={loadingResources}>
                      {loadingResources ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Load Recommendations
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {resources.recommendations.resources_by_skill?.map((skillRes, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          {skillRes.skill}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Courses */}
                        {skillRes.courses?.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">📚 Courses</h4>
                            <div className="space-y-2">
                              {skillRes.courses.map((course, cIdx) => (
                                <a
                                  key={cIdx}
                                  href={course.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{course.name}</h5>
                                    <p className="text-sm text-gray-600">{course.platform} • {course.duration}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline">{course.price}</Badge>
                                      {course.rating && <span className="text-xs text-gray-500">⭐ {course.rating}</span>}
                                    </div>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Free Resources */}
                        {skillRes.free_resources?.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">🆓 Free Resources</h4>
                            <div className="grid md:grid-cols-2 gap-2">
                              {skillRes.free_resources.map((res, rIdx) => (
                                <a
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h5 className="font-medium text-sm text-gray-900">{res.title}</h5>
                                      <p className="text-xs text-gray-600 mt-1">{res.type}</p>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Practice Platforms */}
                        {skillRes.practice_platforms?.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">💪 Practice Here</h4>
                            <div className="flex flex-wrap gap-2">
                              {skillRes.practice_platforms.map((platform, pIdx) => (
                                <a
                                  key={pIdx}
                                  href={platform.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                                >
                                  {platform.name}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {/* Practice Opportunities */}
                  {resources.practice_opportunities?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-green-600" />
                          Practice Opportunities on SkillsBridge
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                          Build these skills with real projects on our platform:
                        </p>
                        <div className="space-y-3">
                          {resources.practice_opportunities.map((opp, idx) => (
                            <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50">
                              <h5 className="font-medium text-gray-900">{opp.title}</h5>
                              <p className="text-sm text-gray-600">{opp.company}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {opp.skills?.slice(0, 3).map((skill, sIdx) => (
                                  <Badge key={sIdx} variant="outline">{skill}</Badge>
                                ))}
                                {opp.has_trial && <Badge variant="outline" className="bg-green-50">Trial Task</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}