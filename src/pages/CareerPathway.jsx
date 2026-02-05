import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  DollarSign,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Users,
  Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";

export default function CareerPathwayPage() {
  const [careerData, setCareerData] = useState(null);
  const [pathways, setPathways] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPathway, setSelectedPathway] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const careerParam = params.get('career');
    
    if (careerParam) {
      try {
        const career = JSON.parse(decodeURIComponent(careerParam));
        setCareerData(career);
        analyzePathways(career);
      } catch (error) {
        console.error('Failed to parse career data:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const analyzePathways = async (career) => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the career path for: ${career.title}

Career Description: ${career.description}

Provide 3-4 different pathways to enter this career, including:
1. Traditional pathway (if college degree is typical)
2. Alternative pathway (bootcamps, certifications, self-taught)
3. Fast-track pathway (if applicable)
4. Career switcher pathway (for people with related experience)

For each pathway, include:
- Pathway name and description
- Required education/training (specific degrees, programs, certifications)
- Time commitment (in months)
- Estimated cost range
- Prerequisites/requirements
- Step-by-step roadmap (4-6 key milestones)
- Expected salary range after completion
- Success rate/difficulty level (1-5)
- Best for (who this pathway suits)

Be specific and realistic. Include actual program names, certification titles, and concrete steps.`,
        response_json_schema: {
          type: "object",
          properties: {
            pathways: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  education: { type: "string" },
                  time_months: { type: "number" },
                  cost_range: { type: "string" },
                  prerequisites: { type: "array", items: { type: "string" } },
                  roadmap: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        step: { type: "string" },
                        duration: { type: "string" },
                        description: { type: "string" }
                      }
                    }
                  },
                  salary_range: { type: "string" },
                  difficulty: { type: "number" },
                  best_for: { type: "string" }
                }
              }
            }
          }
        }
      });
      setPathways(response.pathways);
      if (response.pathways?.length > 0) {
        setSelectedPathway(response.pathways[0]);
      }
    } catch (error) {
      console.error('Pathway analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing career pathways...</p>
        </div>
      </div>
    );
  }

  if (!careerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Career Selected</h2>
            <p className="text-gray-600 mb-4">Please select a career from Career Match first.</p>
            <Button onClick={() => window.location.href = '/CareerMatch'}>
              Go to Career Match
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const difficultyColors = {
    1: 'bg-green-100 text-green-700',
    2: 'bg-green-100 text-green-700',
    3: 'bg-yellow-100 text-yellow-700',
    4: 'bg-orange-100 text-orange-700',
    5: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <a href="/CareerMatch" className="hover:text-indigo-600">Career Match</a>
            <ArrowRight className="w-4 h-4" />
            <span>Pathway Analysis</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{careerData.title}</h1>
          <p className="text-gray-600 max-w-3xl">{careerData.description}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pathway Options Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Pathways</h2>
            {pathways?.map((pathway, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all ${
                    selectedPathway === pathway 
                      ? 'border-indigo-600 shadow-lg' 
                      : 'hover:border-indigo-300'
                  }`}
                  onClick={() => setSelectedPathway(pathway)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{pathway.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{pathway.time_months} months</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>{pathway.cost_range}</span>
                      </div>
                      <Badge className={difficultyColors[pathway.difficulty]}>
                        Difficulty: {pathway.difficulty}/5
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Detailed Pathway View */}
          {selectedPathway && (
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <CardTitle className="text-2xl">{selectedPathway.name}</CardTitle>
                  <p className="text-indigo-100 mt-2">{selectedPathway.description}</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Key Stats */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Education Required</p>
                        <p className="font-semibold text-gray-900">{selectedPathway.education}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expected Salary</p>
                        <p className="font-semibold text-gray-900">{selectedPathway.salary_range}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time Commitment</p>
                        <p className="font-semibold text-gray-900">{selectedPathway.time_months} months</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estimated Cost</p>
                        <p className="font-semibold text-gray-900">{selectedPathway.cost_range}</p>
                      </div>
                    </div>
                  </div>

                  {/* Best For */}
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-start gap-2">
                      <Users className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Best For</p>
                        <p className="text-gray-700">{selectedPathway.best_for}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prerequisites */}
              {selectedPathway.prerequisites?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-600" />
                      Prerequisites
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedPathway.prerequisites.map((prereq, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Roadmap */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Step-by-Step Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedPathway.roadmap?.map((step, idx) => (
                      <div key={idx} className="relative pl-8 pb-6 border-l-2 border-indigo-200 last:pb-0 last:border-l-0">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white"></div>
                        <div className="bg-white rounded-lg p-4 border shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{step.step}</h4>
                            <Badge variant="outline" className="text-xs">
                              {step.duration}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Ready to Start Your Journey?</h3>
                      <p className="text-indigo-100">Build your skill passport and find opportunities</p>
                    </div>
                    <Button 
                      size="lg" 
                      className="bg-white text-indigo-600 hover:bg-indigo-50"
                      onClick={() => window.location.href = '/SkillPassport'}
                    >
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Start Building
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}