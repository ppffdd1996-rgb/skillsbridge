import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only send email if status changed
    if (!old_data || !data || data.status === old_data.status) {
      return Response.json({ success: true, message: 'No status change' });
    }

    // Get opportunity details
    const opportunity = await base44.asServiceRole.entities.Opportunity.filter({ id: data.opportunity_id });
    if (!opportunity || opportunity.length === 0) {
      return Response.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const opp = opportunity[0];

    // Status messages and colors
    const statusConfig = {
      applied: {
        title: 'Application Received',
        message: 'Your application has been successfully submitted and is under review.',
        color: '#3b82f6',
        emoji: '📬'
      },
      screening: {
        title: 'Application Under Review',
        message: 'Your application is currently being reviewed by our team.',
        color: '#f59e0b',
        emoji: '👀'
      },
      interviewing: {
        title: 'Interview Stage',
        message: 'Congratulations! You have been selected for an interview.',
        color: '#10b981',
        emoji: '🎉'
      },
      offered: {
        title: 'Job Offer',
        message: 'Excellent news! We would like to extend an offer for this position.',
        color: '#059669',
        emoji: '🎊'
      },
      rejected: {
        title: 'Application Update',
        message: 'Thank you for your interest. While your profile is impressive, we have decided to move forward with other candidates at this time.',
        color: '#6b7280',
        emoji: '📋'
      },
      hired: {
        title: 'Welcome Aboard!',
        message: 'Congratulations! We are excited to have you join the team.',
        color: '#8b5cf6',
        emoji: '🚀'
      }
    };

    const config = statusConfig[data.status] || statusConfig.applied;

    const subject = `${config.emoji} ${config.title} - ${opp.title}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${config.color}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${config.emoji} ${config.title}</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #333;">Hi ${data.applicant_name},</p>
          
          <p style="font-size: 16px; color: #333;">
            ${config.message}
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.color};">
            <h2 style="color: #374151; margin-top: 0;">Position Details</h2>
            <p><strong>Role:</strong> ${opp.title}</p>
            <p><strong>Company:</strong> ${opp.company_name || 'N/A'}</p>
            <p><strong>Status:</strong> <span style="color: ${config.color}; font-weight: bold; text-transform: capitalize;">${data.status.replace('_', ' ')}</span></p>
          </div>
          
          ${data.recruiter_notes ? `
          <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0; font-size: 14px;">Note from Recruiter</h3>
            <p style="color: #78350f; font-size: 14px; margin: 0; white-space: pre-wrap;">${data.recruiter_notes}</p>
          </div>
          ` : ''}
          
          ${data.interview_date ? `
          <div style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 14px;">📅 Interview Scheduled</h3>
            <p style="color: #1e3a8a; font-size: 14px; margin: 0;">
              ${new Date(data.interview_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          ` : ''}
          
          ${data.status === 'rejected' ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              We encourage you to continue exploring other opportunities on our platform that may be a better fit for your skills and experience.
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/Opportunities" 
               style="background: ${config.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              ${data.status === 'rejected' ? 'Browse More Opportunities' : 'View Application'}
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>SkillsBridge - Connecting Talent with Opportunities</p>
          <p>Questions? Reply to this email and we'll be happy to help.</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'SkillsBridge',
      to: data.applicant_email,
      subject,
      body
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending applicant notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});