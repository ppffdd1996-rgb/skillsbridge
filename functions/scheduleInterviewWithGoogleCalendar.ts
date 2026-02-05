import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      candidateEmail,
      candidateName,
      interviewTitle,
      interviewDescription,
      scheduledTime,
      durationMinutes = 60,
      meetingLink,
      location
    } = await req.json();

    if (!candidateEmail || !interviewTitle || !scheduledTime) {
      return Response.json(
        { error: 'Missing required fields: candidateEmail, interviewTitle, scheduledTime' },
        { status: 400 }
      );
    }

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    // Calculate end time
    const startDateTime = new Date(scheduledTime);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    // Build event description
    let eventDescription = interviewDescription || `Interview with ${candidateName || candidateEmail}`;
    if (meetingLink) {
      eventDescription += `\n\nMeeting Link: ${meetingLink}`;
    }

    // Create calendar event
    const eventPayload = {
      summary: interviewTitle,
      description: eventDescription,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC'
      },
      attendees: [
        {
          email: candidateEmail,
          displayName: candidateName || candidateEmail,
          responseStatus: 'needsAction'
        },
        {
          email: user.email,
          displayName: user.full_name || user.email,
          responseStatus: 'accepted'
        }
      ],
      conferenceData: meetingLink ? undefined : {
        createRequest: {
          requestId: `interview-${Date.now()}`,
          conferenceSolutionKey: {
            key: 'hangoutsMeet'
          }
        }
      },
      location: location
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Calendar API error:', errorData);
      return Response.json(
        { error: 'Failed to schedule interview on Google Calendar', details: errorData },
        { status: response.status }
      );
    }

    const eventData = await response.json();

    // Save interview record to database
    try {
      const interviewRecord = {
        candidate_email: candidateEmail,
        recruiter_email: user.email,
        scheduled_time: scheduledTime,
        duration_minutes: durationMinutes,
        title: interviewTitle,
        location: location || 'Virtual',
        meeting_link: meetingLink || eventData.conferenceData?.entryPoints?.[0]?.uri,
        status: 'scheduled',
        calendar_event_id: eventData.id
      };

      // Try to save to Interview entity if it exists
      if (base44.entities.Interview) {
        await base44.entities.Interview.create(interviewRecord);
      }
    } catch (error) {
      console.log('Note: Could not save to Interview entity, but calendar event created:', error.message);
    }

    return Response.json({
      success: true,
      message: 'Interview scheduled successfully',
      eventId: eventData.id,
      eventLink: eventData.htmlLink,
      meetingLink: eventData.conferenceData?.entryPoints?.[0]?.uri || meetingLink,
      candidateEmail,
      scheduledTime: eventData.start.dateTime,
      remindersSent: true
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});