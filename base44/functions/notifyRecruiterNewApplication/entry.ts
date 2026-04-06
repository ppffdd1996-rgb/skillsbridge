import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !data.opportunity_id) {
      return Response.json({ error: 'Missing application data' }, { status: 400 });
    }

    // Get the opportunity and creator details
    const opportunity = await base44.asServiceRole.entities.Opportunity.filter({ id: data.opportunity_id });
    if (!opportunity || opportunity.length === 0) {
      return Response.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const opp = opportunity[0];
    const recruiterEmail = opp.created_by;

    // Get recruiter details
    const recruiter = await base44.asServiceRole.entities.User.filter({ email: recruiterEmail });
    const recruiterName = recruiter[0]?.full_name || 'Recruiter';

    // Create email content
    const subject = `New Application: ${data.applicant_name} for ${opp.title}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Application Received</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #333;">Hi ${recruiterName},</p>
          
          <p style="font-size: 16px; color: #333;">
            You have received a new application for your opportunity!
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #667eea; margin-top: 0;">Application Details</h2>
            <p><strong>Position:</strong> ${opp.title}</p>
            <p><strong>Candidate:</strong> ${data.applicant_name}</p>
            <p><strong>Email:</strong> ${data.applicant_email}</p>
            ${data.match_score ? `<p><strong>Match Score:</strong> <span style="color: ${data.match_score >= 80 ? '#10b981' : data.match_score >= 60 ? '#f59e0b' : '#6b7280'}; font-weight: bold;">${data.match_score}%</span></p>` : ''}
          </div>
          
          ${data.ai_summary ? `
          <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 14px;">AI Summary</h3>
            <p style="color: #374151; font-size: 14px; margin: 0;">${data.ai_summary}</p>
          </div>
          ` : ''}
          
          ${data.cover_letter ? `
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Cover Letter</h3>
            <p style="color: #6b7280; font-size: 14px; white-space: pre-wrap;">${data.cover_letter}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/Applications" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Review Application
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>SkillsBridge - Connecting Talent with Opportunities</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'SkillsBridge',
      to: recruiterEmail,
      subject,
      body
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending recruiter notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});