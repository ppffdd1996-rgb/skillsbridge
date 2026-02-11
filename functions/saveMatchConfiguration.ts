import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configData = await req.json();

    // Check if config exists
    const existing = await base44.asServiceRole.entities.MatchConfiguration.filter({
      opportunity_id: configData.opportunity_id,
      recruiter_email: user.email
    });

    let config;
    if (existing.length > 0) {
      config = await base44.asServiceRole.entities.MatchConfiguration.update(
        existing[0].id,
        configData
      );
    } else {
      config = await base44.asServiceRole.entities.MatchConfiguration.create({
        ...configData,
        recruiter_email: user.email
      });
    }

    return Response.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Save config error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});