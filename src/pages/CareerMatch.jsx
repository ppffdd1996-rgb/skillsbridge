import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Award, TrendingUp, ChevronRight, ChevronLeft, Save, Search, History, Share2, Check, Clock, ChevronDown, ChevronUp, Download, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CareerPathRecommendation from "@/components/career/CareerPathRecommendation";
import SkillGapAnalysis from "@/components/career/SkillGapAnalysis";

const QUESTIONS = [
  {
    id: 'work_preference',
    question: 'Which type of work environment appeals to you most?',
    options: [
      'Working independently with minimal supervision',
      'Collaborating closely with a team',
      'Leading and managing others',
      'A mix of independent and collaborative work'
    ]
  },
  {
    id: 'problem_solving',
    question: 'How do you prefer to solve problems?',
    options: [
      'Through logical analysis and data',
      'Creative brainstorming and innovation',
      'Following established procedures',
      'Trial and error experimentation'
    ]
  },
  {
    id: 'work_pace',
    question: 'What work pace suits you best?',
    options: [
      'Fast-paced with tight deadlines',
      'Steady and predictable',
      'Flexible with varying intensity',
      'Slow and methodical'
    ]
  },
  {
    id: 'primary_interest',
    question: 'Which area interests you most?',
    options: [
      'Technology and innovation',
      'Arts and creativity',
      'Business and entrepreneurship',
      'Science and research',
      'Helping people and social impact',
      'Education and teaching'
    ]
  },
  {
    id: 'skill_strength',
    question: 'Which skills do you excel at?',
    options: [
      'Technical and analytical skills',
      'Communication and interpersonal skills',
      'Creative and artistic abilities',
      'Organizational and planning skills',
      'Leadership and strategic thinking'
    ]
  },
  {
    id: 'work_tasks',
    question: 'What types of tasks energize you?',
    options: [
      'Building and creating tangible products',
      'Analyzing data and finding insights',
      'Designing and crafting visual content',
      'Teaching and mentoring others',
      'Solving complex problems',
      'Organizing and optimizing processes'
    ]
  },
  {
    id: 'career_value',
    question: 'What matters most to you in a career?',
    options: [
      'High earning potential',
      'Work-life balance',
      'Making a positive impact',
      'Creative freedom',
      'Job security and stability',
      'Continuous learning opportunities'
    ]
  },
  {
    id: 'change_comfort',
    question: 'How comfortable are you with change and uncertainty?',
    options: [
      'I thrive in dynamic, changing environments',
      'I prefer some variety but need structure',
      'I prefer stability and routine',
      'I can adapt but prefer consistency'
    ]
  },
  {
    id: 'interaction_preference',
    question: 'How much social interaction do you prefer at work?',
    options: [
      'Constant interaction with people',
      'Regular interaction but also solo time',
      'Minimal interaction, mostly independent',
      'Virtual/remote interactions preferred'
    ]
  },
  {
    id: 'learning_style',
    question: 'How do you learn best?',
    options: [
      'Hands-on practical experience',
      'Reading and self-study',
      'Structured courses and training',
      'Learning from mentors and peers',
      'Visual learning through videos/demos'
    ]
  },
  {
    id: 'work_location',
    question: 'What is your ideal work location?',
    options: [
      'Fully remote from anywhere',
      'Office-based with team presence',
      'Hybrid (mix of office and remote)',
      'Field work or on-location',
      'Flexible, travel-based'
    ]
  },
  {
    id: 'risk_tolerance',
    question: 'What is your tolerance for career risk?',
    options: [
      'High - I want entrepreneurial opportunities',
      'Moderate - I can handle some uncertainty',
      'Low - I prefer stable, established careers',
      'Very low - I need maximum security'
    ]
  },
  {
    id: 'achievement_motivation',
    question: 'What type of achievements motivate you most?',
    options: [
      'Recognition and awards',
      'Financial rewards and bonuses',
      'Personal growth and mastery',
      'Positive impact on others',
      'Creative output and innovation'
    ]
  },
  {
    id: 'detail_focus',
    question: 'How detail-oriented are you?',
    options: [
      'Very detail-focused, I notice everything',
      'Balanced between details and big picture',
      'Big picture thinker, less focused on details',
      'Depends on the task at hand'
    ]
  },
  {
    id: 'conflict_handling',
    question: 'How do you handle workplace conflicts?',
    options: [
      'Direct confrontation and resolution',
      'Mediation and finding compromise',
      'Avoidance and focusing on work',
      'Seeking guidance from others'
    ]
  }
];

