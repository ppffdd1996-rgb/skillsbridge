import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      hoursBeforeInterview = 24,
      includeRecruiter = true
    } = await req.json();

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    // Calculate time range for upcoming interviews
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + hoursBeforeInterview * 60 * 60 * 1000).toISOString();

    // Fetch upcoming interviews
    const params = new URLSearchParams();
    params.append('timeMin', timeMin);
    params.append('timeMax', timeMax);
    params.append('orderBy', 'startTime');
    params.append('singleEvents', 'true');
    params.append('q', 'interview');
    params.append('maxResults', '100');

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
      return Response.json(
        { error: 'Failed to fetch upcoming interviews', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const interviews = data.items || [];

    let remindersSent = 0;
    const remindersLog = [];

    // Send reminders for each upcoming interview
    for (const event of interviews) {
      try {
        const startTime = new Date(event.start.dateTime);
        const candidateAttendees = event.attendees?.filter(a => a.email !== user.email) || [];
        
        // Build reminder message
        const reminderMessage = `
Reminder: You have an interview coming up!

Interview: ${event.summary}
Scheduled Time: ${startTime.toLocaleString()}
Duration: Check your calendar invite for details

${event.location ? `Location: ${event.location}` : ''}

${event.conferenceData?.entryPoints?.[0]?.uri ? `Meeting Link: ${event.conferenceData.entryPoints[0].uri}` : ''}

${event.description ? `\nAdditional Details:\n${event.description}` : ''}

See you soon!
        `;

        // Send to candidates
        for (const attendee of candidateAttendees) {
          try {
            await base44.integrations.Core.SendEmail({
              to: attendee.email,
              subject: `Reminder: Interview with ${user.full_name || 'Recruiter'} - ${event.summary}`,
              body: reminderMessage,
              from_name: 'Interview Reminder'
            });
            remindersSent++;
            remindersLog.push({
              eventTitle: event.summary,
              recipientEmail: attendee.email,
              status: 'sent'
            });
          } catch (err) {
            console.log(`Failed to send reminder to ${attendee.email}:`, err.message);
            remindersLog.push({
              eventTitle: event.summary,
              recipientEmail: attendee.email,
              status: 'failed',
              error: err.message
            });
          }
        }

        // Send to recruiter if requested
        if (includeRecruiter && user.email) {
          const recruiterMessage = `
Interview Reminder

Event: ${event.summary}
Time: ${startTime.toLocaleString()}
Candidates: ${candidateAttendees.map(a => a.email).join(', ')}
${event.location ? `Location: ${event.location}` : 'Location: Virtual'}

Meeting Link: ${event.conferenceData?.entryPoints?.[0]?.uri || 'Check calendar invite'}
          `;

          try {
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: `Reminder: Upcoming Interview - ${event.summary}`,
              body: recruiterMessage,
              from_name: 'Interview Reminder'
            });
            remindersSent++;
            remindersLog.push({
              eventTitle: event.summary,
              recipientEmail: user.email,
              status: 'sent',
              note: 'recruiter'
            });
          } catch (err) {
            console.log(`Failed to send recruiter reminder:`, err.message);
          }
        }
      } catch (error) {
        console.log(`Error processing event ${event.summary}:`, error.message);
      }
    }

    return Response.json({
      success: true,
      message: `Interview reminders sent for ${interviews.length} upcoming interview(s)`,
      totalInterviewsFound: interviews.length,
      remindersSent,
      remindersLog
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});