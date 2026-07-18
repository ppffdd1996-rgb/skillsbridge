import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { bonus_id, action, notes, bonus_amount } = body;

    if (!bonus_id || !action) {
      return Response.json({ error: 'bonus_id and action required' }, { status: 400 });
    }

    const bonus = await base44.asServiceRole.entities.ReferralBonus.get(bonus_id);
    if (!bonus) return Response.json({ error: 'Bonus not found' }, { status: 404 });

    const updates = {};
    if (action === 'approve') {
      updates.status = 'approved';
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user.email;
    } else if (action === 'pay') {
      updates.status = 'paid';
      updates.paid_at = new Date().toISOString();
      if (!bonus.approved_at) {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = user.email;
      }
    } else if (action === 'cancel') {
      updates.status = 'cancelled';
    } else if (action === 'update_amount') {
      if (typeof bonus_amount === 'number' && bonus_amount >= 0) {
        updates.bonus_amount = bonus_amount;
      }
    } else {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    if (notes !== undefined) updates.notes = notes;

    const updated = await base44.asServiceRole.entities.ReferralBonus.update(bonus_id, updates);

    // Notify referrer on payment
    if (action === 'pay') {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: bonus.referrer_email,
          subject: `Your referral bonus has been paid`,
          body: `Hi ${bonus.referrer_name || ''},\n\nYour referral bonus of $${(updates.bonus_amount ?? bonus.bonus_amount)} for referring ${bonus.candidate_name || bonus.candidate_email} has been paid out.\n\nThank you for being part of our referral program!\n\nThe SkillsBridge Team`,
          from_name: 'SkillsBridge Referrals'
        });
      } catch (e) {
        console.log('Pay email failed:', e?.message || e);
      }
    }

    return Response.json({ success: true, bonus: updated });
  } catch (error) {
    console.error('manageReferralBonus error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});