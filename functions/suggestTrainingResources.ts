import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      skill_gaps = [],
      role,
      user_type,
      employee_email
    } = await req.json();

    if (skill_gaps.length === 0) {
      return Response.json({
        success: true,
        resources: []
      });
    }

    // Get existing skill verification reports for context
    let verificationReports = [];
    if (employee_email) {
      verificationReports = await base44.asServiceRole.entities.SkillVerificationReport.filter({
        user_email: employee_email
      });
    }

    const prompt = `As a learning and development expert, suggest specific training resources for these skill gaps:

Skill Gaps: ${skill_gaps.join(', ')}
Role: ${role}
User Type: ${user_type}

${verificationReports.length > 0 ? `
Context from verification reports:
${verificationReports.map(r => `- ${r.skill_name}: Score ${r.proficiency_score}/100, Areas for improvement: ${r.areas_for_improvement?.join(', ')}`).join('\n')}
` : ''}

For each skill gap, recommend 2-3 specific, actionable training resources. Include:
- Online courses (Coursera, Udemy, LinkedIn Learning)
- Internal documentation or wiki pages
- Hands-on projects or exercises
- Mentorship opportunities

Prioritize based on role requirements. Return JSON:

{
  "resources": [
    {
      "title": "Course/Resource Name",
      "description": "What they'll learn",
      "resource_url": "https://... or 'Internal Resource'",
      "priority": "high|medium|low",
      "estimated_hours": <number>,
      "skills_addressed": ["skill1", "skill2"]
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          resources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                resource_url: { type: "string" },
                priority: { type: "string" },
                estimated_hours: { type: "number" },
                skills_addressed: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      resources: response.resources,
      skill_gaps_addressed: skill_gaps
    });

  } catch (error) {
    console.error('Training suggestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});