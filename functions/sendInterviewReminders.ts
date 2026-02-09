import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get interviews scheduled for the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const interviews = await base44.asServiceRole.entities.Interview.filter({
      status: 'scheduled'
    });

    const upcomingInterviews = interviews.filter(interview => {
      const interviewTime = new Date(interview.scheduled_time);
      return interviewTime > now && interviewTime <= tomorrow;
    });

    let remindersSent = 0;

    for (const interview of upcomingInterviews) {
      const interviewTime = new Date(interview.scheduled_time);
      const hoursUntil = (interviewTime - now) / (1000 * 60 * 60);

      // Send reminder if within 24 hours
      if (hoursUntil <= 24 && hoursUntil > 0) {
        try {
          // Send to candidate
          await base44.integrations.Core.SendEmail({
            to: interview.candidate_email,
            subject: 'Interview Reminder - Tomorrow',
            body: `Hi ${interview.candidate_name},

This is a friendly reminder about your upcoming interview:

Date & Time: ${interviewTime.toLocaleString()}
Type: ${interview.interview_type}
Duration: ${interview.duration_minutes} minutes
${interview.meeting_link ? `Meeting Link: ${interview.meeting_link}` : ''}

Please be on time. Good luck!

Best regards,
${interview.interviewer_name}`
          });

          // Send to interviewer
          await base44.integrations.Core.SendEmail({
            to: interview.interviewer_email,
            subject: 'Interview Reminder - Tomorrow',
            body: `Hi ${interview.interviewer_name},

Reminder: You have an interview scheduled tomorrow with ${interview.candidate_name}.

Date & Time: ${interviewTime.toLocaleString()}
Type: ${interview.interview_type}
Duration: ${interview.duration_minutes} minutes
${interview.meeting_link ? `Meeting Link: ${interview.meeting_link}` : ''}

Application ID: ${interview.application_id}`
          });

          remindersSent++;
        } catch (emailError) {
          console.error(`Failed to send reminder for interview ${interview.id}:`, emailError);
        }
      }
    }

    return Response.json({
      success: true,
      reminders_sent: remindersSent,
      upcoming_interviews: upcomingInterviews.length
    });

  } catch (error) {
    console.error('Send reminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});