import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { opportunity_id } = body;
    if (!opportunity_id) return Response.json({ error: 'opportunity_id required' }, { status: 400 });

    // Resolve the target job + candidate skills
    const [opportunity, candidateSkills, verificationReports] = await Promise.all([
      base44.asServiceRole.entities.Opportunity.get(opportunity_id),
      base44.asServiceRole.entities.Skill.filter({ user_email: user.email }),
      base44.asServiceRole.entities.SkillVerificationReport.filter({ user_email: user.email })
    ]);

    if (!opportunity) return Response.json({ error: 'Opportunity not found' }, { status: 404 });

    // AI: analyze this candidate against THIS job's requirements + suggest a learning path
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze how well a candidate's profile matches a specific job's requirements, flag the skill gaps, and recommend a concrete learning path to help them qualify for the role.

TARGET JOB:
${JSON.stringify({
  title: opportunity.title,
  description: opportunity.description,
  required_skills: opportunity.skills_required,
  preferred_skills: opportunity.skills_preferred,
  required_qualifications: opportunity.required_qualifications,
  experience_level: opportunity.experience_level,
  department: opportunity.department
}, null, 2)}

CANDIDATE SKILLS:
${JSON.stringify(candidateSkills.map(s => ({
  name: s.name,
  level: s.level,
  years_experience: s.years_experience,
  verification_score: s.verification_score,
  verified: s.verified
})), null, 2)}

VERIFICATION REPORTS (proof of skill):
${JSON.stringify(verificationReports.map(r => ({
  skill: r.skill_name,
  assessed_level: r.assessed_level,
  proficiency_score: r.proficiency_score,
  strengths: r.strengths,
  areas_for_improvement: r.areas_for_improvement
})), null, 2)}

Produce a readiness analysis:
1. readiness_score: 0-100 overall match for this specific role.
2. matched_skills: skills the candidate has that satisfy job requirements (with strength: full/partial).
3. skill_gaps: required skills the candidate lacks entirely OR at insufficient level. For each: skill, required_level, current_level (or "none"), priority (high/medium/low), impact_on_role (why it matters for THIS job).
4. learning_path: an ordered, actionable roadmap to close the gaps. For each step: skill, goal, recommended_resources (2-4 realistic named courses/platforms like Coursera, Udemy, freeCodeCamp, MDN, etc.), estimated_weeks, milestone (what proficiency milestone to hit).
5. quick_wins: 1-3 short-term actions that improve candidacy fastest.
6. summary: a 2-3 sentence overall assessment.`,
      response_json_schema: {
        type: "object",
        properties: {
          readiness_score: { type: "number" },
          matched_skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                strength: { type: "string" },
                note: { type: "string" }
              }
            }
          },
          skill_gaps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                required_level: { type: "string" },
                current_level: { type: "string" },
                priority: { type: "string" },
                impact_on_role: { type: "string" }
              }
            }
          },
          learning_path: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                goal: { type: "string" },
                recommended_resources: { type: "array", items: { type: "string" } },
                estimated_weeks: { type: "number" },
                milestone: { type: "string" }
              }
            }
          },
          quick_wins: { type: "array", items: { type: "string" } },
          summary: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      opportunity: { id: opportunity.id, title: opportunity.title },
      ...analysis
    });

  } catch (error) {
    console.error('analyzeJobReadiness error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});