import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      date_range_start,
      date_range_end,
      interview_type = 'phone_screen',
      duration_minutes = 60
    } = await req.json();

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    // Fetch free/busy information
    const timeMin = date_range_start || new Date().toISOString();
    const timeMax = date_range_end || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const freeBusyResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: 'primary' }]
        })
      }
    );

    if (!freeBusyResponse.ok) {
      throw new Error('Failed to fetch calendar availability');
    }

    const freeBusyData = await freeBusyResponse.json();
    const busySlots = freeBusyData.calendars?.primary?.busy || [];

    // Generate available slots (9 AM - 5 PM, weekdays)
    const availableSlots = [];
    const start = new Date(timeMin);
    const end = new Date(timeMax);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      for (let hour = 9; hour < 17; hour++) {
        const slotStart = new Date(d);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration_minutes);

        // Check if slot conflicts with busy times
        const isConflict = busySlots.some(busy => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return (slotStart < busyEnd && slotEnd > busyStart);
        });

        if (!isConflict && slotEnd.getHours() <= 17) {
          availableSlots.push({
            slot_date: slotStart.toISOString().split('T')[0],
            start_time: `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`,
            end_time: `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`,
            duration_minutes,
            interview_type
          });
        }
      }
    }

    // Create or update slots in database
    const existingSlots = await base44.asServiceRole.entities.InterviewSlot.filter({
      recruiter_email: user.email
    });

    const slotsToCreate = [];
    for (const slot of availableSlots) {
      const exists = existingSlots.some(s => 
        s.slot_date === slot.slot_date && 
        s.start_time === slot.start_time &&
        s.recruiter_email === user.email
      );
      
      if (!exists) {
        slotsToCreate.push({
          ...slot,
          recruiter_email: user.email,
          recruiter_name: user.full_name || user.display_name,
          is_available: true
        });
      }
    }

    if (slotsToCreate.length > 0) {
      await base44.asServiceRole.entities.InterviewSlot.bulkCreate(slotsToCreate);
    }

    return Response.json({
      success: true,
      slots_created: slotsToCreate.length,
      total_available: availableSlots.length
    });

  } catch (error) {
    console.error('Sync availability error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});