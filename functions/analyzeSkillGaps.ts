import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target_role, user_profile } = await req.json();

    // Get user's current skills
    const userSkills = await base44.entities.Skill.filter({ user_email: user.email });
    
    // Get relevant opportunities to understand market demands
    const opportunities = await base44.entities.Opportunity.filter({ status: 'active' });
    const relevantOpps = opportunities.filter(o => 
      o.title?.toLowerCase().includes(target_role.toLowerCase()) ||
      o.description?.toLowerCase().includes(target_role.toLowerCase())
    ).slice(0, 5);

    const prompt = `As a career development advisor, analyze skill gaps for a candidate targeting this role.

TARGET ROLE: ${target_role}

CANDIDATE'S CURRENT SKILLS:
${userSkills.map(s => `- ${s.name} (${s.level}) - ${s.years_experience || 0} years`).join('\n')}

CANDIDATE PROFILE:
- Bio: ${user_profile?.bio || 'N/A'}
- Experience: ${user_profile?.years_experience || 0} years
- Industry: ${user_profile?.industry || 'N/A'}

MARKET ANALYSIS (Similar roles on platform):
${relevantOpps.map(o => `- ${o.title}: Required skills: ${o.skills_required?.join(', ')}`).join('\n')}

Provide a comprehensive skill gap analysis:
1. Core skills they have that match the role
2. Critical missing skills (must-haves for the role)
3. Desirable skills that would strengthen their profile
4. Skill level improvements needed (e.g., they have React at "competent" but role needs "proficient")
5. Priority order for learning (what to focus on first)
6. Estimated time to become job-ready (in months)
7. Overall readiness score (0-100)

Be specific and actionable.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          matching_skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                current_level: { type: "string" },
                why_valuable: { type: "string" }
              }
            }
          },
          critical_gaps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                importance: { type: "string" },
                why_needed: { type: "string" },
                priority: { type: "number" }
              }
            }
          },
          desirable_skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                benefit: { type: "string" }
              }
            }
          },
          improvement_areas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                current_level: { type: "string" },
                target_level: { type: "string" },
                rationale: { type: "string" }
              }
            }
          },
          learning_roadmap: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase: { type: "string" },
                focus_areas: {
                  type: "array",
                  items: { type: "string" }
                },
                duration: { type: "string" }
              }
            }
          },
          time_to_ready: { type: "string" },
          readiness_score: { type: "number" },
          summary: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: response
    });
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});