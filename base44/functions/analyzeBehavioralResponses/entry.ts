import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id, responses } = await req.json();

    const application = await base44.entities.Application.filter({ id: application_id });
    if (!application || application.length === 0) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    const app = application[0];

    const prompt = `Analyze these behavioral interview responses to assess soft skills and cultural fit.

CANDIDATE: ${app.applicant_name}

RESPONSES:
${responses.map((r, i) => `Q${i + 1}: ${r.question}\nA: ${r.answer}`).join('\n\n')}

Provide deep psychological and behavioral insights:
1. Communication Style: Clarity, structure, emotional intelligence
2. Problem-Solving Approach: Analytical thinking, creativity, resilience
3. Teamwork & Collaboration: How they work with others
4. Leadership Qualities: Initiative, influence, decision-making
5. Cultural Fit Indicators: Values, work style, motivation
6. Red Flags or Concerns: Any concerning patterns
7. Overall Soft Skills Score (0-100)

Be specific and reference actual statements from their responses.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          communication_style: {
            type: "object",
            properties: {
              score: { type: "number" },
              analysis: { type: "string" }
            }
          },
          problem_solving: {
            type: "object",
            properties: {
              score: { type: "number" },
              analysis: { type: "string" }
            }
          },
          teamwork: {
            type: "object",
            properties: {
              score: { type: "number" },
              analysis: { type: "string" }
            }
          },
          leadership: {
            type: "object",
            properties: {
              score: { type: "number" },
              analysis: { type: "string" }
            }
          },
          cultural_fit: {
            type: "object",
            properties: {
              score: { type: "number" },
              analysis: { type: "string" }
            }
          },
          red_flags: {
            type: "array",
            items: { type: "string" }
          },
          key_strengths: {
            type: "array",
            items: { type: "string" }
          },
          overall_score: { type: "number" },
          summary: { type: "string" }
        }
      }
    });

    await base44.entities.Application.update(app.id, {
      behavioral_assessment: {
        questions: responses.map(r => ({ question: r.question, answer: r.answer })),
        responses: responses.map(r => r.answer),
        ai_analysis: response
      }
    });

    return Response.json({
      success: true,
      analysis: response
    });
  } catch (error) {
    console.error('Error analyzing responses:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});