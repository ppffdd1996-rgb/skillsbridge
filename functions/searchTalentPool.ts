import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      talentPoolId,
      searchQuery,
      skills = [],
      experienceLevel,
      minInterviewRating,
      maxSalaryExpectation,
      availability,
      status = 'active',
      tags = [],
      limit = 50
    } = await req.json();

    if (!talentPoolId) {
      return Response.json(
        { error: 'Missing required field: talentPoolId' },
        { status: 400 }
      );
    }

    // Fetch all members in the talent pool
    const members = await base44.asServiceRole.entities.TalentPoolMember.filter({
      talent_pool_id: talentPoolId,
      status
    });

    let filtered = members;

    // Search by name or email
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.candidate_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by skills (candidate must have all requested skills)
    if (skills.length > 0) {
      filtered = filtered.filter(m =>
        skills.every(skill =>
          m.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }

    // Filter by experience level
    if (experienceLevel) {
      filtered = filtered.filter(m => m.experience_level === experienceLevel);
    }

    // Filter by interview rating
    if (minInterviewRating) {
      filtered = filtered.filter(m =>
        m.interview_rating && m.interview_rating >= minInterviewRating
      );
    }

    // Filter by availability
    if (availability) {
      filtered = filtered.filter(m => m.availability === availability);
    }

    // Filter by tags (candidate must have all requested tags)
    if (tags.length > 0) {
      filtered = filtered.filter(m =>
        tags.every(tag =>
          m.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
        )
      );
    }

    // Sort by quality score (highest first)
    filtered.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));

    // Limit results
    const results = filtered.slice(0, limit);

    return Response.json({
      success: true,
      talentPoolId,
      totalMatches: results.length,
      results: results.map(m => ({
        id: m.id,
        name: m.candidate_name,
        email: m.candidate_email,
        skills: m.skills || [],
        tags: m.tags || [],
        experienceLevel: m.experience_level,
        yearsExperience: m.years_experience,
        interviewRating: m.interview_rating,
        lastInterviewDate: m.last_interview_date,
        availability: m.availability,
        preferredRoles: m.preferred_roles || [],
        qualityScore: m.quality_score,
        status: m.status
      }))
    });
  } catch (error) {
    console.error('Search talent pool error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});