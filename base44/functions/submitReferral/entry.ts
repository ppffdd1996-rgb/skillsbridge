import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      candidate_email,
      candidate_name,
      opportunity_id,
      opportunity_title,
      company_name,
      referral_message,
      relationship,
      recruiter_email
    } = await req.json();

    if (!candidate_email || !candidate_name || !opportunity_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the referral record
    const referral = await base44.asServiceRole.entities.Referral.create({
      referrer_email: user.email,
      referrer_name: user.full_name || user.display_name || user.email,
      candidate_email,
      candidate_name,
      opportunity_id,
      opportunity_title: opportunity_title || '',
      company_name: company_name || '',
      referral_message: referral_message || '',
      relationship: relationship || 'colleague',
      status: 'invited',
      invited_at: new Date().toISOString(),
      recruiter_email: recruiter_email || ''
    });

    // Send email to the referred candidate (registered app users only)
    try {
      await base44.integrations.Core.SendEmail({
        to: candidate_email,
        subject: `${user.full_name || 'Someone'} referred you for ${opportunity_title || 'a role'}${company_name ? ' at ' + company_name : ''}`,
        body: `Hi ${candidate_name},\n\n${user.full_name || 'A SkillsBridge user'} thought you'd be a great fit for ${opportunity_title || 'an open role'}${company_name ? ' at ' + company_name : ''}.\n\n${referral_message ? referral_message + '\n\n' : ''}Check out the opportunity on SkillsBridge and apply if interested!\n\nBest,\nThe SkillsBridge Team`,
        from_name: 'SkillsBridge Referrals'
      });
    } catch (emailErr) {
      console.log('Referral email send failed:', emailErr?.message || emailErr);
    }

    // Notify the recruiter if provided
    if (recruiter_email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: recruiter_email,
          subject: `New referral received for ${opportunity_title || 'your opportunity'}`,
          body: `Hi,\n\n${user.full_name || user.email} referred ${candidate_name} (${candidate_email}) for ${opportunity_title || 'your open opportunity'}.\n\nReview the referral in your recruiter dashboard.\n\nThe SkillsBridge Team`,
          from_name: 'SkillsBridge Referrals'
        });
      } catch (e) {
        console.log('Recruiter notify failed:', e?.message || e);
      }
    }

    return Response.json({ success: true, referral });
  } catch (error) {
    console.error('Submit referral error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});