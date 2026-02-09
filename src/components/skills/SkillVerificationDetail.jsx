import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Loader2, CheckCircle, AlertCircle, ExternalLink, Github, 
  Award, Code, TrendingUp, Shield, Sparkles, Plus, X 
} from 'lucide-react';
import { toast } from 'sonner';

export default function SkillVerificationDetail({ skill, onClose, onUpdate }) {
  const [githubUsername, setGithubUsername] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [certificationUrls, setCertificationUrls] = useState(['']);
  const [evidenceUrls, setEvidenceUrls] = useState(['']);
  const [analyzing, setAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['skill-reports', skill.id],
    queryFn: () => base44.entities.SkillVerificationReport.filter({ skill_id: skill.id })
  });

  const latestReport = reports.length > 0 ? reports.sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  )[0] : null;

  const analyzeEvidence = async () => {
    if (!githubUsername && !portfolioUrl && !certificationUrls.some(u => u) && !evidenceUrls.some(u => u)) {
      toast.error('Please provide at least one form of evidence');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzeSkillEvidence', {
        skill_id: skill.id,
        github_username: githubUsername || undefined,
        portfolio_url: portfolioUrl || undefined,
        certification_urls: certificationUrls.filter(u => u),
        evidence_urls: evidenceUrls.filter(u => u)
      });

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['skill-reports', skill.id] });
        queryClient.invalidateQueries({ queryKey: ['skills'] });
        toast.success('Verification complete!');
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Verification failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      verified: 'bg-green-100 text-green-800',
      partially_verified: 'bg-yellow-100 text-yellow-800',
      unverified: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const getConfidenceColor = (confidence) => {
    const colors = {
      high: 'text-green-600',
      medium: 'text-yellow-600',
      low: 'text-red-600'
    };
    return colors[confidence] || 'text-gray-600';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            AI Skill Verification: {skill.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Evidence Input Section */}
          {!latestReport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Submit Evidence for Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub Username
                  </label>
                  <Input
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="your-username"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll analyze your repositories, commits, and code quality
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Portfolio URL
                  </label>
                  <Input
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certification URLs
                  </label>
                  {certificationUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...certificationUrls];
                          newUrls[idx] = e.target.value;
                          setCertificationUrls(newUrls);
                        }}
                        placeholder="https://credly.com/... or coursera.org/..."
                      />
                      {certificationUrls.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCertificationUrls(certificationUrls.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCertificationUrls([...certificationUrls, ''])}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports Credly, Coursera, Udemy, and more
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Project URLs
                  </label>
                  {evidenceUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...evidenceUrls];
                          newUrls[idx] = e.target.value;
                          setEvidenceUrls(newUrls);
                        }}
                        placeholder="https://github.com/... or demo link"
                      />
                      {evidenceUrls.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEvidenceUrls(evidenceUrls.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEvidenceUrls([...evidenceUrls, ''])}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another
                  </Button>
                </div>

                <Button 
                  onClick={analyzeEvidence} 
                  disabled={analyzing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Evidence...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Run AI Verification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Verification Report */}
          {latestReport && (
            <div className="space-y-4">
              {/* Overall Score Card */}
              <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Proficiency Score</h3>
                      <p className="text-white/80">AI-Verified Skill Level</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold">{latestReport.proficiency_score}</div>
                      <p className="text-sm text-white/80">out of 100</p>
                    </div>
                  </div>
                  <Progress value={latestReport.proficiency_score} className="h-3 bg-white/20" />
                  <div className="flex items-center gap-3 mt-4">
                    <Badge className={getStatusColor(latestReport.verification_status)}>
                      {latestReport.verification_status?.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                      Level: {latestReport.assessed_level}
                    </Badge>
                    <span className={`text-sm font-medium ${getConfidenceColor(latestReport.confidence_level)}`}>
                      {latestReport.confidence_level} confidence
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{latestReport.analysis_summary}</p>
                </CardContent>
              </Card>

              {/* Strengths & Improvements */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {latestReport.strengths?.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <TrendingUp className="w-5 h-5" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {latestReport.areas_for_improvement?.map((area, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* GitHub Stats */}
              {latestReport.github_stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Github className="w-5 h-5" />
                      GitHub Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Repositories</p>
                        <p className="text-2xl font-bold">{latestReport.github_stats.total_repos}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Commits</p>
                        <p className="text-2xl font-bold">{latestReport.github_stats.total_commits}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Activity</p>
                        <p className="text-lg font-semibold capitalize">
                          {latestReport.github_stats.contribution_frequency}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Code Quality</p>
                        <p className="text-2xl font-bold">{Math.round(latestReport.github_stats.code_quality_score)}</p>
                      </div>
                    </div>
                    {latestReport.github_stats.languages?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Languages Used:</p>
                        <div className="flex flex-wrap gap-2">
                          {latestReport.github_stats.languages.map((lang, idx) => (
                            <Badge key={idx} variant="outline">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Projects Analyzed */}
              {latestReport.projects_analyzed?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Projects Analyzed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {latestReport.projects_analyzed.map((project, idx) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold">{project.name}</h4>
                              <p className="text-sm text-gray-600">{project.insights}</p>
                            </div>
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">Score: {Math.round(project.complexity_score)}</Badge>
                            {project.technologies?.map((tech, i) => (
                              <Badge key={i} variant="secondary">{tech}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {latestReport.certifications_validated?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Validated Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {latestReport.certifications_validated.map((cert, idx) => (
                        <div key={idx} className="flex items-start justify-between border-b pb-3 last:border-0">
                          <div>
                            <h4 className="font-semibold">{cert.name}</h4>
                            <p className="text-sm text-gray-600">Issued by {cert.issuer}</p>
                            {cert.verified && (
                              <Badge className="mt-1 bg-green-100 text-green-800">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          {cert.verification_url && (
                            <a
                              href={cert.verification_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {latestReport.recommendations?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Growth Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {latestReport.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-indigo-600 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Verified on {new Date(latestReport.verified_at).toLocaleDateString()}</span>
                <Button variant="outline" onClick={analyzeEvidence} disabled={analyzing}>
                  Re-verify Skill
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}