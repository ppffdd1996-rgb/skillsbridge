import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, AlertCircle, Code, MessageSquare, Shield, Sparkles } from "lucide-react";
import { toast } from 'sonner';

const BEHAVIORAL_QUESTIONS = [
  "Tell me about a time when you faced a significant challenge at work. How did you handle it?",
  "Describe a situation where you had to work with a difficult team member. What was your approach?",
  "Give an example of when you had to learn something new quickly. How did you approach it?",
  "Tell me about a project you're most proud of and why."
];

export default function SkillValidation({ application, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('technical');
  
  // Technical Assessment
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [submission, setSubmission] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  
  // Behavioral
  const [behavioralResponses, setBehavioralResponses] = useState(
    BEHAVIORAL_QUESTIONS.map(q => ({ question: q, answer: '' }))
  );
  const [analyzingBehavioral, setAnalyzingBehavioral] = useState(false);
  const [behavioralAnalysis, setBehavioralAnalysis] = useState(null);
  
  // Skill Verification
  const [verifyingSkill, setVerifyingSkill] = useState(false);
  const [skillToVerify, setSkillToVerify] = useState('');
  const [claimedLevel, setClaimedLevel] = useState('intermediate');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [verifications, setVerifications] = useState(application.skill_verifications || []);

  const generateAssessment = async () => {
    setLoadingAssessment(true);
    try {
      const response = await base44.functions.invoke('generateTechnicalAssessment', {
        application_id: application.id
      });
      setAssessment(response.data.assessment);
      toast.success('Assessment generated!');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to generate assessment');
    } finally {
      setLoadingAssessment(false);
    }
  };

  const evaluateSubmission = async () => {
    setEvaluating(true);
    try {
      const response = await base44.functions.invoke('evaluateTechnicalSubmission', {
        application_id: application.id,
        submission
      });
      setEvaluation(response.data.evaluation);
      toast.success('Submission evaluated!');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to evaluate submission');
    } finally {
      setEvaluating(false);
    }
  };

  const analyzeBehavioral = async () => {
    const hasAllAnswers = behavioralResponses.every(r => r.answer.trim().length > 20);
    if (!hasAllAnswers) {
      toast.error('Please provide complete answers to all questions');
      return;
    }

    setAnalyzingBehavioral(true);
    try {
      const response = await base44.functions.invoke('analyzeBehavioralResponses', {
        application_id: application.id,
        responses: behavioralResponses
      });
      setBehavioralAnalysis(response.data.analysis);
      toast.success('Behavioral analysis complete!');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to analyze responses');
    } finally {
      setAnalyzingBehavioral(false);
    }
  };

  const verifySkill = async () => {
    if (!skillToVerify.trim()) {
      toast.error('Please enter a skill to verify');
      return;
    }

    setVerifyingSkill(true);
    try {
      const response = await base44.functions.invoke('verifySkillClaim', {
        application_id: application.id,
        skill: skillToVerify,
        claimed_level: claimedLevel,
        evidence_url: evidenceUrl
      });
      setVerifications([...verifications, response.data.verification]);
      setSkillToVerify('');
      setEvidenceUrl('');
      toast.success('Skill verified!');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to verify skill');
    } finally {
      setVerifyingSkill(false);
    }
  };

  const existingAssessment = application.technical_assessment?.challenge ? 
    JSON.parse(application.technical_assessment.challenge) : null;
  const existingEvaluation = application.technical_assessment?.ai_feedback ?
    JSON.parse(application.technical_assessment.ai_feedback) : null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            AI Skill Validation & Assessment
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="technical">
              <Code className="w-4 h-4 mr-2" />
              Technical
            </TabsTrigger>
            <TabsTrigger value="behavioral">
              <MessageSquare className="w-4 h-4 mr-2" />
              Behavioral
            </TabsTrigger>
            <TabsTrigger value="verification">
              <Shield className="w-4 h-4 mr-2" />
              Verify Skills
            </TabsTrigger>
          </TabsList>

          <TabsContent value="technical" className="space-y-4 mt-6">
            {!existingAssessment && !assessment ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Code className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Generate a technical assessment challenge</p>
                  <Button onClick={generateAssessment} disabled={loadingAssessment}>
                    {loadingAssessment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Generate Assessment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{(assessment || existingAssessment)?.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700">{(assessment || existingAssessment)?.description}</p>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Skills Tested:</h4>
                      <div className="flex flex-wrap gap-2">
                        {(assessment || existingAssessment)?.skills_tested?.map((skill, idx) => (
                          <Badge key={idx} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Requirements:</h4>
                      <ul className="space-y-1">
                        {(assessment || existingAssessment)?.requirements?.map((req, idx) => (
                          <li key={idx} className="text-sm text-gray-700">• {req}</li>
                        ))}
                      </ul>
                    </div>

                    {(assessment || existingAssessment)?.starter_template && (
                      <div>
                        <h4 className="font-semibold mb-2">Starter Template:</h4>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                          {(assessment || existingAssessment).starter_template}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {existingEvaluation ? (
                  <Card className="bg-gradient-to-br from-indigo-50 to-purple-50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Evaluation Results
                        <Badge className="text-lg">{existingEvaluation.overall_score}/100</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700">{existingEvaluation.summary}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-600 mb-2">Strengths</h4>
                          <ul className="space-y-1">
                            {existingEvaluation.strengths?.map((s, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-600 mb-2">Improvements</h4>
                          <ul className="space-y-1">
                            {existingEvaluation.improvements?.map((i, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                {i}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Submit Solution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        placeholder="Paste the candidate's submission here (code, links, description)..."
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <Button onClick={evaluateSubmission} disabled={evaluating || !submission}>
                        {evaluating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Evaluate with AI
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="behavioral" className="space-y-4 mt-6">
            {behavioralAnalysis ? (
              <div className="space-y-4">
                <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">Overall Soft Skills Score</h3>
                      <span className="text-4xl font-bold">{behavioralAnalysis.overall_score}/100</span>
                    </div>
                    <p className="text-white/90">{behavioralAnalysis.summary}</p>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries({
                    'Communication': behavioralAnalysis.communication_style,
                    'Problem Solving': behavioralAnalysis.problem_solving,
                    'Teamwork': behavioralAnalysis.teamwork,
                    'Leadership': behavioralAnalysis.leadership,
                    'Cultural Fit': behavioralAnalysis.cultural_fit
                  }).map(([key, value]) => value && (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          {key}
                          <Badge>{value.score}/100</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{value.analysis}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {behavioralAnalysis.key_strengths?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Key Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {behavioralAnalysis.key_strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-sm text-gray-700">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {behavioralAnalysis.red_flags?.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-red-600">Areas of Concern</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {behavioralAnalysis.red_flags.map((flag, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                            <span className="text-sm text-gray-700">{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Behavioral Interview Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {behavioralResponses.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="font-medium text-gray-900">
                          {idx + 1}. {item.question}
                        </label>
                        <Textarea
                          value={item.answer}
                          onChange={(e) => {
                            const newResponses = [...behavioralResponses];
                            newResponses[idx].answer = e.target.value;
                            setBehavioralResponses(newResponses);
                          }}
                          placeholder="Enter candidate's response..."
                          rows={3}
                        />
                      </div>
                    ))}
                    <Button onClick={analyzeBehavioral} disabled={analyzingBehavioral}>
                      {analyzingBehavioral ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Analyze Responses
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="verification" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Verify Skill Claims</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Skill to Verify</label>
                    <Input
                      value={skillToVerify}
                      onChange={(e) => setSkillToVerify(e.target.value)}
                      placeholder="e.g., React, Python, UI Design"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Claimed Level</label>
                    <Select value={claimedLevel} onValueChange={setClaimedLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Evidence URL (optional)</label>
                  <Input
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://github.com/... or portfolio link"
                  />
                </div>
                <Button onClick={verifySkill} disabled={verifyingSkill}>
                  {verifyingSkill ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Verify Skill
                </Button>
              </CardContent>
            </Card>

            {verifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Verification Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {verifications.map((v, idx) => {
                      const notes = v.ai_notes ? JSON.parse(v.ai_notes) : {};
                      return (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{v.skill}</span>
                              <Badge variant={v.verified ? "default" : "outline"}>
                                {v.verified ? 'Verified' : 'Unverified'}
                              </Badge>
                              <Badge variant="outline">{v.ai_verification_score}/100</Badge>
                            </div>
                          </div>
                          {notes.recommendation && (
                            <p className="text-sm text-gray-700">{notes.recommendation}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}