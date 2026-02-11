import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get candidate data
    const [candidateSkills, opportunities, verificationReports] = await Promise.all([
      base44.asServiceRole.entities.Skill.filter({ user_email: user.email }),
      base44.asServiceRole.entities.Opportunity.filter({ status: 'active' }),
      base44.asServiceRole.entities.SkillVerificationReport.filter({ user_email: user.email })
    ]);

    // Analyze with AI
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this candidate's skill gaps based on their current skills and active market opportunities.

Current Skills:
${JSON.stringify(candidateSkills.map(s => ({
  name: s.name,
  level: s.level,
  years_experience: s.years_experience,
  verification_score: s.verification_score
})), null, 2)}

Verification Reports:
${JSON.stringify(verificationReports.map(r => ({
  skill: r.skill_name,
  strengths: r.strengths,
  areas_for_improvement: r.areas_for_improvement,
  recommendations: r.recommendations
})), null, 2)}

Market Opportunities (sample of ${opportunities.length} active):
${JSON.stringify(opportunities.slice(0, 10).map(o => ({
  title: o.title,
  required_skills: o.skills_required,
  required_qualifications: o.required_qualifications
})), null, 2)}

Based on market trends and opportunities, identify:
1. Critical skill gaps (skills frequently required but candidate lacks)
2. Skills to improve (candidate has but needs strengthening)
3. Emerging skills trending in the market
4. Priority level for each gap (high/medium/low)
5. Estimated impact on job prospects (0-100)`,
      response_json_schema: {
        type: "object",
        properties: {
          critical_gaps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                reason: { type: "string" },
                priority: { type: "string" },
                impact_score: { type: "number" },
                market_demand: { type: "string" }
              }
            }
          },
          skills_to_improve: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                current_level: { type: "string" },
                target_level: { type: "string" },
                improvement_areas: { type: "array", items: { type: "string" } }
              }
            }
          },
          emerging_skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                trend: { type: "string" },
                relevance: { type: "string" }
              }
            }
          },
          overall_assessment: { type: "string" },
          competitive_edge: { type: "number" }
        }
      }
    });

    return Response.json({
      success: true,
      ...analysis
    });

  } catch (error) {
    console.error('Skill gap analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});