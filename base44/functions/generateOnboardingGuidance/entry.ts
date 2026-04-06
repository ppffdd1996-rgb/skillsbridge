import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step, context } = await req.json();

    const stepPrompts = {
      welcome: `Welcome a new recruiter to SkillsBridge. Explain in 2-3 sentences what makes this platform unique: AI-powered candidate matching, skill-based hiring (no resumes), and verified talent pool. Keep it exciting and encouraging.`,
      
      profile: `Guide the user to set up their recruiter profile. Explain in 2-3 sentences why a complete profile helps: builds trust with candidates, improves match quality, and showcases company culture. Mention key fields: display name, bio, company info.`,
      
      opportunity: `Help the user create their first job opportunity. Explain in 2-3 sentences the benefits: AI will match qualified candidates automatically, required skills drive matching, and trial tasks help assess real work. Mention they can use the AI generator for help.`,
      
      matching: `Explain how SkillsBridge's matching works. In 2-3 sentences cover: AI analyzes skills and qualifications, match scores show compatibility, and candidates are pre-screened to save time. Mention the Applications page.`,
      
      complete: `Congratulate the user on completing onboarding! In 2-3 sentences, encourage them to: review incoming applications, use the interview assistant, and explore the admin dashboard for insights.`
    };

    const prompt = stepPrompts[step] || stepPrompts.welcome;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${prompt}\n\nUser context: ${JSON.stringify(context || {})}\n\nBe conversational, helpful, and concise.`,
      response_json_schema: {
        type: "object",
        properties: {
          message: { type: "string" },
          tips: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      guidance: response
    });
  } catch (error) {
    console.error('Error generating guidance:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});