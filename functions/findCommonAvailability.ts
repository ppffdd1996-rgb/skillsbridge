import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      candidate_email,
      recruiter_emails = [],
      interview_type = 'phone_screen',
      date_range_days = 14
    } = await req.json();

    if (!candidate_email) {
      return Response.json({ error: 'candidate_email required' }, { status: 400 });
    }

    // Get all available slots from specified recruiters
    let availableSlots = await base44.asServiceRole.entities.InterviewSlot.filter({
      is_available: true
    });

    if (recruiter_emails.length > 0) {
      availableSlots = availableSlots.filter(slot => 
        recruiter_emails.includes(slot.recruiter_email)
      );
    }

    // Filter by interview type and date range
    const today = new Date();
    const maxDate = new Date(today.getTime() + date_range_days * 24 * 60 * 60 * 1000);

    availableSlots = availableSlots.filter(slot => {
      const slotDate = new Date(slot.slot_date);
      return slotDate >= today && 
             slotDate <= maxDate &&
             (!slot.interview_type || slot.interview_type === interview_type);
    });

    // Group by date for easy display
    const slotsByDate = {};
    availableSlots.forEach(slot => {
      if (!slotsByDate[slot.slot_date]) {
        slotsByDate[slot.slot_date] = [];
      }
      slotsByDate[slot.slot_date].push(slot);
    });

    return Response.json({
      success: true,
      available_slots: availableSlots,
      slots_by_date: slotsByDate,
      total_slots: availableSlots.length
    });

  } catch (error) {
    console.error('Find availability error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});