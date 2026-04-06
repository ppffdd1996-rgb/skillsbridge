import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      to,
      subject,
      body,
      attachments = [],
      cc,
      bcc
    } = await req.json();

    if (!to || !subject || !body) {
      return Response.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    const gmailAccessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    // Build message headers
    let messageHeaders = `To: ${to}\r\nFrom: ${user.email}\r\nSubject: ${subject}\r\n`;
    if (cc) messageHeaders += `Cc: ${cc}\r\n`;
    if (bcc) messageHeaders += `Bcc: ${bcc}\r\n`;

    // Build multipart message
    const boundary = '--boundary' + Date.now();
    let message = messageHeaders + `MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // Add body
    message += `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: 7bit\r\n\r\n${body}\r\n`;

    // Add attachments
    for (const attachment of attachments) {
      try {
        const { fileUrl, fileName } = attachment;

        if (!fileUrl || !fileName) {
          console.log('Skipping invalid attachment:', attachment);
          continue;
        }

        // Download file
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          console.log(`Failed to download attachment: ${fileName}`);
          continue;
        }

        const fileData = await fileResponse.arrayBuffer();
        const base64File = btoa(String.fromCharCode(...new Uint8Array(fileData)));
        const mimeType = getMimeType(fileName);

        message += `--${boundary}\r\n`;
        message += `Content-Type: ${mimeType}; name="${fileName}"\r\n`;
        message += `Content-Transfer-Encoding: base64\r\n`;
        message += `Content-Disposition: attachment; filename="${fileName}"\r\n\r\n`;
        message += base64File + '\r\n';
      } catch (error) {
        console.log(`Error processing attachment ${attachment.fileName}:`, error.message);
      }
    }

    message += `--${boundary}--`;

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
        { error: 'Failed to send email', details: errorData },
        { status: gmailResponse.status }
      );
    }

    const gmailData = await gmailResponse.json();

    return Response.json({
      success: true,
      message: 'Email sent successfully with attachments',
      messageId: gmailData.id,
      recipient: to,
      subject,
      attachmentCount: attachments.length,
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send email with attachments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'zip': 'application/zip'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}