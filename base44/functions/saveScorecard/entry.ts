import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      interview_id, application_id, opportunity_id, opportunity_title,
      candidate_email, candidate_name,
      criteria_scores, overall_recommendation,
      strengths, concerns, general_notes, status, scorecard_id
    } = body;

    if (!interview_id || !candidate_email) {
      return Response.json({ error: 'interview_id and candidate_email required' }, { status: 400 });
    }

    const scores = criteria_scores || [];
    const validScores = scores.filter(s => s && typeof s.score === 'number');
    const overall_score = validScores.length > 0
      ? Math.round((validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length) * 100) / 100
      : null;

    const payload = {
      interview_id,
      application_id: application_id || '',
      opportunity_id: opportunity_id || '',
      opportunity_title: opportunity_title || '',
      candidate_email,
      candidate_name: candidate_name || '',
      recruiter_email: user.email,
      recruiter_name: user.full_name || user.display_name || user.email,
      criteria_scores: scores,
      overall_score,
      overall_recommendation: overall_recommendation || 'neutral',
      strengths: strengths || [],
      concerns: concerns || [],
      general_notes: general_notes || '',
      status: status || 'draft',
      submitted_at: (status || 'draft') === 'submitted' ? new Date().toISOString() : undefined
    };

    let scorecard;
    if (scorecard_id) {
      scorecard = await base44.asServiceRole.entities.Scorecard.update(scorecard_id, payload);
    } else {
      // Check if a scorecard already exists for this interview by this recruiter
      const existing = await base44.asServiceRole.entities.Scorecard.filter({
        interview_id,
        recruiter_email: user.email
      });
      if (existing.length > 0) {
        scorecard = await base44.asServiceRole.entities.Scorecard.update(existing[0].id, payload);
      } else {
        scorecard = await base44.asServiceRole.entities.Scorecard.create(payload);
      }
    }

    return Response.json({ success: true, scorecard });
  } catch (error) {
    console.error('Save scorecard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});