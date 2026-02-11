import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { opportunity_id, config_id } = await req.json();

    if (!opportunity_id) {
      return Response.json({ error: 'opportunity_id required' }, { status: 400 });
    }

    // Get opportunity
    const opportunity = await base44.asServiceRole.entities.Opportunity.filter({ id: opportunity_id });
    if (!opportunity || opportunity.length === 0) {
      return Response.json({ error: 'Opportunity not found' }, { status: 404 });
    }
    const opp = opportunity[0];

    // Get match configuration
    let config;
    if (config_id) {
      const configs = await base44.asServiceRole.entities.MatchConfiguration.filter({ id: config_id });
      config = configs.length > 0 ? configs[0] : null;
    }
    
    if (!config) {
      // Use default configuration
      config = {
        skill_weight: 0.4,
        experience_weight: 0.3,
        education_weight: 0.1,
        portfolio_weight: 0.2,
        required_skills: opp.skills_required || [],
        preferred_skills: []
      };
    }

    // Get all candidates
    const [users, skills, verificationReports] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Skill.list(),
      base44.asServiceRole.entities.SkillVerificationReport.list()
    ]);

    const candidates = users.filter(u => u.role !== 'admin');

    // Calculate enhanced matches
    const matches = [];

    for (const candidate of candidates) {
      const candidateSkills = skills.filter(s => s.user_email === candidate.email);
      const candidateVerifications = verificationReports.filter(r => r.user_email === candidate.email);

      // Prepare data for AI analysis
      const analysisData = {
        opportunity: {
          title: opp.title,
          description: opp.description,
          required_skills: opp.skills_required || [],
          required_qualifications: opp.required_qualifications || [],
          key_responsibilities: opp.key_responsibilities || []
        },
        candidate: {
          name: candidate.full_name || candidate.email,
          email: candidate.email,
          bio: candidate.bio || '',
          skills: candidateSkills.map(s => ({
            name: s.name,
            level: s.level,
            years_experience: s.years_experience,
            verification_score: s.verification_score
          })),
          education: candidate.education || [],
          experience_level: candidate.experience_level
        },
        configuration: {
          skill_weight: config.skill_weight,
          experience_weight: config.experience_weight,
          education_weight: config.education_weight,
          portfolio_weight: config.portfolio_weight,
          required_skills: config.required_skills,
          preferred_skills: config.preferred_skills
        }
      };

      // Use AI to analyze match
      const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Analyze this candidate-opportunity match and provide detailed scoring.

Opportunity: ${JSON.stringify(analysisData.opportunity, null, 2)}

Candidate: ${JSON.stringify(analysisData.candidate, null, 2)}

Configuration: ${JSON.stringify(analysisData.configuration, null, 2)}

Provide a detailed match analysis with:
1. Overall match score (0-100)
2. Skill match score (0-100) based on required and preferred skills
3. Experience match score (0-100)
4. Education match score (0-100)
5. Portfolio/proof match score (0-100)
6. List of matching skills (skills the candidate has that match requirements)
7. List of missing skills (required skills the candidate lacks)
8. Key strengths (top 3-5 reasons why this is a good match)
9. Areas of concern (top 3 things to consider)
10. Match reasoning (2-3 sentences explaining why this candidate matches or doesn't match)

Apply the configuration weights when calculating the overall score.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            skill_score: { type: "number" },
            experience_score: { type: "number" },
            education_score: { type: "number" },
            portfolio_score: { type: "number" },
            matching_skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  candidate_level: { type: "string" },
                  relevance: { type: "string" }
                }
              }
            },
            missing_skills: {
              type: "array",
              items: { type: "string" }
            },
            key_strengths: {
              type: "array",
              items: { type: "string" }
            },
            areas_of_concern: {
              type: "array",
              items: { type: "string" }
            },
            match_reasoning: { type: "string" }
          }
        }
      });

      matches.push({
        candidate_email: candidate.email,
        candidate_name: candidate.full_name || candidate.email,
        ...aiResponse,
        weighted_score: aiResponse.overall_score / 100
      });
    }

    // Sort by overall score
    matches.sort((a, b) => b.overall_score - a.overall_score);

    return Response.json({
      success: true,
      opportunity_id,
      total_candidates: matches.length,
      top_matches: matches.slice(0, 20),
      configuration: config
    });

  } catch (error) {
    console.error('Enhanced matching error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});