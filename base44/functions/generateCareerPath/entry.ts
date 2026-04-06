import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target_role, current_skills, career_results } = await req.json();

    // Get user's current skills
    const userSkills = await base44.entities.Skill.filter({ user_email: user.email });
    const skillsList = userSkills.map(s => `${s.name} (${s.level})`).join(', ');

    // Get available opportunities for context
    const opportunities = await base44.entities.Opportunity.list();
    const relevantOpps = opportunities.filter(opp => 
      opp.title?.toLowerCase().includes(target_role?.toLowerCase()) ||
      opp.skills_required?.some(skill => 
        target_role?.toLowerCase().includes(skill.toLowerCase())
      )
    ).slice(0, 5);

    const prompt = `You are a career development expert. Create a detailed career progression roadmap for someone aiming to become a ${target_role}.

CURRENT PROFILE:
- Current Skills: ${skillsList || current_skills || 'Not specified'}
- Career Assessment Results: ${career_results ? JSON.stringify(career_results.slice(0, 3)) : 'Not completed'}

AVAILABLE OPPORTUNITIES ON PLATFORM:
${relevantOpps.map(o => `- ${o.title}: ${o.skills_required?.join(', ')}`).join('\n') || 'No specific opportunities listed'}

Create a comprehensive 3-5 step career progression path from their current position to ${target_role}. For each step, provide:
1. Role title and level (e.g., Junior, Mid-level, Senior)
2. Timeline (typical years of experience needed)
3. Key skills to develop
4. Certifications or education needed
5. Practical actions to take
6. How this step prepares for the next level

Make it specific, actionable, and realistic based on their current profile.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          career_path: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step_number: { type: "number" },
                role_title: { type: "string" },
                timeline: { type: "string" },
                skills_needed: {
                  type: "array",
                  items: { type: "string" }
                },
                certifications: {
                  type: "array",
                  items: { type: "string" }
                },
                key_actions: {
                  type: "array",
                  items: { type: "string" }
                },
                description: { type: "string" }
              }
            }
          },
          overall_timeline: { type: "string" },
          critical_skills: {
            type: "array",
            items: { type: "string" }
          },
          immediate_next_steps: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Find matching opportunities for each step
    const pathWithOpportunities = response.career_path.map(step => {
      const matchingOpps = opportunities.filter(opp => {
        const titleMatch = opp.title?.toLowerCase().includes(step.role_title.toLowerCase());
        const skillMatch = step.skills_needed.some(skill => 
          opp.skills_required?.some(reqSkill => 
            reqSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(reqSkill.toLowerCase())
          )
        );
        return titleMatch || skillMatch;
      }).slice(0, 3);

      return {
        ...step,
        opportunities: matchingOpps.map(o => ({
          id: o.id,
          title: o.title,
          company: o.company_name,
          skills: o.skills_required
        }))
      };
    });

    return Response.json({
      success: true,
      career_path: pathWithOpportunities,
      overall_timeline: response.overall_timeline,
      critical_skills: response.critical_skills,
      immediate_next_steps: response.immediate_next_steps
    });
  } catch (error) {
    console.error('Career path generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});