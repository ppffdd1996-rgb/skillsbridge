import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get comprehensive profile data
    const [skills, education, opportunities] = await Promise.all([
      base44.asServiceRole.entities.Skill.filter({ user_email: user.email }),
      base44.asServiceRole.entities.User.filter({ email: user.email }),
      base44.asServiceRole.entities.Opportunity.filter({ status: 'active' })
    ]);

    const profile = education[0] || user;

    // Generate AI feedback
    const feedback = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this candidate profile and provide actionable feedback to improve their chances of matching with opportunities.

Profile:
${JSON.stringify({
  bio: profile.bio,
  headline: profile.headline,
  display_name: profile.display_name,
  skills: skills.map(s => ({ name: s.name, level: s.level, proof_url: s.proof_url })),
  education: profile.education,
  experience_level: profile.experience_level,
  portfolio_url: profile.portfolio_url,
  linkedin_url: profile.linkedin_url,
  github_url: profile.github_url
}, null, 2)}

Market Context (${opportunities.length} active opportunities):
${JSON.stringify(opportunities.slice(0, 10).map(o => ({
  title: o.title,
  skills_required: o.skills_required
})), null, 2)}

Provide specific, actionable feedback on:
1. Profile completeness (0-100 score)
2. Areas to improve (prioritized list)
3. Profile strength analysis
4. Bio/headline recommendations
5. Skill presentation suggestions
6. Portfolio/proof recommendations
7. Missing elements that would increase match potential
8. Quick wins (easy improvements with high impact)`,
      response_json_schema: {
        type: "object",
        properties: {
          completeness_score: { type: "number" },
          overall_rating: { type: "string" },
          strengths: {
            type: "array",
            items: { type: "string" }
          },
          areas_to_improve: {
            type: "array",
            items: {
              type: "object",
              properties: {
                area: { type: "string" },
                current_issue: { type: "string" },
                recommendation: { type: "string" },
                impact: { type: "string" }
              }
            }
          },
          bio_suggestions: {
            type: "object",
            properties: {
              current_issue: { type: "string" },
              suggested_improvements: { type: "array", items: { type: "string" } }
            }
          },
          skill_presentation: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                suggestion: { type: "string" }
              }
            }
          },
          missing_elements: {
            type: "array",
            items: { type: "string" }
          },
          quick_wins: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                benefit: { type: "string" }
              }
            }
          },
          match_potential_increase: { type: "number" }
        }
      }
    });

    return Response.json({
      success: true,
      ...feedback
    });

  } catch (error) {
    console.error('Profile feedback error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});