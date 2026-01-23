import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id } = await req.json();

    // Get application and opportunity details
    const application = await base44.entities.Application.filter({ id: application_id });
    if (!application || application.length === 0) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    const app = application[0];
    const opportunity = await base44.entities.Opportunity.filter({ id: app.opportunity_id });
    if (!opportunity || opportunity.length === 0) {
      return Response.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const opp = opportunity[0];

    const prompt = `As an expert hiring manager and interviewer, generate a comprehensive set of interview questions for the following scenario:

POSITION DETAILS:
- Role: ${opp.title}
- Company: ${opp.company_name}
- Industry: ${opp.industry}
- Key Responsibilities: ${opp.key_responsibilities?.join(', ')}
- Required Skills: ${opp.skills_required?.join(', ')}

CANDIDATE PROFILE:
- Name: ${app.applicant_name}
- Match Score: ${app.match_score}%
- Strengths: ${app.strengths?.join(', ') || 'N/A'}
- Concerns: ${app.concerns?.join(', ') || 'N/A'}
- AI Summary: ${app.ai_summary || 'N/A'}

Generate a structured interview guide with:

1. **Warm-up Questions** (2-3): Ice-breakers to make the candidate comfortable
2. **Technical/Role-Specific Questions** (5-7): Deep dive into required skills and experience
3. **Behavioral Questions** (4-6): Assess soft skills, teamwork, problem-solving
4. **Scenario-Based Questions** (3-4): Real-world situations related to the role
5. **Gap Analysis Questions** (2-3): Address any concerns or gaps identified in the screening
6. **Closing Questions** (2): Candidate questions and next steps

For each question, provide:
- The question itself
- What you're assessing
- Follow-up probes
- Red flags to watch for`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          warmup_questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                purpose: { type: "string" }
              }
            }
          },
          technical_questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                assessing: { type: "string" },
                followups: { type: "array", items: { type: "string" } },
                red_flags: { type: "array", items: { type: "string" } }
              }
            }
          },
          behavioral_questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                assessing: { type: "string" },
                followups: { type: "array", items: { type: "string" } }
              }
            }
          },
          scenario_questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                assessing: { type: "string" },
                ideal_response_hints: { type: "array", items: { type: "string" } }
              }
            }
          },
          gap_analysis_questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                concern: { type: "string" }
              }
            }
          },
          closing_questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                purpose: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      interview_guide: response
    });
  } catch (error) {
    console.error('Error generating interview questions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});