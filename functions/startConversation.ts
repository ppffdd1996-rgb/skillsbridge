import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      recipient_email,
      recipient_name,
      application_id,
      interview_id,
      opportunity_id,
      initial_message
    } = await req.json();

    if (!recipient_email) {
      return Response.json({ error: 'recipient_email required' }, { status: 400 });
    }

    // Check if conversation already exists
    const existingConversations = await base44.asServiceRole.entities.Conversation.filter({
      status: 'active'
    });

    let conversation = existingConversations.find(c =>
      c.participants.includes(user.email) &&
      c.participants.includes(recipient_email) &&
      c.application_id === application_id &&
      c.interview_id === interview_id
    );

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await base44.asServiceRole.entities.Conversation.create({
        participants: [user.email, recipient_email],
        participant_names: [user.full_name || user.display_name, recipient_name],
        application_id,
        interview_id,
        opportunity_id,
        status: 'active',
        unread_count: {}
      });
    }

    // Send initial message if provided
    if (initial_message) {
      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversation.id,
        application_id,
        opportunity_id,
        sender_email: user.email,
        recipient_email,
        subject: 'Chat Message',
        body: initial_message,
        type: 'chat',
        read: false
      });

      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        last_message: initial_message.substring(0, 100),
        last_message_at: new Date().toISOString(),
        last_message_sender: user.email
      });
    }

    return Response.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});