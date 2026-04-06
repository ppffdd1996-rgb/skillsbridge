import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      fileId,
      candidateEmail,
      permission = 'reader',
      sendNotification = true,
      message
    } = await req.json();

    if (!fileId || !candidateEmail) {
      return Response.json(
        { error: 'Missing required fields: fileId, candidateEmail' },
        { status: 400 }
      );
    }

    const driveAccessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // Create permission
    const permissionData = {
      type: 'user',
      role: permission,
      emailAddress: candidateEmail
    };

    const permissionResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=${sendNotification}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${driveAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(permissionData)
      }
    );

    if (!permissionResponse.ok) {
      const errorData = await permissionResponse.text();
      return Response.json(
        { error: 'Failed to share document', details: errorData },
        { status: permissionResponse.status }
      );
    }

    const permission_obj = await permissionResponse.json();

    // Get file details for link
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,webViewLink`,
      {
        headers: {
          'Authorization': `Bearer ${driveAccessToken}`
        }
      }
    );

    let fileName = 'Document';
    let fileLink = '';

    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      fileName = fileData.name;
      fileLink = fileData.webViewLink;
    }

    // Send email notification if requested
    if (sendNotification && message) {
      try {
        const emailBody = `
Dear Candidate,

I would like to share the following document with you:

Document: ${fileName}
Link: ${fileLink}

${message || ''}

Best regards,
${user.full_name || 'Recruiter'}
        `.trim();

        await base44.integrations.Core.SendEmail({
          to: candidateEmail,
          subject: `Document Shared: ${fileName}`,
          body: emailBody,
          from_name: 'Interview Team'
        });
      } catch (emailError) {
        console.log('Note: Could not send notification email:', emailError.message);
      }
    }

    return Response.json({
      success: true,
      message: 'Document shared successfully',
      fileName,
      fileLink,
      sharedWith: candidateEmail,
      permission: permission,
      notificationSent: sendNotification
    });
  } catch (error) {
    console.error('Share document error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});