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
      scheduledTime,
      duration = 60,
      location,
      meetingLink,
      additionalNotes,
      jobTitle
    } = await req.json();

    if (!candidateEmail || !interviewTitle || !scheduledTime) {
      return Response.json(
        { error: 'Missing required fields: candidateEmail, interviewTitle, scheduledTime' },
        { status: 400 }
      );
    }

    const gmailAccessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    const startDateTime = new Date(scheduledTime);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // Build email body
    const emailBody = `
Dear ${candidateName || 'Candidate'},

We're excited to invite you to an interview!

Interview Details:
─────────────────────────────────────
Title: ${interviewTitle}
${jobTitle ? `Position: ${jobTitle}` : ''}
Scheduled Date & Time: ${startDateTime.toLocaleString()}
Duration: ${duration} minutes
${location ? `Location: ${location}` : 'Location: Virtual'}
${meetingLink ? `Meeting Link: ${meetingLink}` : ''}

${additionalNotes ? `Additional Information:\n${additionalNotes}` : ''}

Please confirm your availability by clicking the calendar invite link in your email.

If you need to reschedule, please let us know as soon as possible.

Best regards,
${user.full_name || 'Recruiter'}
    `.trim();

    // Create message in RFC 2822 format
    const message = [
      `To: ${candidateEmail}`,
      `From: ${user.email}`,
      `Subject: Interview Invitation: ${interviewTitle}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      emailBody
    ].join('\r\n');

    const encodedMessage = btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const gmailResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gmailAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!gmailResponse.ok) {
      const errorData = await gmailResponse.text();
      console.error('Gmail API error:', errorData);
      return Response.json(
        { error: 'Failed to send invitation', details: errorData },
        { status: gmailResponse.status }
      );
    }

    const gmailData = await gmailResponse.json();

    return Response.json({
      success: true,
      message: 'Interview invitation sent successfully',
      messageId: gmailData.id,
      recipientEmail: candidateEmail,
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});