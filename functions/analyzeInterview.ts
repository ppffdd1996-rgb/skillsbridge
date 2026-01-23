import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id, interview_notes } = await req.json();

    if (!interview_notes || interview_notes.trim().length < 50) {
      return Response.json({ error: 'Interview notes too short for analysis' }, { status: 400 });
    }

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

    const prompt = `As an expert hiring analyst, analyze this interview and provide comprehensive feedback.

POSITION REQUIREMENTS:
- Role: ${opp.title}
- Key Responsibilities: ${opp.key_responsibilities?.join(', ')}
- Required Skills: ${opp.skills_required?.join(', ')}
- Required Qualifications: ${opp.required_qualifications?.join(', ')}

CANDIDATE PROFILE:
- Name: ${app.applicant_name}
- Pre-interview Match Score: ${app.match_score}%
- Initial Strengths: ${app.strengths?.join(', ') || 'N/A'}
- Initial Concerns: ${app.concerns?.join(', ') || 'N/A'}

INTERVIEW NOTES/TRANSCRIPT:
${interview_notes}

Provide a detailed analysis including:

1. **Executive Summary**: 2-3 sentence overview of the candidate's performance
2. **Key Strengths**: What the candidate excelled at during the interview
3. **Areas of Concern**: Weaknesses or gaps revealed during the interview
4. **Technical Assessment**: How well they demonstrated required technical skills
5. **Cultural Fit**: Assessment of soft skills, communication, and team fit
6. **Hiring Recommendation**: Clear recommendation (Strong Hire / Hire / Maybe / No Hire) with reasoning
7. **Next Steps**: Suggested follow-up actions

Be specific and reference actual responses from the notes.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          key_strengths: {
            type: "array",
            items: { type: "string" }
          },
          areas_of_concern: {
            type: "array",
            items: { type: "string" }
          },
          technical_assessment: {
            type: "object",
            properties: {
              score: { type: "number" },
              details: { type: "string" }
            }
          },
          cultural_fit: {
            type: "object",
            properties: {
              score: { type: "number" },
              details: { type: "string" }
            }
          },
          communication_skills: {
            type: "object",
            properties: {
              score: { type: "number" },
              details: { type: "string" }
            }
          },
          overall_score: { type: "number" },
          recommendation: {
            type: "string",
            enum: ["strong_hire", "hire", "maybe", "no_hire"]
          },
          recommendation_reasoning: { type: "string" },
          next_steps: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: response
    });
  } catch (error) {
    console.error('Error analyzing interview:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});