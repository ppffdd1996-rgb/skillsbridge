import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const DEFAULT_BONUS = 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Automation payload: { event, data, old_data, changed_fields }
    const data = body.data;
    const oldData = body.old_data;

    if (!data || !data.id) {
      return Response.json({ error: 'Expected entity automation payload' }, { status: 400 });
    }

    // Only act when status transitioned to 'hired'
    const wasHired = oldData && oldData.status === 'hired';
    const isHired = data.status === 'hired';
    if (!isHired || wasHired) {
      return Response.json({ skipped: true, reason: 'not a hire transition' });
    }

    const referralId = data.id;

    // Avoid duplicate bonuses
    const existing = await base44.asServiceRole.entities.ReferralBonus.filter({ referral_id: referralId });
    if (existing.length > 0) {
      return Response.json({ skipped: true, reason: 'bonus already exists' });
    }

    // Mark referral eligible + record hire date
    await base44.asServiceRole.entities.Referral.update(referralId, {
      reward_eligible: true,
      hired_at: data.hired_at || new Date().toISOString()
    });

    const bonus = await base44.asServiceRole.entities.ReferralBonus.create({
      referral_id: referralId,
      referrer_email: data.referrer_email,
      referrer_name: data.referrer_name || '',
      candidate_email: data.candidate_email,
      candidate_name: data.candidate_name || '',
      opportunity_id: data.opportunity_id || '',
      opportunity_title: data.opportunity_title || '',
      company_name: data.company_name || '',
      bonus_amount: DEFAULT_BONUS,
      currency: 'USD',
      status: 'pending',
      awarded_at: new Date().toISOString()
    });

    // Notify the referrer (registered app users only)
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: data.referrer_email,
        subject: `🎉 Your referral was hired — bonus pending!`,
        body: `Hi ${data.referrer_name || ''},\n\nGreat news! ${data.candidate_name || data.candidate_email}, who you referred for ${data.opportunity_title || 'a role'}${data.company_name ? ' at ' + data.company_name : ''}, has been hired.\n\nA referral bonus of $${DEFAULT_BONUS} has been awarded to your account and is pending approval. You'll be notified once it's paid out.\n\nThank you for helping grow our team!\n\nThe SkillsBridge Team`,
        from_name: 'SkillsBridge Referrals'
      });
    } catch (e) {
      console.log('Bonus email failed:', e?.message || e);
    }

    return Response.json({ success: true, bonus });
  } catch (error) {
    console.error('awardReferralBonus error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});