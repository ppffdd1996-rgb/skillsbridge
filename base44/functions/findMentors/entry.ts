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

    // AI ranks mentors for this candidate
    const ranking = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Rank available mentors for a candidate seeking career guidance. Score and order each mentor by fit.

CANDIDATE:
${JSON.stringify({
  name: user.full_name,
  target_industry: body.target_industry || 'unspecified',
  career_goals: body.career_goals || 'unspecified',
  skills: candidateSkills.map(s => s.name)
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

Return the mentors ranked best-first. For each: id, fit_score (0-100), match_reasons (2-3 short bullets explaining why they fit), recommended_topics (1-3 topics from their guidance_topics most relevant to the candidate).`,
      response_json_schema: {
        type: "object",
        properties: {
          ranked_mentors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                fit_score: { type: "number" },
                match_reasons: { type: "array", items: { type: "string" } },
                recommended_topics: { type: "array", items: { type: "string" } }
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
          recommended_topics: r.recommended_topics || []
        };
      })
      .filter(Boolean);

    return Response.json({ success: true, ranked_mentors: ranked });
  } catch (error) {
    console.error('findMentors error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});