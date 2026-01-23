import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interview_id, new_scheduled_time, reason } = await req.json();

    // Get original interview
    const interviews = await base44.entities.Interview.filter({ id: interview_id });
    const oldInterview = interviews[0];

    if (!oldInterview) {
      return Response.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Mark old interview as rescheduled
    await base44.entities.Interview.update(interview_id, {
      status: 'rescheduled',
      cancellation_reason: reason
    });

    // Create new interview
    const newInterview = await base44.entities.Interview.create({
      application_id: oldInterview.application_id,
      recruiter_email: oldInterview.recruiter_email,
      candidate_email: oldInterview.candidate_email,
      scheduled_time: new_scheduled_time,
      duration_minutes: oldInterview.duration_minutes,
      status: 'scheduled',
      meeting_link: oldInterview.meeting_link,
      location: oldInterview.location,
      rescheduled_from: interview_id
    });

    // Get application and opportunity details
    const apps = await base44.entities.Application.filter({ id: oldInterview.application_id });
    const application = apps[0];
    const opps = await base44.entities.Opportunity.filter({ id: application.opportunity_id });
    const opportunity = opps[0];

    // Update application
    await base44.entities.Application.update(oldInterview.application_id, {
      interview_date: new_scheduled_time
    });

    const newDate = new Date(new_scheduled_time).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Send notification emails
    await base44.integrations.Core.SendEmail({
      to: oldInterview.candidate_email,
      subject: `Interview Rescheduled: ${opportunity.title}`,
      body: `Your interview has been rescheduled.

Position: ${opportunity.title}
New Date & Time: ${newDate}
Meeting Link: ${newInterview.meeting_link}

${reason ? `Reason: ${reason}` : ''}

Please let us know if you have any concerns.

Best regards,
SkillsBridge Team`
    });

    await base44.integrations.Core.SendEmail({
      to: oldInterview.recruiter_email,
      subject: `Interview Rescheduled: ${application.applicant_name}`,
      body: `Interview with ${application.applicant_name} has been rescheduled.

New Date & Time: ${newDate}
Meeting Link: ${newInterview.meeting_link}

Best regards,
SkillsBridge`
    });

    return Response.json({
      success: true,
      interview: newInterview
    });
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});