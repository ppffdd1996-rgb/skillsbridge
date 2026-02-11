import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skill_gaps } = await req.json();

    if (!skill_gaps || skill_gaps.length === 0) {
      return Response.json({ error: 'skill_gaps required' }, { status: 400 });
    }

    // Use AI to find and recommend learning resources
    const recommendations = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Recommend specific learning resources for these skill gaps:

${JSON.stringify(skill_gaps, null, 2)}

For each skill gap, suggest:
1. Top 3 online courses (with platform names like Coursera, Udemy, LinkedIn Learning)
2. Top 2-3 articles/tutorials (provide realistic titles and sources)
3. Top 1-2 books (real book titles and authors)
4. Practice resources (coding challenges, projects, etc.)
5. Estimated time to proficiency (in weeks)
6. Learning path (beginner → intermediate → advanced)

Provide realistic, well-known resources that actually exist.`,
      response_json_schema: {
        type: "object",
        properties: {
          resources: {
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
                      title: { type: "string" },
                      platform: { type: "string" },
                      duration: { type: "string" },
                      level: { type: "string" }
                    }
                  }
                },
                articles: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      source: { type: "string" }
                    }
                  }
                },
                books: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      author: { type: "string" }
                    }
                  }
                },
                practice_resources: {
                  type: "array",
                  items: { type: "string" }
                },
                estimated_weeks: { type: "number" },
                learning_path: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      ...recommendations
    });

  } catch (error) {
    console.error('Learning resources error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});