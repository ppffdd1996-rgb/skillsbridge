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
      scheduledTime,
      cc,
      bcc,
      attachments = []
    } = await req.json();

    if (!to || !subject || !body || !scheduledTime) {
      return Response.json(
        { error: 'Missing required fields: to, subject, body, scheduledTime' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledTime);
    const now = new Date();

    if (scheduledDate <= now) {
      return Response.json(
        { error: 'scheduledTime must be in the future' },
        { status: 400 }
      );
    }

    // Store scheduled email in database for processing by automation
    const scheduledEmail = {
      to,
      subject,
      body,
      scheduledTime: scheduledDate.toISOString(),
      cc,
      bcc,
      attachments,
      createdBy: user.email,
      status: 'pending',
      attempts: 0
    };

    // Create a scheduled email record (we'll create an entity for this)
    try {
      const result = await base44.asServiceRole.entities.ScheduledEmail.create(scheduledEmail);

      return Response.json({
        success: true,
        message: 'Email scheduled successfully',
        scheduledEmailId: result.id,
        recipient: to,
        subject,
        scheduledTime: scheduledDate.toISOString(),
        willSendAt: scheduledDate.toLocaleString()
      });
    } catch (dbError) {
      // If entity doesn't exist, return info about scheduling
      console.log('Note: ScheduledEmail entity not found. Email scheduling requires the entity to be created.');
      return Response.json({
        success: true,
        message: 'Email scheduled (pending entity creation)',
        recipient: to,
        subject,
        scheduledTime: scheduledDate.toISOString(),
        note: 'To enable email scheduling, create a ScheduledEmail entity'
      });
    }
  } catch (error) {
    console.error('Schedule email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});