export default function CareerMatch() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedCareer, setExpandedCareer] = useState(null);
  const navigate = useNavigate();

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Load saved results if available
        if (userData.career_assessment_results) {
          setResults(userData.career_assessment_results);
        }
      }
    };
    loadUser();
  }, []);

  const handleAnswer = (option) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const generateCareerMatches = async () => {
    setLoading(true);
    try {
      const answersText = QUESTIONS.map(q => 
        `${q.question}\nAnswer: ${answers[q.id] || 'Not answered'}`
      ).join('\n\n');

      const prompt = `Based on this detailed career assessment survey, analyze the person's profile and recommend the top 10 most fitting careers with precise percentage match scores.

SURVEY RESPONSES:
${answersText}

Provide a comprehensive analysis with:
1. Top 10 career recommendations ranked by fit (most suitable first)
2. Precise match percentage (0-100) for each career based on their responses
3. Detailed explanation of why each career fits their profile
4. Specific skills they should develop for each career
5. Consider all aspects: work environment preferences, problem-solving style, values, risk tolerance, and interaction preferences

Be very specific with career titles and provide realistic, well-justified match percentages based on the detailed survey responses.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            careers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  match_percentage: { type: "number" },
                  explanation: { type: "string" },
                  skills_to_develop: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      setResults(response.careers);
      
      // Auto-save if user is logged in
      if (user) {
        await saveResults(response.careers);
      }
    } catch (error) {
      console.error('Failed to generate career matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveResults = async (resultsToSave = results) => {
    if (!user) {
      toast.error('Please sign in to save your results');
      return;
    }

    setSaving(true);
    try {
      await base44.auth.updateMe({
        career_assessment_results: resultsToSave,
        career_assessment_answers: answers,
        career_assessment_date: new Date().toISOString()
      });
      toast.success('Career assessment saved to your profile!');
    } catch (error) {
      console.error('Failed to save results:', error);
      toast.error('Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  const searchCareer = (careerTitle) => {
    navigate(createPageUrl('Opportunities') + `?search=${encodeURIComponent(careerTitle)}`);
  };

  const shareResults = async () => {
    if (!results || !user) return;

    const shareText = `🎯 My Career Match Results:\n\n${results.slice(0, 5).map((career, idx) => 
      `${idx + 1}. ${career.title} - ${career.match_percentage}% match`
    ).join('\n')}\n\nDiscover your perfect career path at SkillsBridge!`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Career Match Results',
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        toast.success('Results copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const canProceed = answers[currentQuestion?.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="assessment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assessment">
              <Sparkles className="w-4 h-4 mr-2" />
              Career Assessment
            </TabsTrigger>
            <TabsTrigger value="skills">
              <Target className="w-4 h-4 mr-2" />
              Skill Gap Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assessment">
        {!results ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">AI Career Matching</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Discover Your Perfect Career Path
              </h1>
              <p className="text-gray-600">
                Answer {QUESTIONS.length} questions for personalized career recommendations
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Question {currentStep + 1} of {QUESTIONS.length}
                </span>
                <span className="text-sm font-medium text-purple-600">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {currentQuestion.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(option)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          answers[currentQuestion.id] === option
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            answers[currentQuestion.id] === option
                              ? 'border-purple-600 bg-purple-600'
                              : 'border-gray-300'
                          }`}>
                            {answers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="text-gray-800">{option}</span>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={generateCareerMatches}
                  disabled={!canProceed || loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Get Results
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
                <Award className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Your Results</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Your Top 10 Career Matches
              </h2>
              <p className="text-gray-600 mb-4">
                Based on your detailed survey responses
                {user?.career_assessment_date && (
                  <span className="block text-sm text-gray-500 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Last saved: {new Date(user.career_assessment_date).toLocaleDateString()}
                  </span>
                )}
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {user && (
                  <>
                    <Button
                      onClick={() => saveResults()}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Results
                        </>
                      )}
                    </Button>
                    <CareerPathRecommendation careerResults={results} />
                    <Button
                      onClick={shareResults}
                      variant="outline"
                      className="border-purple-300 hover:bg-purple-50"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </>
                      )}
                    </Button>
                    <Dialog open={showHistory} onOpenChange={setShowHistory}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <History className="w-4 h-4 mr-2" />
                          View History
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl">Your Career Assessment History</DialogTitle>
                            {user.career_assessment_results && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const text = user.career_assessment_results.map((c, i) => 
                                    `${i + 1}. ${c.title} - ${c.match_percentage}% match\n${c.explanation}\n`
                                  ).join('\n');
                                  navigator.clipboard.writeText(text);
                                  toast.success('Results copied!');
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                              </Button>
                            )}
                          </div>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {user.career_assessment_results && (
                            <div>
                              <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                                <Clock className="w-5 h-5 text-purple-600" />
                                <div>
                                  <p className="font-medium text-gray-900">Latest Assessment</p>
                                  <p className="text-sm text-gray-600">
                                    Completed {new Date(user.career_assessment_date).toLocaleDateString('en-US', { 
                                      month: 'long', 
                                      day: 'numeric', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                {user.career_assessment_results.map((career, idx) => (
                                  <div 
                                    key={idx}
                                    className="border rounded-lg overflow-hidden hover:shadow-md transition-all"
                                  >
                                    <div 
                                      className="p-4 bg-white cursor-pointer"
                                      onClick={() => setExpandedCareer(expandedCareer === idx ? null : idx)}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs">
                                              #{idx + 1}
                                            </Badge>
                                            <h3 className="font-semibold text-gray-900 text-base truncate">
                                              {career.title}
                                            </h3>
                                          </div>
                                          
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className="flex items-center gap-1">
                                              <TrendingUp className="w-4 h-4 text-green-600" />
                                              <span className="text-lg font-bold text-gray-900">
                                                {career.match_percentage}%
                                              </span>
                                              <span className="text-xs text-gray-500">match</span>
                                            </div>
                                            <Progress value={career.match_percentage} className="h-2 flex-1 max-w-[200px]" />
                                          </div>
                                          
                                          {expandedCareer !== idx && (
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                              {career.explanation}
                                            </p>
                                          )}
                                        </div>
                                        
                                        <div className="flex flex-col gap-2 items-end">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              searchCareer(career.title);
                                              setShowHistory(false);
                                            }}
                                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                          >
                                            <Search className="w-4 h-4 mr-1" />
                                            Search Jobs
                                          </Button>
                                          {expandedCareer === idx ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                          ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {expandedCareer === idx && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="border-t bg-gray-50 p-4"
                                      >
                                        <div className="space-y-4">
                                          <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                              <Award className="w-4 h-4 text-purple-600" />
                                              Why This Career Fits You
                                            </h4>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                              {career.explanation}
                                            </p>
                                          </div>
                                          
                                          {career.skills_to_develop?.length > 0 && (
                                            <div>
                                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                                Skills to Develop
                                              </h4>
                                              <div className="flex flex-wrap gap-2">
                                                {career.skills_to_develop.map((skill, skillIdx) => (
                                                  <Badge 
                                                    key={skillIdx} 
                                                    variant="outline" 
                                                    className="text-xs bg-white"
                                                  >
                                                    {skill}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex gap-2 mt-4 pt-4 border-t">
                                <Button 
                                  className="flex-1"
                                  onClick={() => {
                                    setResults(user.career_assessment_results);
                                    setShowHistory(false);
                                  }}
                                >
                                  View Full Results Page
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setResults(null);
                                    setAnswers({});
                                    setCurrentStep(0);
                                    setShowHistory(false);
                                  }}
                                >
                                  Retake Assessment
                                </Button>
                              </div>
                            </div>
                          )}
                          {!user.career_assessment_results && (
                            <div className="text-center py-12 text-gray-500">
                              <History className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                              <p className="text-lg font-medium text-gray-700 mb-1">No saved assessments yet</p>
                              <p className="text-sm text-gray-500">Complete the career assessment to see your results here</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setResults(null);
                    setAnswers({});
                    setCurrentStep(0);
                  }}
                >
                  Start Over
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {results.map((career, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => searchCareer(career.title)}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                              #{idx + 1}
                            </Badge>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {career.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-2xl font-bold text-gray-900">
                              {career.match_percentage}%
                            </span>
                            <span className="text-sm text-gray-500">match</span>
                          </div>
                        </div>
                      </div>

                      <Progress value={career.match_percentage} className="mb-4 h-2" />

                      <p className="text-gray-700 mb-4">{career.explanation}</p>

                      {career.skills_to_develop?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            Skills to develop:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {career.skills_to_develop.map((skill, skillIdx) => (
                              <Badge key={skillIdx} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-purple-600 text-sm font-medium group-hover:gap-3 transition-all">
                        <Search className="w-4 h-4" />
                        Click to search for {career.title} opportunities
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
          </TabsContent>

          <TabsContent value="skills">
            <SkillGapAnalysis />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}