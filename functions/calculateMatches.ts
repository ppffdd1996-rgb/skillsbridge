import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Matching Algorithm
 * Calculates match scores between talent and opportunities
 * Only creates matches above the threshold
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { opportunity_id } = await req.json();

    // Get the opportunity
    const opportunities = opportunity_id 
      ? await base44.entities.Opportunity.filter({ id: opportunity_id, status: 'active' })
      : await base44.entities.Opportunity.filter({ status: 'active' });

    // Get talent users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const talentUsers = allUsers.filter(u => 
      u.user_type === 'talent' || u.user_type === 'both'
    ).filter(u => u.open_to_opportunities);

    // Get all skills
    const allSkills = await base44.asServiceRole.entities.Skill.list();

    const newMatches = [];

    for (const opp of opportunities) {
      for (const talent of talentUsers) {
        // Skip if talent is the creator
        if (talent.email === opp.creator_id) continue;

        // Check if match already exists
        const existingMatches = await base44.asServiceRole.entities.Match.filter({
          talent_email: talent.email,
          opportunity_id: opp.id
        });

        if (existingMatches.length > 0) continue;

        // Get talent's skills
        const talentSkills = allSkills.filter(s => s.user_email === talent.email);
        const talentSkillNames = talentSkills.map(s => s.name.toLowerCase());

        // Calculate match score
        const requiredSkills = opp.skills_required.map(s => s.toLowerCase());
        const matchedSkills = requiredSkills.filter(skill => 
          talentSkillNames.includes(skill)
        );
        const missingSkills = requiredSkills.filter(skill => 
          !talentSkillNames.includes(skill)
        );

        const matchScore = matchedSkills.length / requiredSkills.length;

        // Only create match if above threshold
        if (matchScore >= (opp.match_threshold || 0.7)) {
          const match = await base44.asServiceRole.entities.Match.create({
            talent_email: talent.email,
            opportunity_id: opp.id,
            match_score: matchScore,
            status: 'pending',
            matched_skills: matchedSkills,
            missing_skills: missingSkills,
            talent_interested: false,
            creator_interested: false,
            chat_unlocked: false
          });

          newMatches.push(match);
        }
      }
    }

    return Response.json({ 
      success: true, 
      matches_created: newMatches.length,
      matches: newMatches
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});