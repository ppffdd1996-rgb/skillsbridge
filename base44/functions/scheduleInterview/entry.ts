import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id, recruiter_email, scheduled_time, duration_minutes = 60 } = await req.json();

    // Get application details
    const apps = await base44.entities.Application.filter({ id: application_id });
    const application = apps[0];

    if (!application) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get opportunity details
    const opps = await base44.entities.Opportunity.filter({ id: application.opportunity_id });
    const opportunity = opps[0];

    // Create interview
    const interview = await base44.entities.Interview.create({
      application_id,
      recruiter_email,
      candidate_email: application.applicant_email,
      scheduled_time,
      duration_minutes,
      status: 'scheduled',
      location: 'Video Call',
      meeting_link: `https://meet.skillsbridge.app/${application_id.slice(0, 12)}`
    });

    // Update application status
    await base44.entities.Application.update(application_id, {
      status: 'interviewing',
      interview_date: scheduled_time
    });

    // Send emails
    const interviewDate = new Date(scheduled_time);
    const formattedDate = interviewDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Email to candidate
    await base44.integrations.Core.SendEmail({
      to: application.applicant_email,
      subject: `Interview Scheduled: ${opportunity.title}`,
      body: `Dear ${application.applicant_name},

Great news! Your interview has been scheduled.

Position: ${opportunity.title}
Company: ${opportunity.company_name}
Date & Time: ${formattedDate}
Duration: ${duration_minutes} minutes
Meeting Link: ${interview.meeting_link}

Please click the link above to join the video call at the scheduled time.

Best regards,
SkillsBridge Team`
    });

    // Email to recruiter
    await base44.integrations.Core.SendEmail({
      to: recruiter_email,
      subject: `Interview Confirmed: ${application.applicant_name}`,
      body: `Interview scheduled with ${application.applicant_name} for ${opportunity.title}.

Date & Time: ${formattedDate}
Duration: ${duration_minutes} minutes
Meeting Link: ${interview.meeting_link}

Candidate Match Score: ${application.match_score}%

View application details in the Applications dashboard.

Best regards,
SkillsBridge`
    });

    // Create message record
    await base44.entities.Message.create({
      application_id,
      opportunity_id: application.opportunity_id,
      sender_email: recruiter_email,
      recipient_email: application.applicant_email,
      subject: `Interview Scheduled: ${opportunity.title}`,
      body: `Your interview has been scheduled for ${formattedDate}`,
      type: 'system'
    });

    return Response.json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});