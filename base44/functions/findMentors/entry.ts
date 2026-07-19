import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Load mentors + candidate skills
    const [mentors, candidateSkills] = await Promise.all([
      base44.asServiceRole.entities.Mentor.filter({ is_available: true }),
      base44.asServiceRole.entities.Skill.filter({ user_email: user.email })
    ]);

    if (mentors.length === 0) return Response.json({ success: true, ranked_mentors: [], message: 'No mentors available yet' });

    // AI: identify the candidate's skill gaps for their goal, then rank mentors who can close them
    const ranking = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `A candidate wants mentorship. First infer their skill gaps relative to their career goal and target industry, then rank the available mentors by how well they can close those gaps and advance the candidate's goals.

CANDIDATE:
${JSON.stringify({
  name: user.full_name,
  target_industry: body.target_industry || 'unspecified',
  career_goals: body.career_goals || 'unspecified',
  current_skills: candidateSkills.map(s => ({ name: s.name, level: s.level, years_experience: s.years_experience }))
}, null, 2)}

AVAILABLE MENTORS:
${JSON.stringify(mentors.map(m => ({
  id: m.id,
  name: m.name,
  title: m.title,
  company: m.company,
  industry: m.industry,
  expertise_areas: m.expertise_areas,
  guidance_topics: m.guidance_topics,
  years_experience: m.years_experience,
  rating: m.rating,
  current_mentee_count: m.current_mentee_count,
  max_mentees: m.max_mentees
})), null, 2)}

Step 1 — infer up to 6 skill_gaps the candidate most needs to close to reach their career goal (skills they lack or are weak at, given their current skills and target industry). Each gap: skill (name), priority (high/medium/low), why (one short sentence tying it to their goal).

Step 2 — rank mentors best-first by their ability to help close those gaps and advance the candidate's career goals. For each: id, fit_score (0-100), match_reasons (2-3 short bullets — reference the specific skill gaps or goals they address), recommended_topics (1-3 topics from their guidance_topics most relevant), addresses_gaps (the gap skills this mentor can help with).`,
      response_json_schema: {
        type: "object",
        properties: {
          skill_gaps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                priority: { type: "string" },
                why: { type: "string" }
              }
            }
          },
          ranked_mentors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                fit_score: { type: "number" },
                match_reasons: { type: "array", items: { type: "string" } },
                recommended_topics: { type: "array", items: { type: "string" } },
                addresses_gaps: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    // Merge scores back onto mentor records
    const scoreMap = new Map((ranking.ranked_mentors || []).map(r => [r.id, r]));
    const ranked = (ranking.ranked_mentors || [])
      .map(r => {
        const m = mentors.find(x => x.id === r.id);
        if (!m) return null;
        return {
          ...m,
          fit_score: r.fit_score,
          match_reasons: r.match_reasons || [],
          recommended_topics: r.recommended_topics || [],
          addresses_gaps: r.addresses_gaps || []
        };
      })
      .filter(Boolean);

    return Response.json({
      success: true,
      skill_gaps: ranking.skill_gaps || [],
      ranked_mentors: ranked
    });
  } catch (error) {
    console.error('findMentors error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});