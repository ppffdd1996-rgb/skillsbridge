import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, XCircle, TrendingUp, Award, 
  ChevronDown, ChevronUp, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EnhancedMatchCard({ match }) {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{match.candidate_name}</CardTitle>
            <p className="text-sm text-gray-600">{match.candidate_email}</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(match.overall_score)}`}>
              {Math.round(match.overall_score)}
            </div>
            <p className="text-xs text-gray-500">Match Score</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Skills</span>
              <span className="text-sm font-semibold">{Math.round(match.skill_score)}</span>
            </div>
            <Progress value={match.skill_score} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Experience</span>
              <span className="text-sm font-semibold">{Math.round(match.experience_score)}</span>
            </div>
            <Progress value={match.experience_score} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Education</span>
              <span className="text-sm font-semibold">{Math.round(match.education_score)}</span>
            </div>
            <Progress value={match.education_score} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Portfolio</span>
              <span className="text-sm font-semibold">{Math.round(match.portfolio_score)}</span>
            </div>
            <Progress value={match.portfolio_score} className="h-2" />
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{match.match_reasoning}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-2">
          {match.matching_skills && match.matching_skills.length > 0 && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              {match.matching_skills.length} Matching Skills
            </Badge>
          )}
          {match.missing_skills && match.missing_skills.length > 0 && (
            <Badge className="bg-red-100 text-red-800">
              <XCircle className="w-3 h-3 mr-1" />
              {match.missing_skills.length} Missing Skills
            </Badge>
          )}
        </div>

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show Details
            </>
          )}
        </Button>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t"
            >
              {/* Matching Skills */}
              {match.matching_skills && match.matching_skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Matching Skills
                  </h4>
                  <div className="space-y-2">
                    {match.matching_skills.map((skill, idx) => (
                      <div key={idx} className="p-2 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{skill.skill}</span>
                          <Badge className="bg-green-100 text-green-800">
                            {skill.candidate_level}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{skill.relevance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {match.missing_skills && match.missing_skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Missing Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {match.missing_skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="border-red-300 text-red-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Strengths */}
              {match.key_strengths && match.key_strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-1">
                    {match.key_strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas of Concern */}
              {match.areas_of_concern && match.areas_of_concern.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-600" />
                    Areas to Consider
                  </h4>
                  <ul className="space-y-1">
                    {match.areas_of_concern.map((concern, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}