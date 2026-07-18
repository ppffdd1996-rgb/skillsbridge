import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Automation-triggered invocation: entity event payload instead of an action.
    // When an Interview is updated to "completed", create a feedback record.
    let action = body.action;
    if (!action && body.event && body.event.entity_name === 'Interview' && body.data && body.data.status === 'completed') {
      action = 'on_complete';
      body.interview_id = body.event.entity_id || body.data.id;
      body.candidate_email = body.data.candidate_email;
      body.recruiter_email = body.data.recruiter_email;
    }

    // Triggered by automation when an interview is marked completed.
    // Creates a pending feedback record (no user auth — service role).
    if (action === 'on_complete') {
      const { interview_id, candidate_email, recruiter_email } = body;
      if (!interview_id || !candidate_email || !recruiter_email) {
        return Response.json({ error: 'interview_id, candidate_email, recruiter_email required' }, { status: 400 });
      }

      // Avoid duplicate feedback records for the same interview
      try {
        const existing = await base44.asServiceRole.entities.InterviewFeedback.filter({ interview_id });
        if (existing && existing.length > 0) {
          return Response.json({ success: true, message: 'Feedback record already exists', feedback: existing[0] });
        }
      } catch (e) {}

      let interview = null;
      try { interview = await base44.asServiceRole.entities.Interview.get(interview_id); } catch (e) {}
      let application = null;
      if (interview?.application_id) {
        try { application = await base44.asServiceRole.entities.Application.get(interview.application_id); } catch (e) {}
      }
      let opportunity = null;
      if (interview?.application_id && application?.opportunity_id) {
        try { opportunity = await base44.asServiceRole.entities.Opportunity.get(application.opportunity_id); } catch (e) {}
      }

      let recruiter = null;
      try {
        const recruiters = await base44.asServiceRole.entities.User.filter({ email: recruiter_email });
        recruiter = recruiters && recruiters.length > 0 ? recruiters[0] : null;
      } catch (e) {}

      const feedback = await base44.asServiceRole.entities.InterviewFeedback.create({
        interview_id,
        application_id: interview?.application_id || '',
        opportunity_id: application?.opportunity_id || '',
        opportunity_title: opportunity?.title || '',
        candidate_email,
        candidate_name: application?.applicant_name || '',
        recruiter_email,
        recruiter_name: recruiter?.full_name || '',
        interview_date: interview?.scheduled_time || new Date().toISOString(),
        job_title: opportunity?.title || '',
        status: 'pending'
      });

      // Send the candidate feedback request email
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: candidate_email,
          subject: 'How was your interview? Share your experience',
          body: `Hi ${feedback.candidate_name || ''},\n\nThank you for taking the time to interview with us for the ${feedback.job_title || 'position'}${opportunity ? ' at ' + (opportunity.company_name || 'our company') : ''}.\n\nWe'd love to hear about your experience. Your feedback helps us improve our process and is stored securely for future reference.\n\nPlease log in to SkillsBridge to share your interview experience and any suggestions for improvement.\n\nThank you,\nThe Hiring Team`,
          from_name: 'SkillsBridge Feedback'
        });
        await base44.asServiceRole.entities.InterviewFeedback.update(feedback.id, { feedback_request_sent: true });
      } catch (e) {
        console.log('Feedback request email failed:', e?.message || e);
      }

      return Response.json({ success: true, feedback });
    }

    // Candidate submits their experience feedback
    if (action === 'submit_candidate') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { interview_id, overall_rating, communication_rating, professionalism_rating, difficulty_rating, would_recommend, candidate_comments, most_positive_aspect, improvement_suggestions } = body;
      if (!interview_id) return Response.json({ error: 'interview_id required' }, { status: 400 });

      const records = await base44.entities.InterviewFeedback.filter({ interview_id, candidate_email: user.email });
      if (!records || records.length === 0) {
        return Response.json({ error: 'No feedback request found for this interview' }, { status: 404 });
      }

      const updated = await base44.entities.InterviewFeedback.update(records[0].id, {
        overall_rating,
        communication_rating,
        professionalism_rating,
        difficulty_rating,
        would_recommend,
        candidate_comments,
        most_positive_aspect,
        improvement_suggestions,
        candidate_submitted_at: new Date().toISOString(),
        status: records[0].status === 'recruiter_noted' || records[0].status === 'completed' ? 'completed' : 'candidate_submitted'
      });

      return Response.json({ success: true, feedback: updated });
    }

    // Recruiter saves qualitative notes
    if (action === 'submit_recruiter_notes') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { feedback_id, recruiter_notes, strengths_observed, concerns_observed } = body;
      if (!feedback_id) return Response.json({ error: 'feedback_id required' }, { status: 400 });

      const existing = await base44.entities.InterviewFeedback.get(feedback_id);
      if (!existing) return Response.json({ error: 'Feedback not found' }, { status: 404 });
      if (existing.recruiter_email !== user.email) {
        return Response.json({ error: 'Only the assigned recruiter can add notes' }, { status: 403 });
      }

      // Generate a combined qualitative summary via LLM when both sides are present
      let qualitative_summary = existing.qualitative_summary;
      if (candidate_comments || recruiter_notes) {
        try {
          const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Summarize the following interview feedback into a concise qualitative summary (3-4 sentences) for future hiring reference.\n\nCandidate comments: ${candidate_comments || existing.candidate_comments || 'N/A'}\nRecruiter notes: ${recruiter_notes || existing.recruiter_notes || 'N/A'}\nStrengths: ${strengths_observed || existing.strengths_observed || 'N/A'}\nConcerns: ${concerns_observed || existing.concerns_observed || 'N/A'}\nOverall candidate rating: ${overall_rating || existing.overall_rating || 'N/A'}/5`,
            response_json_schema: { type: 'object', properties: { summary: { type: 'string' } } }
          });
          qualitative_summary = llm.summary || qualitative_summary;
        } catch (e) {
          console.log('Summary LLM failed:', e?.message || e);
        }
      }

      const updated = await base44.entities.InterviewFeedback.update(feedback_id, {
        recruiter_notes: recruiter_notes !== undefined ? recruiter_notes : existing.recruiter_notes,
        strengths_observed: strengths_observed !== undefined ? strengths_observed : existing.strengths_observed,
        concerns_observed: concerns_observed !== undefined ? concerns_observed : existing.concerns_observed,
        qualitative_summary,
        recruiter_noted_at: new Date().toISOString(),
        status: existing.status === 'candidate_submitted' ? 'completed' : 'recruiter_noted'
      });

      return Response.json({ success: true, feedback: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('manageInterviewFeedback error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});