import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id } = await req.json();

    if (!application_id) {
      return Response.json({ error: 'Application ID required' }, { status: 400 });
    }

    // Get application and opportunity details
    const application = await base44.asServiceRole.entities.Application.get(application_id);
    const opportunity = await base44.asServiceRole.entities.Opportunity.get(application.opportunity_id);

    // Get applicant's skills if available
    const applicantSkills = await base44.asServiceRole.entities.Skill.filter({
      user_email: application.applicant_email
    });

    const skillsList = applicantSkills.map(s => `${s.name} (${s.level})`).join(', ');

    const prompt = `You are an expert recruiter screening a job application. Analyze the candidate against the job requirements.

JOB DETAILS:
- Title: ${opportunity.title}
- Description: ${opportunity.description}
- Required Skills: ${opportunity.skills_required?.join(', ') || 'Not specified'}
- Required Qualifications: ${opportunity.required_qualifications?.join(', ') || 'Not specified'}
- Key Responsibilities: ${opportunity.key_responsibilities?.join(', ') || 'Not specified'}

CANDIDATE PROFILE:
- Name: ${application.applicant_name}
- Cover Letter: ${application.cover_letter || 'Not provided'}
- Skills: ${skillsList || 'Not specified'}
- Portfolio: ${application.portfolio_url ? 'Provided' : 'Not provided'}

Provide a comprehensive screening analysis including:
1. Overall match score (0-100)
2. Brief summary of candidate's qualifications
3. Key strengths that align with the role
4. Any concerns or gaps
5. Recommendation (Strong Fit / Good Fit / Moderate Fit / Poor Fit)`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          match_score: { type: "number" },
          summary: { type: "string" },
          strengths: {
            type: "array",
            items: { type: "string" }
          },
          concerns: {
            type: "array",
            items: { type: "string" }
          },
          recommendation: { type: "string" },
          detailed_analysis: { type: "string" }
        }
      }
    });

    // Update application with screening results
    await base44.asServiceRole.entities.Application.update(application_id, {
      match_score: response.match_score,
      ai_summary: response.summary,
      screening_notes: response.detailed_analysis,
      strengths: response.strengths,
      concerns: response.concerns,
      status: 'screening'
    });

    return Response.json({
      success: true,
      screening: response
    });
  } catch (error) {
    console.error('Screening error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});