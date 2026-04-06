import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { prediction_type, filters } = await req.json();

    // Fetch historical data
    const [applications, interviews, offers, opportunities] = await Promise.all([
      base44.asServiceRole.entities.Application.list('-created_date', 2000),
      base44.asServiceRole.entities.Interview.list('-created_date', 2000),
      base44.asServiceRole.entities.OfferLetter.list('-created_date', 2000),
      base44.asServiceRole.entities.Opportunity.list('-created_date', 500)
    ]);

    let predictions = {};

    if (prediction_type === 'time_to_hire') {
      // Calculate historical time-to-hire trends
      const hires = offers.filter(o => o.signature_status === 'signed' && o.signed_at);
      const timeData = hires.map(offer => {
        const app = applications.find(a => a.candidate_email === offer.candidate_email);
        if (!app) return null;
        
        const days = Math.floor((new Date(offer.signed_at) - new Date(app.created_date)) / (1000 * 60 * 60 * 24));
        const month = new Date(app.created_date).toISOString().slice(0, 7);
        return { days, month, role: offer.job_title };
      }).filter(Boolean);

      // Group by month to identify trends
      const monthlyAvg = {};
      timeData.forEach(({ days, month }) => {
        if (!monthlyAvg[month]) monthlyAvg[month] = [];
        monthlyAvg[month].push(days);
      });

      const trends = Object.entries(monthlyAvg).map(([month, days]) => ({
        month,
        avg_days: (days.reduce((a, b) => a + b, 0) / days.length).toFixed(1)
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Simple trend analysis
      const recent = trends.slice(-3);
      const avgRecent = recent.reduce((sum, t) => sum + parseFloat(t.avg_days), 0) / recent.length;
      
      predictions = {
        predicted_time_to_hire_days: avgRecent.toFixed(1),
        trend: trends.length > 1 && parseFloat(trends[trends.length - 1].avg_days) > parseFloat(trends[0].avg_days) ? 'increasing' : 'stable',
        historical_trends: trends.slice(-6),
        confidence: 'medium'
      };
    }

    if (prediction_type === 'candidate_pool_quality') {
      // Analyze quality indicators
      const qualityMetrics = applications.map(app => {
        const hasInterview = interviews.some(i => i.application_id === app.id);
        const hasOffer = offers.some(o => o.candidate_email === app.candidate_email);
        const hired = offers.some(o => o.candidate_email === app.candidate_email && o.signature_status === 'signed');
        
        return {
          role: app.role,
          has_interview: hasInterview,
          has_offer: hasOffer,
          hired: hired,
          created_month: new Date(app.created_date).toISOString().slice(0, 7)
        };
      });

      const totalApps = qualityMetrics.length;
      const interviewRate = (qualityMetrics.filter(m => m.has_interview).length / totalApps * 100).toFixed(1);
      const offerRate = (qualityMetrics.filter(m => m.has_offer).length / totalApps * 100).toFixed(1);
      const hireRate = (qualityMetrics.filter(m => m.hired).length / totalApps * 100).toFixed(1);

      predictions = {
        current_quality_score: ((parseFloat(interviewRate) + parseFloat(offerRate) * 2 + parseFloat(hireRate) * 3) / 6).toFixed(1),
        metrics: {
          interview_rate: interviewRate,
          offer_rate: offerRate,
          hire_rate: hireRate
        },
        prediction: parseFloat(hireRate) > 5 ? 'High quality pool' : 'Pool quality needs improvement',
        recommendations: [
          parseFloat(interviewRate) < 30 ? 'Improve screening criteria' : null,
          parseFloat(offerRate) < 10 ? 'Focus on better candidate matching' : null,
          parseFloat(hireRate) < 5 ? 'Review offer competitiveness' : null
        ].filter(Boolean)
      };
    }

    if (prediction_type === 'hiring_demand') {
      // Analyze opportunity posting trends
      const monthlyOpps = {};
      opportunities.forEach(opp => {
        const month = new Date(opp.created_date).toISOString().slice(0, 7);
        monthlyOpps[month] = (monthlyOpps[month] || 0) + 1;
      });

      const trendData = Object.entries(monthlyOpps)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6);

      const recent3 = trendData.slice(-3).reduce((sum, [_, count]) => sum + count, 0) / 3;
      const previous3 = trendData.slice(-6, -3).reduce((sum, [_, count]) => sum + count, 0) / 3;

      predictions = {
        predicted_next_month_opportunities: Math.round(recent3),
        trend: recent3 > previous3 ? 'growing' : 'stable',
        growth_rate: previous3 > 0 ? (((recent3 - previous3) / previous3) * 100).toFixed(1) : 0,
        historical_data: trendData
      };
    }

    // Use AI for additional insights
    const aiInsights = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze these recruitment predictions and provide 3-5 actionable insights:

Prediction Type: ${prediction_type}
Data: ${JSON.stringify(predictions, null, 2)}

Provide strategic recommendations based on these trends.`,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      prediction_type,
      predictions,
      ai_insights: aiInsights.insights,
      generated_at: new Date().toISOString(),
      confidence_note: "Predictions based on historical data patterns"
    });

  } catch (error) {
    console.error('Generate predictive analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});