import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, FileText, MessageSquare, CheckCircle, AlertCircle, TrendingUp, Target } from "lucide-react";
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function InterviewAssistant({ application, onClose }) {
  const [activeTab, setActiveTab] = useState('questions');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [interviewGuide, setInterviewGuide] = useState(null);
  const [interviewNotes, setInterviewNotes] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const generateQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const response = await base44.functions.invoke('generateInterviewQuestions', {
        application_id: application.id
      });
      setInterviewGuide(response.data.interview_guide);
      toast.success('Interview questions generated!');
    } catch (error) {
      toast.error('Failed to generate questions');
      console.error('Error:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const analyzeInterview = async () => {
    if (!interviewNotes.trim() || interviewNotes.length < 50) {
      toast.error('Please enter more detailed interview notes');
      return;
    }

    setLoadingAnalysis(true);
    try {
      const response = await base44.functions.invoke('analyzeInterview', {
        application_id: application.id,
        interview_notes: interviewNotes
      });
      setAnalysis(response.data.analysis);
      toast.success('Interview analyzed!');
    } catch (error) {
      toast.error('Failed to analyze interview');
      console.error('Error:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const recommendationConfig = {
    strong_hire: { label: 'Strong Hire', color: 'bg-green-600', icon: '🌟' },
    hire: { label: 'Hire', color: 'bg-green-500', icon: '✅' },
    maybe: { label: 'Maybe', color: 'bg-yellow-500', icon: '🤔' },
    no_hire: { label: 'No Hire', color: 'bg-red-500', icon: '❌' }
  };

  const QuestionSection = ({ title, questions, icon: Icon }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Icon className="w-5 h-5 text-indigo-600" />
        {title}
      </h3>
      <div className="space-y-3">
        {questions?.map((q, idx) => (
          <Collapsible key={idx}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{q.question}</p>
                      {q.purpose && (
                        <p className="text-sm text-gray-600 mt-1">Purpose: {q.purpose}</p>
                      )}
                      {q.assessing && (
                        <p className="text-sm text-indigo-600 mt-1">Assessing: {q.assessing}</p>
                      )}
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {q.followups && q.followups.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Follow-up Probes:</p>
                      <ul className="space-y-1">
                        {q.followups.map((f, fidx) => (
                          <li key={fidx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-indigo-600 mt-0.5">→</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {q.red_flags && q.red_flags.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-red-700 mb-1">🚩 Red Flags to Watch:</p>
                      <ul className="space-y-1">
                        {q.red_flags.map((flag, fidx) => (
                          <li key={fidx} className="text-sm text-red-600">• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {q.ideal_response_hints && q.ideal_response_hints.length > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-700 mb-1">💡 What to Look For:</p>
                      <ul className="space-y-1">
                        {q.ideal_response_hints.map((hint, hidx) => (
                          <li key={hidx} className="text-sm text-green-600">• {hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {q.concern && (
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="text-sm text-amber-700"><strong>Addresses concern:</strong> {q.concern}</p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            AI Interview Assistant
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {application.applicant_name} - {application.opportunity_id}
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">
              <FileText className="w-4 h-4 mr-2" />
              Interview Questions
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <TrendingUp className="w-4 h-4 mr-2" />
              Interview Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4 mt-6">
            {!interviewGuide ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    Generate AI-powered interview questions tailored to this candidate
                  </p>
                  <Button onClick={generateQuestions} disabled={loadingQuestions} className="gap-2">
                    {loadingQuestions ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Interview Guide
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <QuestionSection 
                  title="Warm-up Questions" 
                  questions={interviewGuide.warmup_questions}
                  icon={MessageSquare}
                />
                <QuestionSection 
                  title="Technical Questions" 
                  questions={interviewGuide.technical_questions}
                  icon={Target}
                />
                <QuestionSection 
                  title="Behavioral Questions" 
                  questions={interviewGuide.behavioral_questions}
                  icon={CheckCircle}
                />
                <QuestionSection 
                  title="Scenario-Based Questions" 
                  questions={interviewGuide.scenario_questions}
                  icon={AlertCircle}
                />
                {interviewGuide.gap_analysis_questions?.length > 0 && (
                  <QuestionSection 
                    title="Gap Analysis Questions" 
                    questions={interviewGuide.gap_analysis_questions}
                    icon={AlertCircle}
                  />
                )}
                <QuestionSection 
                  title="Closing Questions" 
                  questions={interviewGuide.closing_questions}
                  icon={MessageSquare}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Interview Notes</CardTitle>
                <CardDescription>
                  Paste your interview notes or transcript for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Enter detailed interview notes here... Include candidate responses, observations, and any relevant details from the conversation."
                  rows={8}
                  className="font-mono text-sm"
                />
                <Button onClick={analyzeInterview} disabled={loadingAnalysis} className="gap-2">
                  {loadingAnalysis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze Interview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {analysis && (
              <div className="space-y-4">
                {/* Recommendation */}
                <Card className={`${recommendationConfig[analysis.recommendation]?.color || 'bg-gray-600'} text-white`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        {recommendationConfig[analysis.recommendation]?.icon}
                        {recommendationConfig[analysis.recommendation]?.label}
                      </h3>
                      <Badge className="bg-white/20 text-white text-lg px-4 py-1">
                        {analysis.overall_score}/100
                      </Badge>
                    </div>
                    <p className="text-white/90">{analysis.recommendation_reasoning}</p>
                  </CardContent>
                </Card>

                {/* Executive Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{analysis.executive_summary}</p>
                  </CardContent>
                </Card>

                {/* Assessment Scores */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Technical Skills</p>
                      <p className="text-3xl font-bold text-indigo-600">{analysis.technical_assessment?.score}/100</p>
                      <p className="text-xs text-gray-500 mt-2">{analysis.technical_assessment?.details}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Cultural Fit</p>
                      <p className="text-3xl font-bold text-purple-600">{analysis.cultural_fit?.score}/100</p>
                      <p className="text-xs text-gray-500 mt-2">{analysis.cultural_fit?.details}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Communication</p>
                      <p className="text-3xl font-bold text-blue-600">{analysis.communication_skills?.score}/100</p>
                      <p className="text-xs text-gray-500 mt-2">{analysis.communication_skills?.details}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Strengths & Concerns */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Key Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.key_strengths?.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <span className="text-green-600 mt-0.5">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-amber-600 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Areas of Concern
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.areas_of_concern?.map((concern, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <span className="text-amber-600 mt-0.5">⚠</span>
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Next Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.next_steps?.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}