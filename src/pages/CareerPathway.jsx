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
  Lightbulb,
  MapPin,
  Globe,
  Star,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

export default function CareerPathwayPage() {
  const [careerData, setCareerData] = useState(null);
  const [pathways, setPathways] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPathway, setSelectedPathway] = useState(null);
  const [enhancedRecommendations, setEnhancedRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualFilters, setManualFilters] = useState({
    state: '',
    maxCost: '',
    maxDuration: '',
    format: '',
    ranking: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const careerParam = params.get('career');
    
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUserLocation(u.location);
      }
    };
    loadUser();
    
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

  const getEnhancedRecommendations = async (pathway, useManualFilters = false) => {
    setLoadingRecommendations(true);
    try {
      const locationContext = useManualFilters && manualFilters.state 
        ? `User preferred state/location: ${manualFilters.state}` 
        : userLocation ? `User location: ${userLocation}` : 'User location not available';
      
      const filterContext = useManualFilters ? `
FILTERS REQUESTED:
- State/Location: ${manualFilters.state || 'Any'}
- Maximum Cost: ${manualFilters.maxCost || 'Any budget'}
- Maximum Duration: ${manualFilters.maxDuration || 'Any duration'}
- Format Preference: ${manualFilters.format || 'Any format (online, in-person, hybrid)'}
- Ranking/Quality: ${manualFilters.ranking || 'Any ranking'}

Please filter and prioritize results based on these preferences.
` : '';
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide detailed, specific program recommendations for this career pathway:

PATHWAY: ${pathway.name}
CAREER: ${careerData.title}
EDUCATION TYPE: ${pathway.education}
${locationContext}
${filterContext}

Provide comprehensive recommendations:

1. TOP NATIONAL PROGRAMS (if applicable):
   - List 5-10 specific, highly-ranked institutions/programs
   - Include rankings, acceptance rates, tuition costs
   - Notable strengths of each program
   
2. LOCAL/REGIONAL OPTIONS (if user location provided):
   - Programs within 50-100 miles of user location
   - Quality ratings and affordability
   
3. ONLINE/REMOTE OPTIONS:
   - Best online programs or bootcamps
   - Flexibility and cost benefits
   
4. SPECIFIC RESOURCES:
   - Exact course names, certification titles
   - Websites and application links
   - Community resources (Discord, Reddit, etc.)
   
5. FINANCIAL AID:
   - Scholarship opportunities
   - Income share agreements
   - Employer sponsorship options
   
Be extremely specific with names, rankings, and actionable details.`,
        response_json_schema: {
          type: "object",
          properties: {
            national_programs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  institution: { type: "string" },
                  ranking: { type: "string" },
                  tuition: { type: "string" },
                  acceptance_rate: { type: "string" },
                  strengths: { type: "string" },
                  website: { type: "string" }
                }
              }
            },
            local_programs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  institution: { type: "string" },
                  distance: { type: "string" },
                  tuition: { type: "string" },
                  rating: { type: "string" },
                  website: { type: "string" }
                }
              }
            },
            online_options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  provider: { type: "string" },
                  format: { type: "string" },
                  duration: { type: "string" },
                  cost: { type: "string" },
                  job_placement_rate: { type: "string" },
                  website: { type: "string" }
                }
              }
            },
            resources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  link: { type: "string" }
                }
              }
            },
            financial_aid: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  eligibility: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setEnhancedRecommendations(response);
    } catch (error) {
      console.error('Failed to get enhanced recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
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
                  onClick={() => {
                    setSelectedPathway(pathway);
                    setEnhancedRecommendations(null);
                  }}
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

              {/* Enhanced Recommendations */}
              <Card className="border-2 border-indigo-300">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      AI-Powered Program Recommendations
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => getEnhancedRecommendations(selectedPathway)}
                        disabled={loadingRecommendations}
                        className="bg-indigo-600 hover:bg-indigo-700 flex-1"
                      >
                        {loadingRecommendations ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                            </motion.div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4 mr-2" />
                            Get Recommendations
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowManualInput(true)}
                        disabled={loadingRecommendations}
                        variant="outline"
                        className="border-indigo-300"
                      >
                        Custom Search
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {enhancedRecommendations && (
                  <CardContent className="pt-6 space-y-6">
                    {/* National Programs */}
                    {enhancedRecommendations.national_programs?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          Top-Rated National Programs
                        </h3>
                        <div className="space-y-3">
                          {enhancedRecommendations.national_programs.map((program, idx) => (
                            <Card key={idx} className="border-l-4 border-l-yellow-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{program.name}</h4>
                                    <p className="text-sm text-gray-600">{program.institution}</p>
                                  </div>
                                  {program.website && (
                                    <a 
                                      href={program.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:text-indigo-700"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                  {program.ranking && (
                                    <Badge variant="outline" className="justify-start">
                                      Rank: {program.ranking}
                                    </Badge>
                                  )}
                                  {program.tuition && (
                                    <Badge variant="outline" className="justify-start">
                                      {program.tuition}
                                    </Badge>
                                  )}
                                  {program.acceptance_rate && (
                                    <Badge variant="outline" className="justify-start">
                                      Accept: {program.acceptance_rate}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700">{program.strengths}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Local Programs */}
                    {enhancedRecommendations.local_programs?.length > 0 && userLocation && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-green-600" />
                          Programs Near You
                        </h3>
                        <div className="space-y-3">
                          {enhancedRecommendations.local_programs.map((program, idx) => (
                            <Card key={idx} className="border-l-4 border-l-green-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{program.name}</h4>
                                    <p className="text-sm text-gray-600">{program.institution}</p>
                                  </div>
                                  {program.website && (
                                    <a 
                                      href={program.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                                <div className="flex gap-2 text-sm">
                                  <Badge variant="outline">{program.distance}</Badge>
                                  <Badge variant="outline">{program.tuition}</Badge>
                                  {program.rating && <Badge variant="outline">Rating: {program.rating}</Badge>}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Online Options */}
                    {enhancedRecommendations.online_options?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Globe className="w-5 h-5 text-blue-600" />
                          Online & Remote Programs
                        </h3>
                        <div className="space-y-3">
                          {enhancedRecommendations.online_options.map((program, idx) => (
                            <Card key={idx} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{program.name}</h4>
                                    <p className="text-sm text-gray-600">{program.provider}</p>
                                  </div>
                                  {program.website && (
                                    <a 
                                      href={program.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                                <div className="flex gap-2 text-sm flex-wrap">
                                  <Badge variant="outline">{program.format}</Badge>
                                  <Badge variant="outline">{program.duration}</Badge>
                                  <Badge variant="outline">{program.cost}</Badge>
                                  {program.job_placement_rate && (
                                    <Badge className="bg-green-100 text-green-700">
                                      {program.job_placement_rate} placement
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resources */}
                    {enhancedRecommendations.resources?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                          Additional Resources
                        </h3>
                        <div className="grid gap-2">
                          {enhancedRecommendations.resources.map((resource, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                              <Badge className="bg-purple-600">{resource.type}</Badge>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{resource.name}</p>
                                <p className="text-sm text-gray-600">{resource.description}</p>
                                {resource.link && (
                                  <a 
                                    href={resource.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 mt-1"
                                  >
                                    Visit <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financial Aid */}
                    {enhancedRecommendations.financial_aid?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                          Financial Aid Options
                        </h3>
                        <div className="space-y-2">
                          {enhancedRecommendations.financial_aid.map((aid, idx) => (
                            <Card key={idx} className="bg-emerald-50 border-emerald-200">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-2">
                                  <Badge className="bg-emerald-600">{aid.type}</Badge>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{aid.name}</h4>
                                    <p className="text-sm text-gray-700 mb-1">{aid.description}</p>
                                    {aid.eligibility && (
                                      <p className="text-xs text-gray-600">Eligibility: {aid.eligibility}</p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
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