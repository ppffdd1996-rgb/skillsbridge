import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recruiter_email, days_ahead = 14 } = await req.json();

    // Get recruiter availability
    const availability = await base44.entities.RecruiterAvailability.filter({
      recruiter_email,
      active: true
    });

    if (availability.length === 0) {
      return Response.json({ 
        success: true, 
        slots: [],
        message: 'No availability set' 
      });
    }

    // Get existing interviews
    const existingInterviews = await base44.entities.Interview.filter({
      recruiter_email,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    const bookedTimes = existingInterviews.map(i => ({
      start: new Date(i.scheduled_time),
      end: new Date(new Date(i.scheduled_time).getTime() + i.duration_minutes * 60000)
    }));

    // Generate slots
    const slots = [];
    const now = new Date();
    const endDate = new Date(now.getTime() + days_ahead * 24 * 60 * 60 * 1000);

    for (let d = new Date(now); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);

      for (const avail of dayAvailability) {
        const [startHour, startMin] = avail.start_time.split(':').map(Number);
        const [endHour, endMin] = avail.end_time.split(':').map(Number);

        const slotStart = new Date(d);
        slotStart.setHours(startHour, startMin, 0, 0);

        const slotEnd = new Date(d);
        slotEnd.setHours(endHour, endMin, 0, 0);

        // Generate 60-minute slots
        for (let time = new Date(slotStart); time < slotEnd; time.setMinutes(time.getMinutes() + 60)) {
          const slotTime = new Date(time);
          
          // Skip if in the past
          if (slotTime <= now) continue;

          // Check if slot is booked
          const isBooked = bookedTimes.some(booked => 
            slotTime >= booked.start && slotTime < booked.end
          );

          if (!isBooked) {
            slots.push({
              start_time: slotTime.toISOString(),
              end_time: new Date(slotTime.getTime() + 60 * 60000).toISOString(),
              display: slotTime.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            });
          }
        }
      }
    }

    return Response.json({
      success: true,
      slots: slots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    });
  } catch (error) {
    console.error('Error generating slots:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});