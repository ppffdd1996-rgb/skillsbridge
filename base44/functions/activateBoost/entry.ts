import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { boost_id } = await req.json();

    // Get boost details
    const boosts = await base44.asServiceRole.entities.Boost.filter({ id: boost_id });
    const boost = boosts[0];

    if (!boost) {
      return Response.json({ error: 'Boost not found' }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + boost.duration_days * 24 * 60 * 60 * 1000);

    // Update boost status
    await base44.asServiceRole.entities.Boost.update(boost_id, {
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    });

    // Update target (profile or opportunity)
    if (boost.boost_type === 'profile') {
      const users = await base44.asServiceRole.entities.User.filter({ email: boost.target_id });
      if (users.length > 0) {
        await base44.asServiceRole.auth.updateUserData(users[0].id, {
          boosted_until: expiresAt.toISOString(),
          boost_impressions: 0
        });
      }
    } else if (boost.boost_type === 'opportunity') {
      await base44.asServiceRole.entities.Opportunity.update(boost.target_id, {
        boosted_until: expiresAt.toISOString(),
        boost_impressions: 0
      });
    }

    return Response.json({
      success: true,
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error activating boost:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});