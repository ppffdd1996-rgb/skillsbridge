import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      date_range_start,
      date_range_end = new Date().toISOString()
    } = await req.json();

    const startDate = date_range_start ? new Date(date_range_start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(date_range_end);

    // Fetch all data
    const [users, opportunities, applications, interviews, offers, matches, skills, conversations] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Opportunity.list(),
      base44.asServiceRole.entities.Application.list(),
      base44.asServiceRole.entities.Interview.list(),
      base44.asServiceRole.entities.OfferLetter.list(),
      base44.asServiceRole.entities.Match.list(),
      base44.asServiceRole.entities.Skill.list(),
      base44.asServiceRole.entities.Conversation.list()
    ]);

    // Calculate metrics
    const filteredUsers = users.filter(u => new Date(u.created_date) >= startDate && new Date(u.created_date) <= endDate);
    const filteredApplications = applications.filter(a => new Date(a.created_date) >= startDate && new Date(a.created_date) <= endDate);
    const filteredInterviews = interviews.filter(i => new Date(i.created_date) >= startDate && new Date(i.created_date) <= endDate);
    const filteredOffers = offers.filter(o => new Date(o.created_date) >= startDate && new Date(o.created_date) <= endDate);

    // Time to hire calculation
    const hiredOffers = filteredOffers.filter(o => o.signature_status === 'signed');
    let totalTimeToHire = 0;
    let timeToHireCount = 0;

    for (const offer of hiredOffers) {
      const app = applications.find(a => a.applicant_email === offer.candidate_email);
      if (app) {
        const appDate = new Date(app.created_date);
        const hireDate = new Date(offer.signed_at);
        const days = (hireDate - appDate) / (1000 * 60 * 60 * 24);
        totalTimeToHire += days;
        timeToHireCount++;
      }
    }

    const avgTimeToHire = timeToHireCount > 0 ? totalTimeToHire / timeToHireCount : 0;

    // Candidate engagement
    const activeConversations = conversations.filter(c => c.status === 'active').length;
    const engagementRate = filteredApplications.length > 0 ? (activeConversations / filteredApplications.length) * 100 : 0;

    // Hiring funnel
    const funnelMetrics = {
      applications: filteredApplications.length,
      screening: filteredApplications.filter(a => a.status === 'screening' || a.status === 'reviewed').length,
      interviews: filteredInterviews.length,
      offers: filteredOffers.length,
      hires: hiredOffers.length
    };

    // Conversion rates
    const conversionRates = {
      application_to_interview: funnelMetrics.applications > 0 ? (funnelMetrics.interviews / funnelMetrics.applications * 100) : 0,
      interview_to_offer: funnelMetrics.interviews > 0 ? (funnelMetrics.offers / funnelMetrics.interviews * 100) : 0,
      offer_to_hire: funnelMetrics.offers > 0 ? (funnelMetrics.hires / funnelMetrics.offers * 100) : 0
    };

    // User activity
    const userActivity = {
      total_users: users.length,
      new_users: filteredUsers.length,
      candidates: users.filter(u => !u.role || u.role === 'user').length,
      recruiters: users.filter(u => u.role === 'admin').length,
      verified_skills: skills.filter(s => s.verification_score && s.verification_score >= 70).length
    };

    // Top performing opportunities
    const opportunityPerformance = opportunities.map(opp => {
      const oppApps = applications.filter(a => a.opportunity_id === opp.id);
      return {
        id: opp.id,
        title: opp.title,
        applications: oppApps.length,
        interviews: interviews.filter(i => oppApps.some(a => a.id === i.application_id)).length,
        views: opp.boost_impressions || 0
      };
    }).sort((a, b) => b.applications - a.applications).slice(0, 10);

    return Response.json({
      success: true,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        avg_time_to_hire_days: Math.round(avgTimeToHire),
        candidate_engagement_rate: Math.round(engagementRate),
        total_hires: hiredOffers.length,
        active_opportunities: opportunities.filter(o => o.status === 'active').length
      },
      hiring_funnel: funnelMetrics,
      conversion_rates: conversionRates,
      user_activity: userActivity,
      top_opportunities: opportunityPerformance,
      trends: {
        new_registrations_trend: filteredUsers.length,
        applications_trend: filteredApplications.length,
        interviews_trend: filteredInterviews.length
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});