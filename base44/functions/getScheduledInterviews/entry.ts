import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeMin, timeMax, searchQuery } = await req.json();

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    // Build query parameters
    const params = new URLSearchParams();
    params.append('maxResults', '250');
    params.append('orderBy', 'startTime');
    params.append('singleEvents', 'true');

    if (timeMin) params.append('timeMin', new Date(timeMin).toISOString());
    if (timeMax) params.append('timeMax', new Date(timeMax).toISOString());

    // Search for interview-related events
    if (searchQuery) {
      params.append('q', searchQuery);
    } else {
      params.append('q', 'interview');
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Calendar API error:', errorData);
      return Response.json(
        { error: 'Failed to fetch interviews', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format events
    const interviews = data.items?.map(event => ({
      id: event.id,
      title: event.summary,
      description: event.description,
      startTime: event.start.dateTime || event.start.date,
      endTime: event.end.dateTime || event.end.date,
      location: event.location,
      meetingLink: event.conferenceData?.entryPoints?.[0]?.uri || extractMeetingLink(event.description),
      attendees: event.attendees?.map(a => ({
        email: a.email,
        name: a.displayName,
        responseStatus: a.responseStatus
      })) || [],
      eventLink: event.htmlLink,
      status: event.status
    })) || [];

    return Response.json({
      success: true,
      totalResults: interviews.length,
      interviews
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractMeetingLink(description) {
  if (!description) return null;
  const match = description.match(/https:\/\/meet\.google\.com\/[^\s]+/);
  return match ? match[0] : null;
}