import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Trust Score Calculator
 * NOT social reputation - based on verified actions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_email } = await req.json();
    const targetEmail = user_email || user.email;

    // Get user's verified skills
    const skills = await base44.asServiceRole.entities.Skill.filter({ 
      user_email: targetEmail 
    });
    const verifiedSkills = skills.filter(s => s.verified_by !== 'self');

    // Get completed matches
    const matches = await base44.asServiceRole.entities.Match.filter({ 
      talent_email: targetEmail,
      status: 'completed'
    });

    // Calculate trust score
    const skillScore = verifiedSkills.length * 3;
    const completionScore = matches.length * 2;
    
    // Get average verification score
    const avgVerificationScore = verifiedSkills.length > 0
      ? verifiedSkills.reduce((acc, s) => acc + (s.verification_score || 0), 0) / verifiedSkills.length
      : 0;

    const trustScore = Math.min(100, 
      skillScore + 
      completionScore + 
      (avgVerificationScore * 0.3)
    );

    // Update user with trust score
    await base44.asServiceRole.auth.updateUser(targetEmail, {
      verified_talent: trustScore >= 60
    });

    return Response.json({
      success: true,
      trust_score: Math.round(trustScore),
      breakdown: {
        verified_skills: verifiedSkills.length,
        completed_matches: matches.length,
        avg_skill_score: Math.round(avgVerificationScore)
      }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});