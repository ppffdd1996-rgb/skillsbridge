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
      cancellationReason
    } = await req.json();

    if (!eventId) {
      return Response.json(
        { error: 'Missing required field: eventId' },
        { status: 400 }
      );
    }

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    // First, get the event details before deletion
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
    const candidateEmails = event.attendees
      ?.filter(a => a.email !== user.email)
      .map(a => a.email) || [];

    // Delete the event
    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.text();
      return Response.json(
        { error: 'Failed to cancel interview', details: errorData },
        { status: deleteResponse.status }
      );
    }

    // Send cancellation email notification to candidates
    try {
      const emailBody = `Your interview "${event.summary}" scheduled for ${event.start.dateTime} has been cancelled.${
        cancellationReason ? `\n\nReason: ${cancellationReason}` : ''
      }\n\nPlease contact us if you have any questions.`;

      for (const candidateEmail of candidateEmails) {
        await base44.integrations.Core.SendEmail({
          to: candidateEmail,
          subject: `Interview Cancelled: ${event.summary}`,
          body: emailBody,
          from_name: 'Interview Scheduling'
        });
      }
    } catch (emailError) {
      console.log('Note: Could not send cancellation emails:', emailError.message);
    }

    return Response.json({
      success: true,
      message: 'Interview cancelled successfully',
      eventId,
      eventTitle: event.summary,
      candidatesNotified: candidateEmails,
      cancellationReason: cancellationReason || 'No reason provided'
    });
  } catch (error) {
    console.error('Cancel interview error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});