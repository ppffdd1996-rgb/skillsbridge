import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Automation-triggered: OfferLetter updated to "signed"
    let offerId = body.offer_id;
    if (!offerId && body.event && body.event.entity_name === 'OfferLetter' && body.data && body.data.signature_status === 'signed') {
      offerId = body.event.entity_id || body.data.id;
    }

    if (!offerId) return Response.json({ error: 'offer_id required' }, { status: 400 });

    const offer = await base44.asServiceRole.entities.OfferLetter.get(offerId);
    if (!offer) return Response.json({ error: 'Offer not found' }, { status: 404 });
    if (offer.signature_status !== 'signed') {
      return Response.json({ error: 'Offer is not accepted yet' }, { status: 400 });
    }

    // Avoid duplicate onboarding generation
    const existing = await base44.asServiceRole.entities.OnboardingTask.filter({
      employee_email: offer.candidate_email,
      start_date: offer.start_date
    });
    if (existing && existing.length > 0) {
      return Response.json({ success: true, message: 'Onboarding already started', tasks_created: existing.length });
    }

    // Resolve opportunity for role/department context
    let opportunity = null;
    if (offer.opportunity_id) {
      try { opportunity = await base44.asServiceRole.entities.Opportunity.get(offer.opportunity_id); } catch (e) {}
    }
    const jobTitle = offer.job_title || opportunity?.title || 'your new role';
    const department = opportunity?.department || opportunity?.category || 'the team';
    const startDate = offer.start_date;

    // Generate a personalized pre-boarding checklist via LLM
    let checklist = null;
    try {
      checklist = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Create a personalized first-day preparation checklist for a new hire who just accepted a job offer.

Employee Name: ${offer.candidate_name}
Role: ${jobTitle}
Department: ${department}
Start Date: ${startDate}
Salary: ${offer.salary || 'As discussed'}
Benefits: ${offer.benefits || 'Standard benefits'}

Generate:
1. A warm, personalized welcome message (2 short paragraphs) celebrating their acceptance and preparing them for day one.
2. 6-8 pre-boarding / first-day checklist tasks. Each task should help the candidate prepare (e.g. complete paperwork, set up accounts, review materials, plan commute, etc.). For each task provide: title, description, category (one of: pre-boarding, day-1, first-week), and days_offset (number of days from start date — use negative numbers for pre-boarding tasks before day 1, 0 for day-1).

Return JSON only.`,
        response_json_schema: {
          type: 'object',
          properties: {
            welcome_message: { type: 'string' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  days_offset: { type: 'number' }
                }
              }
            }
          }
        }
      });
    } catch (e) {
      console.log('Onboarding LLM failed:', e?.message || e);
    }

    const welcomeMessage = checklist?.welcome_message || `Welcome aboard, ${offer.candidate_name}! We're thrilled you've accepted the offer for ${jobTitle}. This checklist will help you prepare for a smooth first day on ${startDate}.`;
    const tasks = Array.isArray(checklist?.tasks) && checklist.tasks.length > 0 ? checklist.tasks : [
      { title: 'Review your offer letter', description: 'Re-read your signed offer letter and keep a copy for your records.', category: 'pre-boarding', days_offset: -5 },
      { title: 'Complete new-hire paperwork', description: 'Fill out any HR forms (tax, direct deposit, emergency contacts) sent to you before day one.', category: 'pre-boarding', days_offset: -3 },
      { title: 'Set up your accounts', description: 'Activate your email and any internal tools you were invited to.', category: 'pre-boarding', days_offset: -1 },
      { title: 'Plan your first-day logistics', description: 'Confirm your start time, building access, dress code, and commute.', category: 'pre-boarding', days_offset: -1 },
      { title: 'Meet your manager and team', description: 'Get introduced to your manager and immediate teammates.', category: 'day-1', days_offset: 0 },
      { title: 'Review week-one schedule', description: 'Go through your orientation and onboarding sessions for the first week.', category: 'first-week', days_offset: 1 }
    ];

    // Create OnboardingTask records
    const startDateObj = new Date(startDate);
    const createdTasks = await Promise.all(tasks.map(task => {
      const scheduled = new Date(startDateObj);
      scheduled.setDate(scheduled.getDate() + (task.days_offset || 0));
      return base44.asServiceRole.entities.OnboardingTask.create({
        employee_email: offer.candidate_email,
        employee_name: offer.candidate_name,
        start_date: startDate,
        task_title: task.title,
        task_category: task.category,
        scheduled_date: scheduled.toISOString(),
        description: task.description,
        assigned_to: offer.recruiter_email,
        status: 'pending'
      });
    }));

    // Email the candidate the personalized welcome + checklist
    const checklistLines = tasks.map((t, i) => `${i + 1}. [${t.category}] ${t.title} — ${t.description}`).join('\n');
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: offer.candidate_email,
        subject: `Welcome to ${jobTitle}! Your first-day preparation checklist`,
        body: `Hi ${offer.candidate_name},\n\n${welcomeMessage}\n\nHere is your personalized pre-boarding checklist to help you prepare for your first day on ${startDate}:\n\n${checklistLines}\n\nYou can track your progress anytime by logging into SkillsBridge and visiting your Onboarding page.\n\nWe can't wait to have you on the team!\n\nBest regards,\nThe Hiring Team`,
        from_name: 'SkillsBridge Onboarding'
      });
    } catch (e) {
      console.log('Onboarding email failed:', e?.message || e);
    }

    return Response.json({
      success: true,
      offer_id: offerId,
      tasks_created: createdTasks.length,
      welcome_message: welcomeMessage
    });
  } catch (error) {
    console.error('startCandidateOnboarding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});