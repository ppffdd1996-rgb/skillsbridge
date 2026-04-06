import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      slot_id,
      application_id,
      candidate_notes
    } = await req.json();

    if (!slot_id || !application_id) {
      return Response.json({ error: 'slot_id and application_id required' }, { status: 400 });
    }

    // Get the slot
    const slots = await base44.asServiceRole.entities.InterviewSlot.filter({ id: slot_id });
    if (slots.length === 0) {
      return Response.json({ error: 'Slot not found' }, { status: 404 });
    }

    const slot = slots[0];
    if (!slot.is_available) {
      return Response.json({ error: 'Slot already booked' }, { status: 400 });
    }

    // Get application details
    const applications = await base44.asServiceRole.entities.Application.filter({ id: application_id });
    if (applications.length === 0) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }
    const application = applications[0];

    // Create datetime for calendar event
    const slotDateTime = new Date(`${slot.slot_date}T${slot.start_time}:00`);
    const endDateTime = new Date(`${slot.slot_date}T${slot.end_time}:00`);

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    // Create Google Calendar event
    const eventResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: `Interview: ${application.applicant_name}`,
          description: `Interview with ${application.applicant_name} for ${slot.interview_type}\n\n${candidate_notes || ''}`,
          start: {
            dateTime: slotDateTime.toISOString(),
            timeZone: 'America/Los_Angeles'
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'America/Los_Angeles'
          },
          attendees: [
            { email: slot.recruiter_email },
            { email: application.applicant_email }
          ],
          conferenceData: {
            createRequest: {
              requestId: `interview-${slot_id}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 30 }
            ]
          }
        })
      }
    );

    if (!eventResponse.ok) {
      throw new Error('Failed to create calendar event');
    }

    const calendarEvent = await eventResponse.json();

    // Update slot as booked
    await base44.asServiceRole.entities.InterviewSlot.update(slot_id, {
      is_available: false,
      booked_by: application.applicant_email,
      application_id,
      google_calendar_event_id: calendarEvent.id,
      location: calendarEvent.hangoutLink || 'TBD'
    });

    // Create Interview record
    const interview = await base44.asServiceRole.entities.Interview.create({
      application_id,
      candidate_email: application.applicant_email,
      candidate_name: application.applicant_name,
      interviewer_email: slot.recruiter_email,
      interviewer_name: slot.recruiter_name,
      scheduled_time: slotDateTime.toISOString(),
      duration_minutes: slot.duration_minutes,
      interview_type: slot.interview_type,
      status: 'scheduled',
      meeting_link: calendarEvent.hangoutLink,
      google_calendar_event_id: calendarEvent.id,
      notes: candidate_notes
    });

    // Send confirmation email
    await base44.integrations.Core.SendEmail({
      to: application.applicant_email,
      subject: 'Interview Confirmed',
      body: `Hi ${application.applicant_name},

Your interview has been scheduled!

Date: ${new Date(slotDateTime).toLocaleDateString()}
Time: ${slot.start_time}
Duration: ${slot.duration_minutes} minutes
Type: ${slot.interview_type}
Meeting Link: ${calendarEvent.hangoutLink || 'Will be provided'}

Please join on time. Good luck!`
    });

    return Response.json({
      success: true,
      interview,
      meeting_link: calendarEvent.hangoutLink,
      calendar_event_id: calendarEvent.id
    });

  } catch (error) {
    console.error('Book interview error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});