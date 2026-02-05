import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      action,
      talentPoolMemberId,
      candidateEmail,
      engagementType,
      opportunityId,
      interactionDetails,
      engagementStatus,
      sentimentScore,
      limit = 50
    } = await req.json();

    if (action === 'record') {
      if (!talentPoolMemberId || !engagementType) {
        return Response.json(
          { error: 'Missing required fields: talentPoolMemberId, engagementType' },
          { status: 400 }
        );
      }

      const engagement = await base44.asServiceRole.entities.CandidateEngagement.create({
        talent_pool_member_id: talentPoolMemberId,
        candidate_email: candidateEmail,
        engagement_type: engagementType,
        opportunity_id: opportunityId,
        interaction_details: interactionDetails,
        recruiter_email: user.email,
        engagement_status: engagementStatus || 'initiated',
        sentiment_score: sentimentScore
      });

      return Response.json({
        success: true,
        message: 'Engagement recorded successfully',
        engagementId: engagement.id
      });
    }

    if (action === 'history') {
      if (!talentPoolMemberId) {
        return Response.json(
          { error: 'Missing required field: talentPoolMemberId' },
          { status: 400 }
        );
      }

      const engagements = await base44.asServiceRole.entities.CandidateEngagement.filter({
        talent_pool_member_id: talentPoolMemberId
      });

      // Sort by date (newest first)
      const sorted = engagements.sort((a, b) =>
        new Date(b.created_date) - new Date(a.created_date)
      );

      return Response.json({
        success: true,
        talentPoolMemberId,
        totalEngagements: sorted.length,
        engagements: sorted.slice(0, limit).map(e => ({
          id: e.id,
          type: e.engagement_type,
          status: e.engagement_status,
          details: e.interaction_details,
          recruiter: e.recruiter_email,
          opportunityId: e.opportunity_id,
          sentimentScore: e.sentiment_score,
          date: e.created_date
        }))
      });
    }

    if (action === 'summary') {
      if (!talentPoolMemberId) {
        return Response.json(
          { error: 'Missing required field: talentPoolMemberId' },
          { status: 400 }
        );
      }

      const engagements = await base44.asServiceRole.entities.CandidateEngagement.filter({
        talent_pool_member_id: talentPoolMemberId
      });

      const summary = {
        totalEngagements: engagements.length,
        byType: {},
        byStatus: {},
        lastEngagement: null,
        avgSentiment: 0,
        opportunities: []
      };

      let sentimentSum = 0;
      let sentimentCount = 0;

      engagements.forEach(e => {
        // Count by type
        summary.byType[e.engagement_type] = (summary.byType[e.engagement_type] || 0) + 1;

        // Count by status
        summary.byStatus[e.engagement_status] = (summary.byStatus[e.engagement_status] || 0) + 1;

        // Track sentiment
        if (e.sentiment_score) {
          sentimentSum += e.sentiment_score;
          sentimentCount++;
        }

        // Track opportunities
        if (e.opportunity_id && !summary.opportunities.includes(e.opportunity_id)) {
          summary.opportunities.push(e.opportunity_id);
        }
      });

      if (sentimentCount > 0) {
        summary.avgSentiment = Math.round((sentimentSum / sentimentCount) * 10) / 10;
      }

      // Most recent engagement
      if (engagements.length > 0) {
        const sorted = engagements.sort((a, b) =>
          new Date(b.created_date) - new Date(a.created_date)
        );
        summary.lastEngagement = {
          type: sorted[0].engagement_type,
          date: sorted[0].created_date
        };
      }

      return Response.json({
        success: true,
        talentPoolMemberId,
        summary
      });
    }

    return Response.json(
      { error: 'Invalid action. Use: record, history, or summary' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Track engagement error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});