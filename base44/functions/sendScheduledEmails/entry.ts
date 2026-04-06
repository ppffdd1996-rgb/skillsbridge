import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const gmailAccessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');
    const now = new Date();

    // Get all pending scheduled emails where scheduledTime <= now
    const scheduledEmails = await base44.asServiceRole.entities.ScheduledEmail.filter({
      status: 'pending'
    });

    const readyEmails = scheduledEmails.filter(email => {
      const scheduledTime = new Date(email.scheduledTime);
      return scheduledTime <= now;
    });

    const results = {
      total: readyEmails.length,
      sent: 0,
      failed: 0,
      details: []
    };

    for (const email of readyEmails) {
      try {
        // Build multipart message
        const boundary = '--boundary' + Date.now() + Math.random();
        let messageHeaders = `To: ${email.to}\r\nSubject: ${email.subject}\r\n`;
        if (email.cc) messageHeaders += `Cc: ${email.cc}\r\n`;
        if (email.bcc) messageHeaders += `Bcc: ${email.bcc}\r\n`;

        let message = messageHeaders + `MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
        message += `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: 7bit\r\n\r\n${email.body}\r\n`;

        // Add attachments if present
        if (email.attachments && email.attachments.length > 0) {
          for (const attachment of email.attachments) {
            try {
              const { fileUrl, fileName } = attachment;
              if (!fileUrl || !fileName) continue;

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
            } catch (attachError) {
              console.log(`Error processing attachment ${attachment.fileName}:`, attachError.message);
            }
          }
        }

        message += `--${boundary}--`;

        const encodedMessage = btoa(message)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');

        // Send via Gmail API
        const gmailResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gmailAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: encodedMessage })
        });

        if (gmailResponse.ok) {
          const gmailData = await gmailResponse.json();

          // Update record as sent
          await base44.asServiceRole.entities.ScheduledEmail.update(email.id, {
            status: 'sent',
            sentAt: new Date().toISOString()
          });

          results.sent++;
          results.details.push({
            emailId: email.id,
            recipient: email.to,
            status: 'sent',
            messageId: gmailData.id
          });
        } else {
          const errorData = await gmailResponse.text();
          const attempts = (email.attempts || 0) + 1;
          const maxAttempts = 5;

          if (attempts >= maxAttempts) {
            // Max attempts reached, mark as failed
            await base44.asServiceRole.entities.ScheduledEmail.update(email.id, {
              status: 'failed',
              attempts,
              lastError: `Failed after ${maxAttempts} attempts: ${errorData.substring(0, 100)}`
            });

            results.failed++;
            results.details.push({
              emailId: email.id,
              recipient: email.to,
              status: 'failed',
              error: `Max attempts reached (${maxAttempts})`
            });
          } else {
            // Retry later
            await base44.asServiceRole.entities.ScheduledEmail.update(email.id, {
              attempts,
              lastError: errorData.substring(0, 100)
            });

            results.details.push({
              emailId: email.id,
              recipient: email.to,
              status: 'retry',
              attempt: attempts,
              error: 'Will retry at next scheduled check'
            });
          }
        }
      } catch (error) {
        console.error('Error processing scheduled email:', error);

        const attempts = (email.attempts || 0) + 1;
        const maxAttempts = 5;

        if (attempts >= maxAttempts) {
          await base44.asServiceRole.entities.ScheduledEmail.update(email.id, {
            status: 'failed',
            attempts,
            lastError: error.message
          });

          results.failed++;
        } else {
          await base44.asServiceRole.entities.ScheduledEmail.update(email.id, {
            attempts,
            lastError: error.message
          });
        }

        results.details.push({
          emailId: email.id,
          recipient: email.to,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `Processed ${results.total} scheduled emails`,
      results
    });
  } catch (error) {
    console.error('Send scheduled emails error:', error);
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