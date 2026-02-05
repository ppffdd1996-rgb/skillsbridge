import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      opportunityId,
      opportunityTitle,
      requiredSkills,
      experienceLevel,
      salaryRange,
      talentPoolIds = []
    } = await req.json();

    if (!opportunityId || !opportunityTitle || !requiredSkills || !Array.isArray(requiredSkills)) {
      return Response.json(
        { error: 'Missing required fields: opportunityId, opportunityTitle, requiredSkills (array)' },
        { status: 400 }
      );
    }

    let candidates = [];

    // If specific pools provided, search those; otherwise get all talent pools
    if (talentPoolIds.length > 0) {
      for (const poolId of talentPoolIds) {
        const poolMembers = await base44.asServiceRole.entities.TalentPoolMember.filter({
          talent_pool_id: poolId,
          status: 'active'
        });
        candidates.push(...poolMembers);
      }
    } else {
      // Get all talent pools
      const pools = await base44.asServiceRole.entities.TalentPool.list();
      for (const pool of pools) {
        const poolMembers = await base44.asServiceRole.entities.TalentPoolMember.filter({
          talent_pool_id: pool.id,
          status: 'active'
        });
        candidates.push(...poolMembers);
      }
    }

    // Score candidates based on match
    const scoredCandidates = candidates.map(candidate => {
      let score = 0;
      let matchedSkills = [];
      let missingSkills = [];

      // Skill matching
      for (const requiredSkill of requiredSkills) {
        const skillMatched = candidate.skills?.some(s =>
          s.toLowerCase().includes(requiredSkill.toLowerCase())
        );
        if (skillMatched) {
          matchedSkills.push(requiredSkill);
          score += 20;
        } else {
          missingSkills.push(requiredSkill);
        }
      }

      // Experience level matching
      if (experienceLevel && candidate.experience_level === experienceLevel) {
        score += 15;
      }

      // Interview rating bonus
      if (candidate.interview_rating) {
        score += (candidate.interview_rating / 5) * 25;
      }

      // Quality score
      if (candidate.quality_score) {
        score += Math.min(candidate.quality_score / 100 * 20, 20);
      }

      // Availability bonus
      if (candidate.availability === 'immediately' || candidate.availability === '2-weeks') {
        score += 10;
      }

      // Normalize score to 0-100
      score = Math.min(score, 100);

      return {
        id: candidate.id,
        name: candidate.candidate_name,
        email: candidate.candidate_email,
        skills: candidate.skills || [],
        matchedSkills,
        missingSkills,
        experienceLevel: candidate.experience_level,
        yearsExperience: candidate.years_experience,
        interviewRating: candidate.interview_rating,
        availability: candidate.availability,
        qualityScore: candidate.quality_score,
        matchScore: Math.round(score),
        tags: candidate.tags || []
      };
    });

    // Sort by match score (highest first) and filter those with at least some match
    const sortedCandidates = scoredCandidates
      .filter(c => c.matchScore >= 40) // Only include candidates with 40% match or higher
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20); // Top 20 candidates

    return Response.json({
      success: true,
      opportunityId,
      opportunityTitle,
      totalMatches: sortedCandidates.length,
      suggestedCandidates: sortedCandidates
    });
  } catch (error) {
    console.error('Suggest candidates error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});