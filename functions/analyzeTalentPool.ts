import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Gather all data
    const applications = await base44.asServiceRole.entities.Application.list();
    const opportunities = await base44.asServiceRole.entities.Opportunity.list();
    const skills = await base44.asServiceRole.entities.Skill.list();

    // Prepare data summary
    const applicantEmails = [...new Set(applications.map(a => a.applicant_email))];
    const totalApplicants = applicantEmails.length;
    
    const skillFrequency = {};
    skills.forEach(skill => {
      skillFrequency[skill.name] = (skillFrequency[skill.name] || 0) + 1;
    });

    const topSkills = Object.entries(skillFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    const highScorers = applications
      .filter(app => app.match_score >= 80)
      .map(app => ({
        name: app.applicant_name,
        email: app.applicant_email,
        score: app.match_score,
        strengths: app.strengths
      }))
      .slice(0, 20);

    const recentApplications = applications
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 50);

    const recruiterNotesSummary = applications
      .filter(app => app.recruiter_notes)
      .map(app => app.recruiter_notes)
      .join('\n');

    const prompt = `As a talent analytics expert, analyze this comprehensive data from our applicant tracking system to provide strategic insights.

DATA OVERVIEW:
- Total Unique Applicants: ${totalApplicants}
- Total Applications: ${applications.length}
- Active Opportunities: ${opportunities.filter(o => o.status === 'active').length}

TOP SKILLS IN APPLICANT POOL:
${topSkills.map(s => `${s.name}: ${s.count} applicants`).join('\n')}

HIGH-SCORING CANDIDATES (80%+ match):
${highScorers.slice(0, 10).map(c => `${c.name}: ${c.score}% - ${c.strengths?.join(', ') || 'N/A'}`).join('\n')}

RECRUITER INSIGHTS:
${recruiterNotesSummary.slice(0, 2000)}

Provide a comprehensive analysis including:

1. **Emerging Skill Trends**: Identify the fastest-growing or most in-demand skills based on the data. What skills are becoming more valuable?

2. **Talent Pool Strengths**: What are the overall strengths of your current applicant pool? What industries or roles are they best suited for?

3. **Gap Analysis**: What critical skills or experience levels are missing from your talent pool?

4. **Passive Candidate Opportunities**: Identify high-potential candidates who may be suitable for future roles. Look for those with strong match scores, versatile skill sets, or positive recruiter feedback.

5. **Market Insights**: Based on the application patterns, what can we infer about the job market and candidate preferences?

6. **Recruitment Recommendations**: Strategic advice for future hiring, skill development, or talent pipeline building.`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          emerging_trends: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                trend: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          },
          talent_pool_strengths: {
            type: "array",
            items: { type: "string" }
          },
          skill_gaps: {
            type: "array",
            items: { type: "string" }
          },
          passive_candidates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                profile: { type: "string" },
                strengths: { type: "string" },
                potential_roles: { type: "string" }
              }
            }
          },
          market_insights: {
            type: "array",
            items: { type: "string" }
          },
          strategic_recommendations: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      analytics: response,
      stats: {
        total_applicants: totalApplicants,
        total_applications: applications.length,
        top_skills: topSkills.slice(0, 10),
        high_performers: highScorers.length
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});