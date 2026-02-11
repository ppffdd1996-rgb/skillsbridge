import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Target } from 'lucide-react';
import MatchConfigurator from '@/components/matching/MatchConfigurator';
import EnhancedMatchCard from '@/components/matching/EnhancedMatchCard';
import { toast } from 'sonner';

export default function EnhancedMatchingPage() {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [config, setConfig] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [matches, setMatches] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date'),
    enabled: !!user
  });

  const analyzeMatches = async () => {
    if (!selectedOpportunity) {
      toast.error('Please select an opportunity');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('calculateEnhancedMatches', {
        opportunity_id: selectedOpportunity
      });
      
      setMatches(response.data);
      toast.success('Match analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze matches');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to access enhanced matching</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            AI-Enhanced Matching
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced candidate matching with customizable parameters and AI-powered insights
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Select Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedOpportunity} onValueChange={setSelectedOpportunity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an opportunity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunities.map(opp => (
                      <SelectItem key={opp.id} value={opp.id}>
                        {opp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={analyzeMatches}
                  disabled={!selectedOpportunity || analyzing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Matches
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {selectedOpportunity && (
              <MatchConfigurator
                opportunityId={selectedOpportunity}
                onConfigChange={setConfig}
                initialConfig={config}
              />
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {analyzing ? (
              <div className="text-center py-20">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600 mb-4" />
                <p className="text-gray-600">Analyzing candidates with AI...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
              </div>
            ) : matches ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Top Matches</CardTitle>
                      <span className="text-sm text-gray-600">
                        {matches.total_candidates} candidates analyzed
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {matches.top_matches.map((match, idx) => (
                        <div key={match.candidate_email} className="relative">
                          {idx < 3 && (
                            <div className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm z-10">
                              {idx + 1}
                            </div>
                          )}
                          <EnhancedMatchCard match={match} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Select an opportunity and configure parameters</p>
                <p className="text-sm text-gray-500 mt-2">
                  Then click "Analyze Matches" to see AI-powered results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}