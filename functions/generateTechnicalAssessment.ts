import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id } = await req.json();

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

    const prompt = `Create a practical technical assessment for a ${opp.title} position.

ROLE REQUIREMENTS:
- Skills: ${opp.skills_required?.join(', ')}
- Responsibilities: ${opp.key_responsibilities?.join(', ')}

CANDIDATE PROFILE:
- Strengths: ${app.strengths?.join(', ') || 'N/A'}
- Areas to assess: ${app.concerns?.join(', ') || 'General competency'}

Create a realistic, practical challenge that:
1. Tests the most critical 2-3 skills for this role
2. Can be completed in 1-2 hours
3. Produces tangible output (code, design, document, etc.)
4. Includes clear success criteria

Format: Problem description, requirements, deliverables, evaluation criteria, and time limit.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          skills_tested: {
            type: "array",
            items: { type: "string" }
          },
          requirements: {
            type: "array",
            items: { type: "string" }
          },
          deliverables: {
            type: "array",
            items: { type: "string" }
          },
          evaluation_criteria: {
            type: "array",
            items: {
              type: "object",
              properties: {
                criterion: { type: "string" },
                weight: { type: "number" }
              }
            }
          },
          time_limit: { type: "string" },
          starter_template: { type: "string" }
        }
      }
    });

    await base44.entities.Application.update(app.id, {
      technical_assessment: {
        challenge: JSON.stringify(response),
        submitted: false
      }
    });

    return Response.json({
      success: true,
      assessment: response
    });
  } catch (error) {
    console.error('Error generating assessment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});