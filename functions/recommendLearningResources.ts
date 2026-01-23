import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skills_to_learn, learning_style, time_commitment } = await req.json();

    const prompt = `As a learning advisor with deep knowledge of online education platforms, recommend high-quality learning resources.

SKILLS TO LEARN: ${skills_to_learn.join(', ')}
LEARNING STYLE: ${learning_style || 'mixed'}
TIME COMMITMENT: ${time_commitment || 'moderate'}

For each skill, recommend:
1. Best online courses (Coursera, Udemy, Pluralsight, freeCodeCamp, etc.)
2. Free resources (articles, documentation, tutorials)
3. Practice platforms (LeetCode, CodePen, real projects)
4. Communities to join (Discord servers, Reddit, forums)
5. Estimated learning path duration

Search the web for current, highly-rated resources. Include specific course names and URLs when possible.
Prioritize quality and practical, hands-on learning.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          resources_by_skill: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: { type: "string" },
                courses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      platform: { type: "string" },
                      url: { type: "string" },
                      price: { type: "string" },
                      duration: { type: "string" },
                      rating: { type: "string" }
                    }
                  }
                },
                free_resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      type: { type: "string" },
                      url: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                },
                practice_platforms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      url: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                },
                communities: {
                  type: "array",
                  items: { type: "string" }
                },
                learning_path: { type: "string" }
              }
            }
          },
          suggested_timeline: { type: "string" },
          tips: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Get relevant opportunities on the platform
    const opportunities = await base44.entities.Opportunity.filter({ status: 'active' });
    const practiceOpps = opportunities.filter(o => 
      skills_to_learn.some(skill => 
        o.skills_required?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      )
    ).slice(0, 5);

    return Response.json({
      success: true,
      recommendations: response,
      practice_opportunities: practiceOpps.map(o => ({
        id: o.id,
        title: o.title,
        company: o.company_name,
        skills: o.skills_required,
        has_trial: o.has_trial_task
      }))
    });
  } catch (error) {
    console.error('Error recommending resources:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});