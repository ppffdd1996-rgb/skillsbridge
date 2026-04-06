import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI Skill Verification Agent
 * Analyzes proof URLs and assigns verification scores
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skill_id } = await req.json();

    // Get the skill
    const skills = await base44.entities.Skill.filter({ id: skill_id });
    if (skills.length === 0) {
      return Response.json({ error: 'Skill not found' }, { status: 404 });
    }

    const skill = skills[0];

    // Only verify if proof provided
    if (!skill.proof_url) {
      return Response.json({ 
        success: false, 
        message: 'No proof provided' 
      });
    }

    // Use AI to analyze the proof
    const analysisPrompt = `Analyze this skill proof and provide a verification score (0-100):
    
Skill: ${skill.name}
Level claimed: ${skill.level}
Proof type: ${skill.proof_type}
Proof URL: ${skill.proof_url}

Consider:
- Relevance to the skill claimed
- Quality and depth of work
- Proficiency level demonstrated
- Authenticity

Return JSON with:
{
  "score": <number 0-100>,
  "verified_level": "<learning|competent|proficient|verified>",
  "reasoning": "<brief explanation>"
}`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number" },
          verified_level: { type: "string" },
          reasoning: { type: "string" }
        }
      }
    });

    // Update skill with verification
    await base44.asServiceRole.entities.Skill.update(skill_id, {
      verification_score: aiResponse.score,
      level: aiResponse.verified_level,
      verified_by: aiResponse.score >= 70 ? 'system' : 'self'
    });

    return Response.json({
      success: true,
      score: aiResponse.score,
      verified_level: aiResponse.verified_level,
      reasoning: aiResponse.reasoning
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});