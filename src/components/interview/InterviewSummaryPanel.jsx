import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function InterviewSummaryPanel({
  candidateName,
  opportunityTitle,
  jobRequirements,
  candidateSkills,
  interviewNotes,
  questionsAndAnswers = []
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(interviewNotes || '');

  const handleGenerateSummary = async () => {
    if (!notes.trim()) {
      alert('Please add interview notes');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateInterviewSummary', {
        candidateName,
        opportunityTitle,
        jobRequirements,
        candidateSkills,
        interviewNotes: notes,
        questionsAndAnswers
      });

      if (response.data?.success) {
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  if (summary) {
    return (
      <div className="space-y-4">
        {/* Overall Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Overall Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <p className="text-gray-900 text-base leading-relaxed">
                {summary.overallAssessment}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Recommendation</p>
                <p className="text-3xl font-bold text-yellow-600">{summary.recommendedRating}/5</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Reason</p>
                <p className="text-sm text-gray-600">{summary.ratingJustification}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strengths */}
        {summary.strengths && summary.strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.strengths.map((strength, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-green-600 font-bold">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Weaknesses */}
        {summary.weaknesses && summary.weaknesses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-red-600">⚠</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Skills Match */}
        {summary.skillsMatched && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Skills Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary.skillsMatched.matched && summary.skillsMatched.matched.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-2">✓ Matched Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.skillsMatched.matched.map((skill, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {summary.skillsMatched.gaps && summary.skillsMatched.gaps.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-2">✗ Skill Gaps</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.skillsMatched.gaps.map((skill, idx) => (
                      <Badge key={idx} className="bg-red-100 text-red-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {summary.skillsMatched.canLearn && summary.skillsMatched.canLearn.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-blue-700 mb-2">🎓 Can Learn</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.skillsMatched.canLearn.map((skill, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Key Insights */}
        {summary.keyInsights && summary.keyInsights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.keyInsights.map((insight, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-indigo-600 font-bold">{idx + 1}.</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {summary.recommendations && summary.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-green-600">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Red Flags */}
        {summary.redFlags && summary.redFlags.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">Red Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.redFlags.map((flag, idx) => (
                  <li key={idx} className="text-sm text-red-700 flex gap-2">
                    <span>🚩</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          onClick={() => setSummary(null)}
          className="w-full"
        >
          Back to Notes
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Interview Summary & Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            Add your interview notes and click analyze to get AI-powered insights, skill analysis, and recommendations.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interview Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your interview notes here... Include observations, responses, concerns, strengths, etc."
            className="h-48"
          />
        </div>

        <Button
          onClick={handleGenerateSummary}
          disabled={loading || !notes.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Interview...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Summary & Insights
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}