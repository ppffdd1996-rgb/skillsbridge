import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { metrics, opportunities, applications } = await req.json();

    // Use AI to analyze recruitment patterns
    const analysisPrompt = `As a recruitment analytics expert, analyze this hiring data and provide actionable insights:

METRICS:
- Total Applications: ${applications.length}
- Average Time to Hire: ${metrics.avgTimeToHire} days
- Offer Acceptance Rate: ${metrics.offerAcceptanceRate}%
- Interview Completion Rate: ${metrics.interviewCompletionRate}%
- Top Performing Opportunities: ${metrics.topOpportunities?.slice(0, 3).map(o => o.title).join(', ')}

OPPORTUNITY ANALYSIS:
${opportunities.slice(0, 5).map(o => 
  `- ${o.title}: ${o.applicationCount} applications, ${o.avgMatchScore}% avg match score`
).join('\n')}

APPLICATION STATUS BREAKDOWN:
- Applied: ${applications.filter(a => a.status === 'applied').length}
- Screening: ${applications.filter(a => a.status === 'screening').length}
- Interviewing: ${applications.filter(a => a.status === 'interviewing').length}
- Offered: ${applications.filter(a => a.status === 'offered').length}
- Hired: ${applications.filter(a => a.status === 'hired').length}
- Rejected: ${applications.filter(a => a.status === 'rejected').length}

Provide:
1. Key insights about what's working well
2. Areas for improvement
3. Recommendations to optimize hiring process
4. Patterns in successful vs unsuccessful applications
5. Specific action items for recruiters`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          key_insights: {
            type: "array",
            items: { type: "string" }
          },
          improvements: {
            type: "array",
            items: { type: "string" }
          },
          recommendations: {
            type: "array",
            items: { type: "string" }
          },
          success_patterns: {
            type: "array",
            items: { type: "string" }
          },
          action_items: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      insights: response
    });
  } catch (error) {
    console.error('Error analyzing metrics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});