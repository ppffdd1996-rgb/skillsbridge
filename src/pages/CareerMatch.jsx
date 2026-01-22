import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Award, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUESTIONS = [
  {
    id: 'interests',
    label: 'What are your main interests and passions?',
    placeholder: 'e.g., technology, creativity, helping people, problem-solving...'
  },
  {
    id: 'skills',
    label: 'What are your strongest skills?',
    placeholder: 'e.g., communication, coding, design, analysis, leadership...'
  },
  {
    id: 'work_style',
    label: 'Describe your ideal work environment and style',
    placeholder: 'e.g., remote, collaborative, independent, fast-paced, structured...'
  },
  {
    id: 'values',
    label: 'What do you value most in a career?',
    placeholder: 'e.g., creativity, stability, impact, learning, flexibility...'
  },
  {
    id: 'strengths',
    label: 'What tasks or activities do you excel at?',
    placeholder: 'e.g., organizing, creating, teaching, building, strategizing...'
  }
];

export default function CareerMatch() {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const allQuestionsAnswered = QUESTIONS.every(q => answers[q.id]?.trim());

  const generateCareerMatches = async () => {
    setLoading(true);
    try {
      const prompt = `Based on the following information about a person, analyze their profile and recommend the top 10 most fitting careers with percentage match scores.

Interests: ${answers.interests}
Skills: ${answers.skills}
Work Style: ${answers.work_style}
Values: ${answers.values}
Strengths: ${answers.strengths}

Provide a detailed analysis with:
1. Top 10 career recommendations ranked by fit
2. Match percentage (0-100) for each career
3. Brief explanation why each career fits
4. Key skills they should develop for each career

Be specific and realistic with career titles and match percentages.`;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">AI Career Matching</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Your Perfect Career Path
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Answer a few questions about yourself, and our AI will analyze your profile to recommend
            the top 10 careers that match your skills, interests, and values.
          </p>
        </div>

        {!results ? (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Tell Us About Yourself</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {QUESTIONS.map((question, idx) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-base">
                    {idx + 1}. {question.label}
                  </Label>
                  <Textarea
                    placeholder={question.placeholder}
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              ))}

              <Button
                onClick={generateCareerMatches}
                disabled={!allQuestionsAnswered || loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Your Profile...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Career Matches
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                Your Top 10 Career Matches
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setResults(null);
                  setAnswers({});
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