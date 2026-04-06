import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Match Scoring Engine
 * Calculates match scores between talent and opportunities
 * Based on verified skills, availability, and compensation alignment
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { opportunity_id } = await req.json();

    // Get opportunities to process
    const opportunities = opportunity_id 
      ? await base44.asServiceRole.entities.Opportunity.filter({ id: opportunity_id, status: 'active' })
      : await base44.asServiceRole.entities.Opportunity.filter({ status: 'active' });

    if (opportunities.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No opportunities to process' 
      });
    }

    let totalMatches = 0;

    // Process each opportunity
    for (const opp of opportunities) {
      // Get all users with open_to_opportunities = true
      const allUsers = await base44.asServiceRole.entities.User.list();
      const eligibleUsers = allUsers.filter(u => 
        u.open_to_opportunities !== false && 
        u.email !== opp.creator_id
      );

      for (const user of eligibleUsers) {
        // Get user's skills
        const userSkills = await base44.asServiceRole.entities.Skill.filter({ 
          user_email: user.email 
        });

        // Calculate match score
        const matchScore = calculateMatchScore(userSkills, opp, user);

        // Only create matches above threshold
        if (matchScore >= (opp.match_threshold || 0.7)) {
          // Check if match already exists
          const existingMatches = await base44.asServiceRole.entities.Match.filter({
            talent_email: user.email,
            opportunity_id: opp.id
          });

          if (existingMatches.length === 0) {
            // Identify matched and missing skills
            const oppSkills = opp.skills_required || [];
            const userSkillNames = userSkills.map(s => s.name.toLowerCase());
            
            const matchedSkills = oppSkills.filter(skill => 
              userSkillNames.includes(skill.toLowerCase())
            );
            const missingSkills = oppSkills.filter(skill => 
              !userSkillNames.includes(skill.toLowerCase())
            );

            // Create match
            await base44.asServiceRole.entities.Match.create({
              talent_email: user.email,
              opportunity_id: opp.id,
              match_score: matchScore,
              status: 'pending',
              matched_skills: matchedSkills,
              missing_skills: missingSkills,
              talent_interested: false,
              creator_interested: false,
              chat_unlocked: false
            });

            totalMatches++;
          }
        }
      }
    }

    return Response.json({
      success: true,
      matches_created: totalMatches,
      opportunities_processed: opportunities.length
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});

/**
 * Calculate match score between user and opportunity
 * Weights: Skills (50%), Verification (30%), Experience (20%)
 */
function calculateMatchScore(userSkills, opportunity, user) {
  const oppSkills = (opportunity.skills_required || []).map(s => s.toLowerCase());
  
  if (oppSkills.length === 0) return 0;

  // 1. Skill overlap score (50%)
  const userSkillNames = userSkills.map(s => s.name.toLowerCase());
  const matchedSkills = oppSkills.filter(skill => userSkillNames.includes(skill));
  const skillOverlapScore = matchedSkills.length / oppSkills.length;

  // 2. Verification score (30%)
  const matchedUserSkills = userSkills.filter(s => 
    oppSkills.includes(s.name.toLowerCase())
  );
  const avgVerificationScore = matchedUserSkills.length > 0
    ? matchedUserSkills.reduce((acc, s) => {
        let score = 0;
        if (s.verified_by === 'self') score = 0.5;
        else if (s.verified_by === 'system') score = 0.8;
        else if (s.verified_by === 'peer') score = 0.9;
        else if (s.verified_by === 'expert') score = 1.0;
        return acc + score;
      }, 0) / matchedUserSkills.length
    : 0;

  // 3. Experience alignment (20%)
  const avgExperience = matchedUserSkills.length > 0
    ? matchedUserSkills.reduce((acc, s) => acc + (s.years_experience || 0), 0) / matchedUserSkills.length
    : 0;
  const experienceScore = Math.min(avgExperience / 5, 1); // 5+ years = max score

  // Weighted total
  const finalScore = (
    skillOverlapScore * 0.5 +
    avgVerificationScore * 0.3 +
    experienceScore * 0.2
  );

  return finalScore;
}