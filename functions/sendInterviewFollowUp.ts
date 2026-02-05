import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      applicationId,
      candidateEmail,
      candidateName,
      interviewTitle,
      feedbackSummary,
      nextSteps,
      status,
      notes
    } = await req.json();

    if (!candidateEmail || !interviewTitle) {
      return Response.json(
        { error: 'Missing required fields: candidateEmail, interviewTitle' },
        { status: 400 }
      );
    }

    const gmailAccessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    // Build follow-up email based on status
    let subject = '';
    let emailBody = '';

    switch (status) {
      case 'positive':
        subject = `Interview Follow-Up: ${interviewTitle} - Great Conversation!`;
        emailBody = `
Dear ${candidateName || 'Candidate'},

Thank you so much for taking the time to interview with us today for the ${interviewTitle} position. We really enjoyed speaking with you and learning more about your background and experience.

Feedback Summary:
${feedbackSummary || 'Your interview went very well. We will be reviewing all candidates and will get back to you shortly.'}

Next Steps:
${nextSteps || 'We will be in touch within the next 3-5 business days with updates on the hiring process.'}

${notes ? `Additional Notes:\n${notes}` : ''}

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
${user.full_name || 'Recruiter'}
        `.trim();
        break;

      case 'feedback':
        subject = `Interview Follow-Up: ${interviewTitle} - Feedback`;
        emailBody = `
Dear ${candidateName || 'Candidate'},

Thank you for participating in the interview for the ${interviewTitle} position. We appreciate your time and effort.

Feedback:
${feedbackSummary || 'We have some areas we would like to discuss further.'}

Next Steps:
${nextSteps || 'Please let us know if you would like to proceed.'}

${notes ? `Additional Notes:\n${notes}` : ''}

We look forward to hearing from you.

Best regards,
${user.full_name || 'Recruiter'}
        `.trim();
        break;

      case 'offer':
        subject = `Exciting News: Offer for ${interviewTitle} Position`;
        emailBody = `
Dear ${candidateName || 'Candidate'},

We are thrilled to extend an offer for the ${interviewTitle} position! Your skills, experience, and interview performance impressed our team.

Offer Details:
${feedbackSummary || 'Please see the attached offer letter for complete details.'}

Next Steps:
${nextSteps || 'Please review the offer and let us know your decision. We look forward to working with you!'}

${notes ? `Additional Notes:\n${notes}` : ''}

Congratulations!

Best regards,
${user.full_name || 'Recruiter'}
        `.trim();
        break;

      case 'rejection':
        subject = `Interview Follow-Up: ${interviewTitle}`;
        emailBody = `
Dear ${candidateName || 'Candidate'},

Thank you for taking the time to interview for the ${interviewTitle} position. We truly appreciate your interest in our organization.

After careful consideration, we have decided to move forward with other candidates whose background more closely aligns with our current needs at this time.

${feedbackSummary ? `Feedback:\n${feedbackSummary}` : ''}

${nextSteps ? `Next Steps:\n${nextSteps}` : 'We encourage you to apply again in the future as new opportunities arise.'}

${notes ? `Additional Notes:\n${notes}` : ''}

Best regards,
${user.full_name || 'Recruiter'}
        `.trim();
        break;

      default:
        subject = `Interview Follow-Up: ${interviewTitle}`;
        emailBody = `
Dear ${candidateName || 'Candidate'},

Thank you for interviewing with us for the ${interviewTitle} position.

${feedbackSummary || ''}

${nextSteps || ''}

${notes ? `\n${notes}` : ''}

Best regards,
${user.full_name || 'Recruiter'}
        `.trim();
    }

    // Create message in RFC 2822 format
    const message = [
      `To: ${candidateEmail}`,
      `From: ${user.email}`,
      `Subject: ${subject}`,
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
      return Response.json(
        { error: 'Failed to send follow-up email', details: errorData },
        { status: gmailResponse.status }
      );
    }

    const gmailData = await gmailResponse.json();

    // Update application with follow-up sent timestamp
    if (applicationId) {
      try {
        await base44.asServiceRole.entities.Application.update(applicationId, {
          recruiter_notes: (recruiter_notes || '') + `\n[FOLLOW-UP SENT] ${new Date().toISOString()} - ${status || 'general'} follow-up email sent to ${candidateEmail}`
        });
      } catch (updateError) {
        console.log('Note: Could not update application record:', updateError.message);
      }
    }

    return Response.json({
      success: true,
      message: 'Follow-up email sent successfully',
      messageId: gmailData.id,
      recipientEmail: candidateEmail,
      status,
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send follow-up error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});