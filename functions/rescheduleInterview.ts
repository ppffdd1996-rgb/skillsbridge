import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      eventId,
      newScheduledTime,
      durationMinutes = 60,
      notificationMessage
    } = await req.json();

    if (!eventId || !newScheduledTime) {
      return Response.json(
        { error: 'Missing required fields: eventId, newScheduledTime' },
        { status: 400 }
      );
    }

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    // First, get the existing event
    const getResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!getResponse.ok) {
      return Response.json(
        { error: 'Failed to fetch event' },
        { status: getResponse.status }
      );
    }

    const event = await getResponse.json();

    // Calculate new times
    const startDateTime = new Date(newScheduledTime);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    // Update event with new times
    event.start = {
      dateTime: startDateTime.toISOString(),
      timeZone: 'UTC'
    };
    event.end = {
      dateTime: endDateTime.toISOString(),
      timeZone: 'UTC'
    };

    // Add reschedule note to description
    if (notificationMessage) {
      event.description = (event.description || '') + `\n\n[RESCHEDULED] ${notificationMessage}`;
    } else {
      event.description = (event.description || '') + `\n\n[RESCHEDULED] This interview has been rescheduled. New time: ${startDateTime.toLocaleString()}`;
    }

    // Update the event
    const updateResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start: event.start,
          end: event.end,
          description: event.description
        })
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      return Response.json(
        { error: 'Failed to reschedule interview', details: errorData },
        { status: updateResponse.status }
      );
    }

    const updatedEvent = await updateResponse.json();

    return Response.json({
      success: true,
      message: 'Interview rescheduled successfully',
      eventId: updatedEvent.id,
      newStartTime: updatedEvent.start.dateTime,
      newEndTime: updatedEvent.end.dateTime,
      attendees: updatedEvent.attendees?.map(a => a.email) || []
    });
  } catch (error) {
    console.error('Reschedule interview error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});