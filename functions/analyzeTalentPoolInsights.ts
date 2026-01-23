import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all talent data
    const users = await base44.asServiceRole.entities.User.list();
    const skills = await base44.asServiceRole.entities.Skill.list();
    const applications = await base44.asServiceRole.entities.Application.list();
    const opportunities = await base44.asServiceRole.entities.Opportunity.list();

    // Prepare data summary for AI analysis
    const dataSummary = {
      total_candidates: users.length,
      total_skills: skills.length,
      total_applications: applications.length,
      total_opportunities: opportunities.length,
      skills_breakdown: skills.reduce((acc, skill) => {
        acc[skill.name] = (acc[skill.name] || 0) + 1;
        return acc;
      }, {}),
      verified_skills: skills.filter(s => s.verified_by !== 'self').length,
      skill_levels: skills.reduce((acc, skill) => {
        acc[skill.level] = (acc[skill.level] || 0) + 1;
        return acc;
      }, {}),
      recent_applications: applications.filter(app => {
        const days = (Date.now() - new Date(app.created_date)) / (1000 * 60 * 60 * 24);
        return days <= 30;
      }).length,
      application_statuses: applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {}),
      active_opportunities: opportunities.filter(o => o.status === 'active').length,
      top_requested_skills: opportunities.flatMap(o => o.skills_required || [])
        .reduce((acc, skill) => {
          acc[skill] = (acc[skill] || 0) + 1;
          return acc;
        }, {}),
      user_locations: users.reduce((acc, u) => {
        if (u.location) {
          acc[u.location] = (acc[u.location] || 0) + 1;
        }
        return acc;
      }, {}),
      availability_types: users.reduce((acc, u) => {
        if (u.availability) {
          acc[u.availability] = (acc[u.availability] || 0) + 1;
        }
        return acc;
      }, {})
    };

    // Use AI to generate comprehensive insights
    const insights = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `As a talent analytics expert, analyze this talent pool data and provide comprehensive insights:

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

Provide a detailed analysis covering:

1. EMERGING SKILL TRENDS: Identify the top 5-7 trending skills in the talent pool and their growth potential. Compare supply (candidate skills) vs demand (opportunity requirements).

2. DEMOGRAPHICS & DIVERSITY: Analyze location distribution, availability preferences, and any notable demographic patterns.

3. ENGAGEMENT & FLIGHT RISKS: Assess candidate engagement based on recent application activity, identify potential flight risks (candidates who haven't applied recently but are active), and engagement levels.

4. SOURCING STRATEGIES: Provide 4-5 specific, actionable sourcing strategies based on skill gaps, market demand, and talent pool composition.

5. KEY METRICS: Provide specific numbers for:
   - Skill utilization rate (verified skills / total skills)
   - Application conversion rate
   - Top 3 in-demand skills not well-represented in talent pool
   - Engagement score (% candidates active in last 30 days)

Format your response as a structured analysis with clear sections.`,
      response_json_schema: {
        type: "object",
        properties: {
          skill_trends: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                candidate_count: { type: "number" },
                demand_count: { type: "number" },
                trend: { type: "string" },
                insight: { type: "string" }
              }
            }
          },
          demographics: {
            type: "object",
            properties: {
              top_locations: { type: "array", items: { type: "string" } },
              availability_breakdown: { type: "object" },
              diversity_notes: { type: "string" }
            }
          },
          engagement_analysis: {
            type: "object",
            properties: {
              engagement_score: { type: "number" },
              active_candidates: { type: "number" },
              at_risk_candidates: { type: "number" },
              risk_factors: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } }
            }
          },
          sourcing_strategies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                strategy: { type: "string" },
                description: { type: "string" },
                priority: { type: "string" },
                expected_impact: { type: "string" }
              }
            }
          },
          key_metrics: {
            type: "object",
            properties: {
              skill_utilization_rate: { type: "number" },
              application_conversion_rate: { type: "number" },
              skill_gaps: { type: "array", items: { type: "string" } },
              talent_pool_health: { type: "string" }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      insights,
      raw_data: dataSummary,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing talent pool:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});