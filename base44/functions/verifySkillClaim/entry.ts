import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id, skill, claimed_level, evidence_url } = await req.json();

    const application = await base44.entities.Application.filter({ id: application_id });
    if (!application || application.length === 0) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    const app = application[0];

    // Fetch evidence if URL provided
    let evidenceContent = null;
    if (evidence_url) {
      try {
        const evidenceFetch = await fetch(evidence_url);
        evidenceContent = await evidenceFetch.text();
      } catch (error) {
        evidenceContent = `Could not fetch evidence from URL: ${evidence_url}`;
      }
    }

    const prompt = `As a technical skills verification expert, verify this skill claim.

CANDIDATE: ${app.applicant_name}
SKILL CLAIMED: ${skill}
PROFICIENCY LEVEL CLAIMED: ${claimed_level}

EVIDENCE PROVIDED:
${evidenceContent ? evidenceContent.slice(0, 3000) : 'No direct evidence URL provided'}

ADDITIONAL CONTEXT:
- Portfolio: ${app.portfolio_url || 'N/A'}
- Cover Letter mentions: ${app.cover_letter?.includes(skill) ? 'Yes' : 'No'}

Based on the evidence, assess:
1. Verification Confidence Score (0-100): How confident are you this skill claim is accurate?
2. Actual Proficiency Level: beginner/intermediate/advanced/expert
3. Evidence Quality: How strong is the evidence?
4. Verification Status: verified/partially_verified/unverified/suspicious
5. Specific findings from the evidence
6. Recommendations for the recruiter

Be thorough but fair. Look for concrete demonstrations of the skill.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          confidence_score: { type: "number" },
          actual_level: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced", "expert", "unverifiable"]
          },
          evidence_quality: {
            type: "string",
            enum: ["strong", "moderate", "weak", "none"]
          },
          verification_status: {
            type: "string",
            enum: ["verified", "partially_verified", "unverified", "suspicious"]
          },
          findings: {
            type: "array",
            items: { type: "string" }
          },
          discrepancies: {
            type: "array",
            items: { type: "string" }
          },
          recommendation: { type: "string" }
        }
      }
    });

    const existingVerifications = app.skill_verifications || [];
    const newVerification = {
      skill,
      claimed_level,
      evidence_url,
      verified: response.verification_status === 'verified',
      ai_verification_score: response.confidence_score,
      ai_notes: JSON.stringify(response)
    };

    await base44.entities.Application.update(app.id, {
      skill_verifications: [...existingVerifications, newVerification]
    });

    return Response.json({
      success: true,
      verification: response
    });
  } catch (error) {
    console.error('Error verifying skill:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});