import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      candidateEmails,
      subject,
      body,
      opportunityTitle,
      opportunityLink
    } = await req.json();

    if (!candidateEmails || !Array.isArray(candidateEmails) || candidateEmails.length === 0) {
      return Response.json(
        { error: 'Missing or invalid candidateEmails array' },
        { status: 400 }
      );
    }

    if (!subject || !body) {
      return Response.json(
        { error: 'Missing required fields: subject, body' },
        { status: 400 }
      );
    }

    const gmailAccessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    const sentResults = [];
    const failedResults = [];

    for (const candidateEmail of candidateEmails) {
      try {
        // Build personalized email body
        let personalizedBody = body;
        if (opportunityTitle) {
          personalizedBody += `\n\nOpportunity: ${opportunityTitle}`;
        }
        if (opportunityLink) {
          personalizedBody += `\nView Details: ${opportunityLink}`;
        }

        // Create message in RFC 2822 format
        const message = [
          `To: ${candidateEmail}`,
          `From: ${user.email}`,
          `Subject: ${subject}`,
          `Content-Type: text/plain; charset="UTF-8"`,
          `Content-Transfer-Encoding: 7bit`,
          ``,
          personalizedBody
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

        if (gmailResponse.ok) {
          const gmailData = await gmailResponse.json();
          sentResults.push({
            email: candidateEmail,
            status: 'sent',
            messageId: gmailData.id
          });
        } else {
          const errorData = await gmailResponse.text();
          failedResults.push({
            email: candidateEmail,
            status: 'failed',
            error: errorData
          });
        }
      } catch (error) {
        failedResults.push({
          email: candidateEmail,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: sentResults.length > 0,
      totalCandidates: candidateEmails.length,
      sentCount: sentResults.length,
      failedCount: failedResults.length,
      sent: sentResults,
      failed: failedResults
    });
  } catch (error) {
    console.error('Send outreach error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});