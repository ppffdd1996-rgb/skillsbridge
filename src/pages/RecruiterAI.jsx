import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Users, 
  MessageSquare, 
  FileText, 
  Target,
  Loader2,
  Copy,
  Check,
  TrendingUp,
  AlertCircle,
  Send,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecruiterAI() {
  const [user, setUser] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [messageContext, setMessageContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [profileToSummarize, setProfileToSummarize] = useState('');
  const [profileSummary, setProfileSummary] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
      } else {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: opportunities = [] } = useQuery({
    queryKey: ['my-opportunities', user?.email],
    queryFn: () => base44.entities.Opportunity.filter({ creator_id: user.email }),
    enabled: !!user,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['all-applications'],
    queryFn: () => base44.entities.Application.list(),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const suggestCandidates = async () => {
    if (!selectedOpportunity) {
      toast.error('Please select an opportunity first');
      return;
    }

    setLoading(true);
    setSuggestions(null);

    try {
      const opportunity = opportunities.find(o => o.id === selectedOpportunity);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert recruiter AI. Analyze this job opportunity and suggest the best matching candidates from the available talent pool.

OPPORTUNITY:
Title: ${opportunity.title}
Description: ${opportunity.description}
Required Skills: ${opportunity.skills_required?.join(', ')}
Key Responsibilities: ${opportunity.key_responsibilities?.join(', ')}
Qualifications: ${opportunity.required_qualifications?.join(', ')}

AVAILABLE CANDIDATES (with their profiles):
${allUsers.map(u => `
- ${u.full_name || u.email}
  Email: ${u.email}
  Bio: ${u.bio || 'No bio'}
  Skills: ${u.skills?.join(', ') || 'No skills listed'}
  Experience: ${u.experience_years || 0} years
  User Type: ${u.user_type || 'talent'}
`).join('\n')}

Provide:
1. Top 5 most suitable candidates ranked by fit
2. Match score (0-100) for each candidate
3. Why each candidate is a good fit
4. Specific strengths they bring
5. Potential concerns or gaps
6. Recommended next steps for outreach

Be specific and practical. Only recommend candidates who genuinely match the role requirements.`,
        response_json_schema: {
          type: "object",
          properties: {
            candidates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  match_score: { type: "number" },
                  fit_explanation: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  concerns: { type: "array", items: { type: "string" } },
                  next_steps: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.candidates);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast.error('Failed to analyze candidates');
    } finally {
      setLoading(false);
    }
  };

  const generateOutreachMessage = async () => {
    if (!messageContext.trim()) {
      toast.error('Please provide context for the message');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert recruiter crafting a personalized outreach message.

Context: ${messageContext}

Write a professional, personalized, and compelling outreach message that:
1. Is warm and human (not robotic)
2. Highlights specific aspects of the candidate's profile
3. Clearly explains the opportunity
4. Creates excitement about the role
5. Includes a clear call-to-action
6. Is concise (200-300 words)

Format as a ready-to-send email with subject line.`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            message: { type: "string" }
          }
        }
      });

      setGeneratedMessage(`Subject: ${response.subject}\n\n${response.message}`);
    } catch (error) {
      console.error('Failed to generate message:', error);
      toast.error('Failed to generate message');
    } finally {
      setLoading(false);
    }
  };

  const summarizeProfile = async () => {
    if (!profileToSummarize.trim()) {
      toast.error('Please enter a candidate email or profile URL');
      return;
    }

    setLoading(true);
    try {
      const candidate = allUsers.find(u => 
        u.email.toLowerCase().includes(profileToSummarize.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(profileToSummarize.toLowerCase())
      );

      if (!candidate) {
        toast.error('Candidate not found');
        setLoading(false);
        return;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this candidate's profile in a concise, recruiter-friendly format:

Name: ${candidate.full_name || 'Not provided'}
Email: ${candidate.email}
Bio: ${candidate.bio || 'No bio'}
Skills: ${candidate.skills?.join(', ') || 'No skills listed'}
Experience: ${candidate.experience_years || 0} years
User Type: ${candidate.user_type || 'talent'}
Location: ${candidate.location || 'Not specified'}
Availability: ${candidate.availability || 'Not specified'}
Compensation: ${candidate.compensation_expectation || 'Not specified'}

Provide:
1. Quick overview (2-3 sentences)
2. Key strengths
3. Experience highlights
4. Best fit for (types of roles)
5. Red flags or gaps (if any)
6. Overall assessment

Be honest and balanced.`,
        response_json_schema: {
          type: "object",
          properties: {
            overview: { type: "string" },
            key_strengths: { type: "array", items: { type: "string" } },
            experience_highlights: { type: "string" },
            best_fit_for: { type: "string" },
            concerns: { type: "array", items: { type: "string" } },
            overall_assessment: { type: "string" }
          }
        }
      });

      setProfileSummary(response);
    } catch (error) {
      console.error('Failed to summarize profile:', error);
      toast.error('Failed to analyze profile');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkillGaps = async () => {
    if (!selectedCandidate || !selectedOpportunity) {
      toast.error('Please select both a candidate and an opportunity');
      return;
    }

    setLoading(true);
    try {
      const opportunity = opportunities.find(o => o.id === selectedOpportunity);
      const candidate = allUsers.find(u => u.email === selectedCandidate);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the skill gap between this candidate and the job opportunity:

CANDIDATE:
Name: ${candidate.full_name || candidate.email}
Skills: ${candidate.skills?.join(', ') || 'No skills listed'}
Experience: ${candidate.experience_years || 0} years
Bio: ${candidate.bio || 'No bio'}

OPPORTUNITY:
Title: ${opportunity.title}
Required Skills: ${opportunity.skills_required?.join(', ')}
Responsibilities: ${opportunity.key_responsibilities?.join(', ')}
Qualifications: ${opportunity.required_qualifications?.join(', ')}

Provide:
1. Skills they have (matching requirements)
2. Skills they're missing (critical gaps)
3. Skills they partially have (need development)
4. Transferable skills they can leverage
5. Recommended training or development areas
6. Feasibility assessment (Can they bridge the gaps? How long would it take?)
7. Overall recommendation (Hire, Hire with training, Pass, etc.)`,
        response_json_schema: {
          type: "object",
          properties: {
            matching_skills: { type: "array", items: { type: "string" } },
            missing_skills: { type: "array", items: { type: "string" } },
            partial_skills: { type: "array", items: { type: "string" } },
            transferable_skills: { type: "array", items: { type: "string" } },
            development_recommendations: { type: "string" },
            gap_bridging_feasibility: { type: "string" },
            recommendation: { type: "string" }
          }
        }
      });

      setSkillGapAnalysis(response);
    } catch (error) {
      console.error('Failed to analyze skill gaps:', error);
      toast.error('Failed to analyze skill gaps');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Recruiter Assistant</h1>
              <p className="text-gray-600">Powered by advanced AI to supercharge your recruiting</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="suggestions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="suggestions" className="flex flex-col gap-1 py-3">
              <Users className="w-5 h-5" />
              <span className="text-xs">Candidate Suggestions</span>
            </TabsTrigger>
            <TabsTrigger value="outreach" className="flex flex-col gap-1 py-3">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs">Draft Messages</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col gap-1 py-3">
              <FileText className="w-5 h-5" />
              <span className="text-xs">Profile Summary</span>
            </TabsTrigger>
            <TabsTrigger value="gaps" className="flex flex-col gap-1 py-3">
              <Target className="w-5 h-5" />
              <span className="text-xs">Skill Gap Analysis</span>
            </TabsTrigger>
          </TabsList>

          {/* Candidate Suggestions Tab */}
          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  AI-Powered Candidate Suggestions
                </CardTitle>
                <CardDescription>
                  Get intelligent candidate recommendations for your open opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Opportunity
                  </label>
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
                </div>

                <Button
                  onClick={suggestCandidates}
                  disabled={loading || !selectedOpportunity}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing candidates...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Suggestions
                    </>
                  )}
                </Button>

                {suggestions && (
                  <AnimatePresence>
                    <div className="space-y-4 mt-6">
                      {suggestions.map((candidate, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className="border-2">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                      #{idx + 1}
                                    </Badge>
                                    <h3 className="text-lg font-semibold">{candidate.name}</h3>
                                  </div>
                                  <p className="text-sm text-gray-600">{candidate.email}</p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span className="text-2xl font-bold text-gray-900">
                                      {candidate.match_score}%
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">match score</span>
                                </div>
                              </div>

                              <p className="text-gray-700 mb-4">{candidate.fit_explanation}</p>

                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                    <Check className="w-4 h-4 text-green-600" />
                                    Strengths
                                  </h4>
                                  <ul className="space-y-1">
                                    {candidate.strengths?.map((strength, i) => (
                                      <li key={i} className="text-sm text-gray-600 flex items-start gap-1">
                                        <span className="text-green-600 mt-0.5">•</span>
                                        {strength}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {candidate.concerns?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                      <AlertCircle className="w-4 h-4 text-orange-600" />
                                      Potential Concerns
                                    </h4>
                                    <ul className="space-y-1">
                                      {candidate.concerns.map((concern, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-start gap-1">
                                          <span className="text-orange-600 mt-0.5">•</span>
                                          {concern}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                <p className="text-sm font-medium text-gray-900 mb-1">Recommended Next Steps:</p>
                                <p className="text-sm text-gray-700">{candidate.next_steps}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outreach Messages Tab */}
          <TabsContent value="outreach">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  AI Message Generator
                </CardTitle>
                <CardDescription>
                  Create personalized outreach messages instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Context
                  </label>
                  <Textarea
                    value={messageContext}
                    onChange={(e) => setMessageContext(e.target.value)}
                    placeholder="E.g., Reaching out to Sarah Chen about the Senior Product Designer role. She has 5 years of experience in fintech and her portfolio shows excellent work in mobile app design..."
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={generateOutreachMessage}
                  disabled={loading || !messageContext.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Crafting message...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Generate Message
                    </>
                  )}
                </Button>

                {generatedMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <div className="bg-white border-2 border-indigo-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Generated Message</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generatedMessage)}
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {generatedMessage}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Summary Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Instant Profile Summary
                </CardTitle>
                <CardDescription>
                  Get a comprehensive candidate analysis in seconds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Candidate Email or Name
                  </label>
                  <Input
                    value={profileToSummarize}
                    onChange={(e) => setProfileToSummarize(e.target.value)}
                    placeholder="Enter candidate email or name..."
                  />
                </div>

                <Button
                  onClick={summarizeProfile}
                  disabled={loading || !profileToSummarize.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing profile...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Profile
                    </>
                  )}
                </Button>

                {profileSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 mt-6"
                  >
                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Overview</h3>
                          <p className="text-gray-700">{profileSummary.overview}</p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Key Strengths</h3>
                          <div className="flex flex-wrap gap-2">
                            {profileSummary.key_strengths?.map((strength, idx) => (
                              <Badge key={idx} className="bg-green-100 text-green-700">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Experience Highlights</h3>
                          <p className="text-gray-700">{profileSummary.experience_highlights}</p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Best Fit For</h3>
                          <p className="text-gray-700">{profileSummary.best_fit_for}</p>
                        </div>

                        {profileSummary.concerns?.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Potential Concerns</h3>
                            <ul className="space-y-1">
                              {profileSummary.concerns.map((concern, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                  {concern}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-4 border-t">
                          <h3 className="font-semibold text-gray-900 mb-2">Overall Assessment</h3>
                          <p className="text-gray-700">{profileSummary.overall_assessment}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skill Gap Analysis Tab */}
          <TabsContent value="gaps">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Skill Gap Analysis
                </CardTitle>
                <CardDescription>
                  Identify and assess skill gaps between candidates and roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Candidate
                    </label>
                    <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose candidate..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.map(u => (
                          <SelectItem key={u.email} value={u.email}>
                            {u.full_name || u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Opportunity
                    </label>
                    <Select value={selectedOpportunity} onValueChange={setSelectedOpportunity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose opportunity..." />
                      </SelectTrigger>
                      <SelectContent>
                        {opportunities.map(opp => (
                          <SelectItem key={opp.id} value={opp.id}>
                            {opp.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={analyzeSkillGaps}
                  disabled={loading || !selectedCandidate || !selectedOpportunity}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing gaps...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Analyze Skill Gaps
                    </>
                  )}
                </Button>

                {skillGapAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 mt-6"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-600" />
                            Matching Skills
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {skillGapAnalysis.matching_skills?.map((skill, idx) => (
                              <Badge key={idx} className="bg-green-100 text-green-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            Missing Skills
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {skillGapAnalysis.missing_skills?.map((skill, idx) => (
                              <Badge key={idx} className="bg-red-100 text-red-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Partial Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {skillGapAnalysis.partial_skills?.map((skill, idx) => (
                              <Badge key={idx} className="bg-yellow-100 text-yellow-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Transferable Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {skillGapAnalysis.transferable_skills?.map((skill, idx) => (
                              <Badge key={idx} className="bg-blue-100 text-blue-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-2 border-indigo-200">
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Development Recommendations</h3>
                          <p className="text-gray-700">{skillGapAnalysis.development_recommendations}</p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Gap Bridging Feasibility</h3>
                          <p className="text-gray-700">{skillGapAnalysis.gap_bridging_feasibility}</p>
                        </div>

                        <div className="pt-4 border-t bg-gradient-to-r from-indigo-50 to-purple-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                          <h3 className="font-semibold text-gray-900 mb-2">Final Recommendation</h3>
                          <p className="text-lg font-medium text-indigo-900">{skillGapAnalysis.recommendation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}