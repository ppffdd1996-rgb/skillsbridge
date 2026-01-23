import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_ids, message_type, custom_context } = await req.json();

    const applications = await Promise.all(
      application_ids.map(id => base44.entities.Application.filter({ id }))
    );

    const messages = await Promise.all(applications.map(async (appArray) => {
      const app = appArray[0];
      if (!app) return null;

      const opportunity = await base44.entities.Opportunity.filter({ id: app.opportunity_id });
      const opp = opportunity[0];

      const context = {
        candidate_name: app.applicant_name,
        position: opp?.title,
        company: opp?.company_name,
        status: app.status,
        match_score: app.match_score,
        strengths: app.strengths,
        technical_score: app.technical_assessment?.ai_score,
        behavioral_score: app.behavioral_assessment?.ai_analysis?.overall_score,
        custom_context
      };

      const messageTemplates = {
        screening_positive: `Draft a professional email inviting ${context.candidate_name} to the next stage for ${context.position} at ${context.company}. Mention their strong match (${context.match_score}% match) and highlight their key strengths: ${context.strengths?.join(', ')}. Keep it warm and encouraging.`,
        
        screening_negative: `Draft a respectful rejection email for ${context.candidate_name} regarding ${context.position} at ${context.company}. Be kind, thank them for their interest, and encourage them to apply for future opportunities. Keep it professional and empathetic.`,
        
        interview_invitation: `Draft an interview invitation email for ${context.candidate_name} for ${context.position} at ${context.company}. Include that we were impressed by their application (${context.match_score}% match) and would like to schedule an interview. Ask for their availability.`,
        
        assessment_request: `Draft an email asking ${context.candidate_name} to complete a technical assessment for ${context.position}. Explain that this is the next step and provide encouragement based on their strong profile.`,
        
        offer_extended: `Draft an exciting job offer email for ${context.candidate_name} for ${context.position} at ${context.company}. Congratulate them and express enthusiasm about having them join the team.`,
        
        follow_up: `Draft a follow-up email to ${context.candidate_name} regarding their application for ${context.position}. Check in on their continued interest and provide an update on the process.`,
        
        custom: custom_context || `Draft a professional email to ${context.candidate_name} about ${context.position}.`
      };

      const prompt = messageTemplates[message_type] || messageTemplates.custom;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompt}\n\nGenerate a professional, personalized email with subject and body.`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          }
        }
      });

      return {
        application_id: app.id,
        recipient_email: app.applicant_email,
        recipient_name: app.applicant_name,
        ...response
      };
    }));

    return Response.json({
      success: true,
      messages: messages.filter(m => m !== null)
    });
  } catch (error) {
    console.error('Error drafting messages:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});