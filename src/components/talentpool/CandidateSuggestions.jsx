import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CandidateSuggestions({ opportunityId, opportunityTitle, requiredSkills, experienceLevel }) {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['candidateSuggestions', opportunityId],
    queryFn: () => base44.functions.invoke('suggestCandidatesForOpportunity', {
      opportunityId,
      opportunityTitle,
      requiredSkills,
      experienceLevel
    }).then(res => res.data),
    enabled: !!opportunityId && !!requiredSkills && requiredSkills.length > 0,
    staleTime: 1000 * 60 * 5
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Finding matching candidates...
        </CardContent>
      </Card>
    );
  }

  const candidates = suggestions?.suggestedCandidates || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Suggested Candidates ({candidates.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {candidates.length > 0 ? (
          <div className="space-y-4">
            {candidates.map((candidate, idx) => (
              <div key={candidate.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{idx + 1}. {candidate.name}</h3>
                      {candidate.matchScore >= 80 && (
                        <Badge className="bg-green-100 text-green-800">Excellent Match</Badge>
                      )}
                      {candidate.matchScore >= 60 && candidate.matchScore < 80 && (
                        <Badge className="bg-blue-100 text-blue-800">Good Match</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{candidate.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">{candidate.matchScore}%</div>
                    <p className="text-xs text-gray-500">Match Score</p>
                  </div>
                </div>

                {/* Match Score Progress */}
                <div className="mb-3">
                  <Progress value={candidate.matchScore} className="h-2" />
                </div>

                {/* Matched Skills */}
                {candidate.matchedSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Matched Skills ({candidate.matchedSkills.length}/{requiredSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.matchedSkills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs bg-green-50">
                          ✓ {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {candidate.missingSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Skill Gaps ({candidate.missingSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.missingSkills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs bg-red-50 text-red-800">
                          ✗ {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Candidate Details */}
                <div className="grid md:grid-cols-3 gap-3 text-sm mb-3 p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Experience</p>
                    <p className="font-medium capitalize">{candidate.experienceLevel} ({candidate.yearsExperience || 0} yrs)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Interview Rating</p>
                    <p className="font-medium">
                      {candidate.interviewRating ? `${candidate.interviewRating}/5` : 'Not rated'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Availability</p>
                    <p className="font-medium capitalize">{candidate.availability || 'Unknown'}</p>
                  </div>
                </div>

                {/* Tags */}
                {candidate.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.tags.map(tag => (
                        <Badge key={tag} className="text-xs bg-purple-100 text-purple-800">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Profile
                  </Button>
                  <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                    Send Invitation
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No suitable candidates found in your talent pools.</p>
            <p className="text-sm mt-1">Try expanding your search criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}