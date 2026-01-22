import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Award, TrendingUp, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

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
    } catch (error) {
      console.error('Failed to generate career matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const canProceed = answers[currentQuestion?.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
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
              </p>
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

            <AnimatePresence>
              {results.map((career, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-shadow">
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
                        <div>
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
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}