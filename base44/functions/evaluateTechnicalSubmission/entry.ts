import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id, submission } = await req.json();

    const application = await base44.entities.Application.filter({ id: application_id });
    if (!application || application.length === 0) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    const app = application[0];
    const challenge = JSON.parse(app.technical_assessment?.challenge || '{}');

    const prompt = `Evaluate this technical assessment submission as an expert technical interviewer.

CHALLENGE:
Title: ${challenge.title}
Requirements: ${challenge.requirements?.join(', ')}
Evaluation Criteria: ${challenge.evaluation_criteria?.map(c => `${c.criterion} (${c.weight}%)`).join(', ')}

CANDIDATE SUBMISSION:
${submission}

Provide a comprehensive evaluation with:
1. Overall score (0-100)
2. Scores for each evaluation criterion
3. Strengths demonstrated
4. Areas for improvement
5. Technical depth assessment
6. Code quality/professionalism (if applicable)
7. Whether this meets hiring standards

Be fair but thorough. Look for problem-solving approach, attention to requirements, and technical competence.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          criterion_scores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                criterion: { type: "string" },
                score: { type: "number" },
                feedback: { type: "string" }
              }
            }
          },
          strengths: {
            type: "array",
            items: { type: "string" }
          },
          improvements: {
            type: "array",
            items: { type: "string" }
          },
          technical_depth: { type: "string" },
          professionalism: { type: "string" },
          meets_standards: { type: "boolean" },
          summary: { type: "string" }
        }
      }
    });

    await base44.entities.Application.update(app.id, {
      technical_assessment: {
        ...app.technical_assessment,
        submitted: true,
        submission,
        ai_score: response.overall_score,
        ai_feedback: JSON.stringify(response),
        submitted_at: new Date().toISOString()
      }
    });

    return Response.json({
      success: true,
      evaluation: response
    });
  } catch (error) {
    console.error('Error evaluating submission:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});