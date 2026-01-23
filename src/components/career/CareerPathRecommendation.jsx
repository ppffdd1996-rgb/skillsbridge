import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Sparkles, TrendingUp, Clock, Award, Target, ArrowRight, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CareerPathRecommendation({ careerResults }) {
  const [open, setOpen] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [careerPath, setCareerPath] = useState(null);
  const navigate = useNavigate();

  const generatePath = async () => {
    if (!targetRole.trim()) {
      toast.error('Please enter a target role');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateCareerPath', {
        target_role: targetRole,
        career_results: careerResults
      });

      setCareerPath(response.data);
      toast.success('Career path generated!');
    } catch (error) {
      toast.error('Failed to generate career path');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-purple-300 hover:bg-purple-50">
          <TrendingUp className="w-4 h-4" />
          Get Career Path
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">AI Career Path Recommendations</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {!careerPath ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  What role do you want to work towards?
                </label>
                <div className="flex gap-2">
                  <Input
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
                    onKeyPress={(e) => e.key === 'Enter' && generatePath()}
                  />
                  <Button onClick={generatePath} disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Path
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-700">
                    💡 Our AI will analyze your current skills and create a personalized roadmap showing:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      Step-by-step career progression
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      Skills to develop at each stage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      Timeline and experience needed
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      Relevant opportunities on the platform
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview */}
              <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Your Path to {targetRole}</h3>
                  </div>
                  <p className="text-indigo-100 mb-4">{careerPath.overall_timeline}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-indigo-200 mb-2">Critical Skills to Master</p>
                      <div className="flex flex-wrap gap-2">
                        {careerPath.critical_skills?.slice(0, 4).map((skill, idx) => (
                          <Badge key={idx} className="bg-white/20 text-white border-white/30">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-indigo-200 mb-2">Start Here</p>
                      <p className="text-sm text-white">{careerPath.immediate_next_steps?.[0]}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Career Path Steps */}
              <div className="space-y-4">
                {careerPath.career_path?.map((step, idx) => (
                  <div key={idx} className="relative">
                    {idx < careerPath.career_path.length - 1 && (
                      <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-indigo-600 to-purple-600 z-0" />
                    )}
                    
                    <Card className="relative z-10 hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                              {step.step_number}
                            </div>
                            <div>
                              <CardTitle className="text-xl">{step.role_title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">{step.timeline}</span>
                              </div>
                            </div>
                          </div>
                          {idx < careerPath.career_path.length - 1 && (
                            <ArrowRight className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-gray-700">{step.description}</p>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-indigo-600" />
                            Skills to Develop
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {step.skills_needed?.map((skill, sidx) => (
                              <Badge key={sidx} variant="outline" className="bg-indigo-50 text-indigo-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {step.certifications && step.certifications.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Award className="w-4 h-4 text-purple-600" />
                              Certifications & Education
                            </h4>
                            <ul className="space-y-1">
                              {step.certifications.map((cert, cidx) => (
                                <li key={cidx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-purple-600 mt-0.5">•</span>
                                  {cert}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Key Actions</h4>
                          <ul className="space-y-1">
                            {step.key_actions?.map((action, aidx) => (
                              <li key={aidx} className="text-sm text-gray-700 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {step.opportunities && step.opportunities.length > 0 && (
                          <div className="pt-3 border-t">
                            <h4 className="font-semibold text-gray-900 mb-2">Relevant Opportunities</h4>
                            <div className="space-y-2">
                              {step.opportunities.map((opp, oidx) => (
                                <button
                                  key={oidx}
                                  onClick={() => {
                                    navigate(createPageUrl('Opportunities') + `?search=${encodeURIComponent(opp.title)}`);
                                    setOpen(false);
                                  }}
                                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 truncate">{opp.title}</p>
                                      {opp.company && (
                                        <p className="text-sm text-gray-600">{opp.company}</p>
                                      )}
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Next Steps */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    Immediate Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {careerPath.immediate_next_steps?.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={() => setCareerPath(null)} variant="outline">
                  Generate Another Path
                </Button>
                <Button onClick={() => navigate(createPageUrl('Opportunities'))} className="gap-2">
                  Browse All Opportunities
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}