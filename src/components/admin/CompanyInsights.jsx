import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Briefcase, TrendingUp, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function CompanyInsights() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [insights, setInsights] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    suggestions: true,
    opportunities: true
  });

  // Fetch all opportunities grouped by company
  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities-admin'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 500)
  });

  // Group opportunities by company
  const companiesByName = opportunities.reduce((acc, opp) => {
    if (!acc[opp.company_name]) {
      acc[opp.company_name] = {
        name: opp.company_name,
        industry: opp.industry,
        size: opp.company_size,
        description: opp.company_description,
        opportunities: []
      };
    }
    acc[opp.company_name].opportunities.push(opp);
    return acc;
  }, {});

  const companies = Object.values(companiesByName);

  const generateInsights = async () => {
    if (!selectedCompany) {
      toast.error('Please select a company');
      return;
    }

    const company = companiesByName[selectedCompany];
    setGenerating(true);

    try {
      const oppTitles = company.opportunities.map(o => o.title).join(', ');
      const oppSkills = [...new Set(company.opportunities.flatMap(o => o.skills_required || []))].join(', ');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this company profile and provide strategic hiring insights:

Company: ${company.name}
Industry: ${company.industry || 'Not specified'}
Company Size: ${company.size || 'Not specified'}
Description: ${company.description || 'Not specified'}
Current Job Openings: ${oppTitles || 'None'}
Skills Required Across Roles: ${oppSkills || 'None'}
Number of Active Positions: ${company.opportunities.length}

Provide:
1. **Company Summary**: A comprehensive 3-4 sentence analysis of the company's hiring strategy, focus areas, and talent needs based on their current openings and profile.

2. **Strategic Insights**: 2-3 key observations about their hiring patterns, skill requirements, or potential gaps in their current recruitment strategy.

3. **Suggested Job Titles**: 8-12 relevant job titles they should consider posting based on:
   - Their industry and company size
   - Current job openings (to identify gaps and complementary roles)
   - Industry trends and common organizational structures
   - Mix of technical and non-technical roles
   - Entry, mid, and senior level positions

For each suggested job title, include a brief 1-sentence rationale explaining why it's relevant.

Format as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            company_summary: { type: "string" },
            strategic_insights: {
              type: "array",
              items: { type: "string" }
            },
            suggested_job_titles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  rationale: { type: "string" },
                  level: { 
                    type: "string",
                    enum: ["entry", "mid", "senior"]
                  }
                }
              }
            }
          }
        }
      });

      setInsights({
        company: company,
        ...response
      });
      toast.success('Insights generated!');
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'entry': return 'bg-green-100 text-green-700 border-green-200';
      case 'mid': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'senior': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Company Insights & Job Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a company to analyze..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.name} value={company.name}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{company.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {company.opportunities.length} {company.opportunities.length === 1 ? 'opening' : 'openings'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={generateInsights}
              disabled={!selectedCompany || generating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>

          {insights && (
            <div className="space-y-4 mt-6">
              {/* Company Overview */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-indigo-900">{insights.company.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {insights.company.industry && (
                        <Badge variant="outline" className="text-xs">
                          {insights.company.industry}
                        </Badge>
                      )}
                      {insights.company.size && (
                        <Badge variant="outline" className="text-xs">
                          {insights.company.size}
                        </Badge>
                      )}
                      <Badge className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200">
                        {insights.company.opportunities.length} active openings
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Summary */}
              <Card className="border-purple-200">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('summary')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      Company Analysis
                    </CardTitle>
                    {expandedSections.summary ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedSections.summary && (
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {insights.company_summary}
                    </p>

                    {insights.strategic_insights?.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-900">Key Insights:</p>
                        {insights.strategic_insights.map((insight, idx) => (
                          <div key={idx} className="flex gap-2 text-sm text-gray-600">
                            <span className="text-purple-600 font-semibold">•</span>
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Suggested Job Titles */}
              <Card className="border-green-200">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('suggestions')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-600" />
                      Suggested Job Titles ({insights.suggested_job_titles?.length || 0})
                    </CardTitle>
                    {expandedSections.suggestions ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedSections.suggestions && (
                  <CardContent>
                    <div className="grid gap-3">
                      {insights.suggested_job_titles?.map((job, idx) => (
                        <div 
                          key={idx}
                          className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">{job.title}</h4>
                                <Badge className={`text-xs ${getLevelColor(job.level)}`}>
                                  {job.level}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{job.rationale}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Current Opportunities */}
              <Card>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('opportunities')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      Current Openings ({insights.company.opportunities.length})
                    </CardTitle>
                    {expandedSections.opportunities ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedSections.opportunities && (
                  <CardContent>
                    <div className="space-y-2">
                      {insights.company.opportunities.map((opp, idx) => (
                        <div key={idx} className="text-sm p-2 bg-gray-50 rounded border">
                          <div className="font-medium text-gray-900">{opp.title}</div>
                          {opp.skills_required?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {opp.skills_required.slice(0, 5).map((skill, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {opp.skills_required.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{opp.skills_required.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}