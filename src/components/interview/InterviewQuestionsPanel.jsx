import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export default function InterviewQuestionsPanel({
  opportunityTitle,
  jobDescription,
  candidateName,
  candidateSkills,
  candidateExperience,
  interviewType = 'technical'
}) {
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const { data: questionsData, isLoading: loadingQuestions } = useQuery({
    queryKey: ['interviewQuestions', opportunityTitle, candidateName],
    queryFn: () => base44.functions.invoke('generateInterviewQuestions', {
      opportunityTitle,
      jobDescription,
      candidateName,
      candidateSkills,
      candidateExperience,
      interviewType
    }).then(res => res.data),
    enabled: !!jobDescription && !!candidateName,
    staleTime: 1000 * 60 * 30
  });

  const questions = questionsData?.questions || [];
  const currentQuestion = questions[currentQuestionIdx];

  const handleAnalyzeResponse = async () => {
    if (!currentQuestion || !responses[currentQuestionIdx]) return;

    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzeInterviewResponse', {
        question: currentQuestion.question,
        candidateResponse: responses[currentQuestionIdx],
        jobRequirements: jobDescription,
        candidateSkills,
        questionCategory: currentQuestion.category
      });

      if (response.data?.success) {
        setAnalysis(response.data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing response:', error);
      alert('Failed to analyze response');
    } finally {
      setAnalyzing(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category) => {
    const colors = {
      technical: 'bg-blue-100 text-blue-800',
      behavioral: 'bg-purple-100 text-purple-800',
      situational: 'bg-orange-100 text-orange-800',
      'culture-fit': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loadingQuestions) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Generating interview questions...
        </CardContent>
      </Card>
    );
  }

  if (!questions.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          No questions available. Please provide job description and candidate details.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Question {currentQuestionIdx + 1} of {questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Question */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-900 mb-3">
                    {currentQuestion.question}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getCategoryColor(currentQuestion.category)}>
                      {currentQuestion.category.replace('-', ' ')}
                    </Badge>
                    <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Why This Question */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Why this question:</strong> {currentQuestion.why}
              </p>
            </div>

            {/* Response Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate's Response
              </label>
              <Textarea
                value={responses[currentQuestionIdx] || ''}
                onChange={(e) => setResponses(prev => ({
                  ...prev,
                  [currentQuestionIdx]: e.target.value
                }))}
                placeholder="Type the candidate's response here..."
                className="h-32"
              />
            </div>

            {/* AI Analysis */}
            {analysis && (
              <div className="space-y-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">AI Analysis</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Score</p>
                    <p className="text-2xl font-bold text-green-600">{analysis.score}/10</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Skills Match</p>
                    <p className="text-2xl font-bold text-green-600">{analysis.skillsAlignment}%</p>
                  </div>
                </div>

                {analysis.strengths && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Strengths</p>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-green-800">✓ {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.concerns && analysis.concerns.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Areas of Concern</p>
                    <ul className="space-y-1">
                      {analysis.concerns.map((concern, idx) => (
                        <li key={idx} className="text-sm text-red-800">⚠ {concern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.interviewerTips && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Interviewer Tips</p>
                    <ul className="space-y-1">
                      {analysis.interviewerTips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-blue-800">💡 {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.followUpQuestions && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Suggested Follow-ups</p>
                    <ul className="space-y-2">
                      {analysis.followUpQuestions.map((followUp, idx) => (
                        <li key={idx} className="text-sm bg-white p-2 rounded border-l-2 border-blue-400">
                          {followUp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Analyze Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleAnalyzeResponse}
                disabled={!responses[currentQuestionIdx] || analyzing}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Get AI Feedback
                  </>
                )}
              </Button>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1));
                  setAnalysis(null);
                }}
                disabled={currentQuestionIdx === 0}
              >
                ← Previous
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentQuestionIdx(Math.min(questions.length - 1, currentQuestionIdx + 1));
                  setAnalysis(null);
                }}
                disabled={currentQuestionIdx === questions.length - 1}
              >
                Next →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Questions Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Questions ({questions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  currentQuestionIdx === idx
                    ? 'bg-indigo-50 border-indigo-300'
                    : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Q{idx + 1}: {q.question.substring(0, 50)}...
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {q.category}
                      </Badge>
                      {responses[idx] && (
                        <Badge variant="outline" className="text-xs bg-green-100">
                          Answered
                        </Badge>
                      )}
                    </div>
                  </div>
                  {expandedQuestion === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}