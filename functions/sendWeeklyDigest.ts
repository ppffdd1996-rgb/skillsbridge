import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Weekly Digest Generator
 * Anti-addictive notification system
 * Sends one weekly summary instead of constant alerts
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users with open_to_opportunities = true
    const allUsers = await base44.asServiceRole.entities.User.list();
    const activeUsers = allUsers.filter(u => u.open_to_opportunities !== false);

    let emailsSent = 0;

    for (const user of activeUsers) {
      // Get user's matches from past week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const matches = await base44.asServiceRole.entities.Match.filter({
        talent_email: user.email
      });

      const newMatches = matches.filter(m => 
        new Date(m.created_date) > oneWeekAgo && m.status === 'pending'
      );

      const pendingActions = matches.filter(m => 
        m.status === 'pending' || m.status === 'creator_interested'
      );

      // Skip if nothing to report
      if (newMatches.length === 0 && pendingActions.length === 0) {
        continue;
      }

      // Get opportunity details
      const oppIds = [...new Set([...newMatches, ...pendingActions].map(m => m.opportunity_id))];
      const opportunities = await base44.asServiceRole.entities.Opportunity.filter({
        id: { $in: oppIds }
      }).catch(() => []);

      // Build digest content
      const digestContent = `
        <h2>Your Weekly SkillBridge Digest</h2>
        
        ${newMatches.length > 0 ? `
          <h3>🎯 New Matches (${newMatches.length})</h3>
          <ul>
            ${newMatches.slice(0, 5).map(m => {
              const opp = opportunities.find(o => o.id === m.opportunity_id);
              return `<li><strong>${opp?.title || 'Opportunity'}</strong> - ${Math.round(m.match_score * 100)}% match</li>`;
            }).join('')}
          </ul>
        ` : ''}
        
        ${pendingActions.length > 0 ? `
          <h3>⏰ Waiting for Your Response (${pendingActions.length})</h3>
          <p>You have ${pendingActions.length} matches waiting for your interest signal.</p>
        ` : ''}
        
        <p><a href="https://skillbridge.app/matches">View All Matches →</a></p>
        
        <hr/>
        <p style="color: #666; font-size: 12px;">
          You receive this digest weekly because you're open to opportunities. 
          Update your preferences in Settings.
        </p>
      `;

      // Send email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: 'SkillBridge',
        subject: `Your Weekly Digest - ${newMatches.length} new matches`,
        body: digestContent
      });

      emailsSent++;
    }

    return Response.json({
      success: true,
      digests_sent: emailsSent,
      users_processed: activeUsers.length
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});