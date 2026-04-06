import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, opportunity_id } = await req.json();

    const results = await Promise.all(messages.map(async (msg) => {
      try {
        // Send email
        await base44.integrations.Core.SendEmail({
          to: msg.recipient_email,
          subject: msg.subject,
          body: msg.body,
          from_name: user.display_name || user.full_name || 'SkillsBridge'
        });

        // Store message in database
        await base44.entities.Message.create({
          application_id: msg.application_id,
          opportunity_id,
          sender_email: user.email,
          recipient_email: msg.recipient_email,
          subject: msg.subject,
          body: msg.body,
          type: 'email',
          read: false
        });

        return {
          success: true,
          recipient: msg.recipient_email
        };
      } catch (error) {
        console.error(`Failed to send to ${msg.recipient_email}:`, error);
        return {
          success: false,
          recipient: msg.recipient_email,
          error: error.message
        };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return Response.json({
      success: true,
      sent: successCount,
      failed: failCount,
      results
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});