import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { opportunity_id, top_n } = body;
    if (!opportunity_id) return Response.json({ error: 'opportunity_id required' }, { status: 400 });

    const opportunity = await base44.asServiceRole.entities.Opportunity.get(opportunity_id);
    if (!opportunity) return Response.json({ error: 'Opportunity not found' }, { status: 404 });
    if (opportunity.creator_id && opportunity.creator_id !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Not your opportunity' }, { status: 403 });
    }

    // Gather matches for this opportunity
    const matches = await base44.asServiceRole.entities.Match.filter({ opportunity_id });
    if (matches.length === 0) return Response.json({ candidates: [], opportunity });

    // Gather applications (for names + extra strengths)
    const applications = await base44.asServiceRole.entities.Application.filter({ opportunity_id });
    const appByEmail = {};
    applications.forEach(a => { appByEmail[a.applicant_email] = a; });

    // Build candidate records, rank by match_score desc
    const ranked = matches
      .map(m => {
        const app = appByEmail[m.talent_email] || {};
        return {
          talent_email: m.talent_email,
          candidate_name: app.applicant_name || m.talent_email.split('@')[0],
          match_score: m.match_score,
          matched_skills: m.matched_skills || [],
          missing_skills: m.missing_skills || [],
          status: m.status,
          application_status: app.status,
          strengths: app.strengths || [],
          ai_summary: app.ai_summary || ''
        };
      })
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
      .slice(0, top_n || 5);

    if (ranked.length === 0) return Response.json({ candidates: [], opportunity });

    // Generate AI ranking notes in one call
    const requiredSkills = (opportunity.skills_required || []).join(', ');
    const candidatesContext = ranked.map((c, i) => {
      const skills = (c.matched_skills || []).join(', ') || 'none listed';
      const strengths = (c.strengths || []).join('; ') || 'N/A';
      return `Candidate ${i + 1}: ${c.candidate_name} (email: ${c.talent_email}, match_score: ${Math.round((c.match_score || 0) * 100)}%). Matched skills: ${skills}. Application strengths: ${strengths}.`;
    }).join('\n');

    let aiNotes = {};
    try {
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a recruitment assistant. Below is a job and its top-ranked candidates. For each candidate, write ONE concise sentence (max ~18 words) explaining why the AI ranked them highly for this role, highlighting their strongest matching skills. Reference specific skills when possible.\n\nJob title: ${opportunity.title}\nRequired skills: ${requiredSkills}\n\n${candidatesContext}\n\nReturn a JSON object mapping each candidate email to their one-sentence ranking note.`,
        response_json_schema: {
          type: 'object',
          properties: {},
          additionalProperties: { type: 'string' }
        }
      });
      aiNotes = llm || {};
    } catch (e) {
      console.log('LLM ranking notes failed:', e?.message || e);
    }

    const candidates = ranked.map(c => ({
      ...c,
      ranking_note: aiNotes[c.talent_email] || ''
    }));

    return Response.json({ opportunity, candidates });
  } catch (error) {
    console.error('generateCandidateRanking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});