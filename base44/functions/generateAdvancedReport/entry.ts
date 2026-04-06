import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { report_type, filters } = await req.json();

    // Fetch relevant data
    const [applications, interviews, offers, opportunities, matches] = await Promise.all([
      base44.asServiceRole.entities.Application.list('-created_date', 1000),
      base44.asServiceRole.entities.Interview.list('-created_date', 1000),
      base44.asServiceRole.entities.OfferLetter.list('-created_date', 1000),
      base44.asServiceRole.entities.Opportunity.list('-created_date', 1000),
      base44.asServiceRole.entities.Match.list('-created_date', 1000)
    ]);

    // Apply filters
    const filterData = (data, filters) => {
      if (!filters) return data;
      
      return data.filter(item => {
        if (filters.start_date && new Date(item.created_date) < new Date(filters.start_date)) return false;
        if (filters.end_date && new Date(item.created_date) > new Date(filters.end_date)) return false;
        if (filters.roles?.length && !filters.roles.includes(item.role || item.job_title)) return false;
        if (filters.recruiters?.length && !filters.recruiters.includes(item.recruiter_email || item.created_by)) return false;
        return true;
      });
    };

    const filteredApps = filterData(applications, filters);
    const filteredInterviews = filterData(interviews, filters);
    const filteredOffers = filterData(offers, filters);

    let reportData = {};
    let insights = [];

    if (report_type === 'diversity_metrics') {
      // Analyze diversity - we'd need user demographic data, so this is a placeholder
      reportData = {
        total_applicants: filteredApps.length,
        total_hires: filteredOffers.filter(o => o.signature_status === 'signed').length,
        note: "Diversity metrics require demographic data collection"
      };
      insights.push("Consider implementing demographic data collection to track diversity metrics");
    }

    if (report_type === 'source_effectiveness') {
      const sourceBreakdown = filteredApps.reduce((acc, app) => {
        const source = app.source || 'Direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      reportData = {
        sources: sourceBreakdown,
        total_applications: filteredApps.length,
        top_source: Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])[0]
      };

      insights.push(`${reportData.top_source?.[0] || 'Unknown'} is your most effective source with ${reportData.top_source?.[1] || 0} applications`);
    }

    if (report_type === 'offer_acceptance') {
      const totalOffers = filteredOffers.length;
      const acceptedOffers = filteredOffers.filter(o => o.signature_status === 'signed').length;
      const declinedOffers = filteredOffers.filter(o => o.signature_status === 'declined').length;
      const acceptanceRate = totalOffers > 0 ? (acceptedOffers / totalOffers * 100).toFixed(1) : 0;

      reportData = {
        total_offers: totalOffers,
        accepted: acceptedOffers,
        declined: declinedOffers,
        pending: totalOffers - acceptedOffers - declinedOffers,
        acceptance_rate: acceptanceRate
      };

      if (parseFloat(acceptanceRate) < 70) {
        insights.push("Offer acceptance rate is below 70% - consider reviewing compensation or company branding");
      } else {
        insights.push(`Strong offer acceptance rate of ${acceptanceRate}%`);
      }
    }

    if (report_type === 'time_to_hire') {
      const hiredCandidates = filteredOffers.filter(o => o.signature_status === 'signed');
      const times = hiredCandidates.map(offer => {
        const app = filteredApps.find(a => a.candidate_email === offer.candidate_email);
        if (!app) return null;
        const days = Math.floor((new Date(offer.signed_at) - new Date(app.created_date)) / (1000 * 60 * 60 * 24));
        return days;
      }).filter(t => t !== null);

      const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : 0;

      reportData = {
        average_days: avgTime,
        fastest: Math.min(...times, 0),
        slowest: Math.max(...times, 0),
        total_hires: hiredCandidates.length
      };

      insights.push(`Average time-to-hire is ${avgTime} days`);
      if (parseFloat(avgTime) > 30) {
        insights.push("Time-to-hire exceeds 30 days - consider streamlining your hiring process");
      }
    }

    if (report_type === 'funnel_performance') {
      const totalMatches = matches.length;
      const totalApps = filteredApps.length;
      const totalInterviews = filteredInterviews.length;
      const totalOffers = filteredOffers.length;
      const totalHires = filteredOffers.filter(o => o.signature_status === 'signed').length;

      reportData = {
        stages: {
          matches: totalMatches,
          applications: totalApps,
          interviews: totalInterviews,
          offers: totalOffers,
          hires: totalHires
        },
        conversion_rates: {
          match_to_application: totalMatches > 0 ? (totalApps / totalMatches * 100).toFixed(1) : 0,
          application_to_interview: totalApps > 0 ? (totalInterviews / totalApps * 100).toFixed(1) : 0,
          interview_to_offer: totalInterviews > 0 ? (totalOffers / totalInterviews * 100).toFixed(1) : 0,
          offer_to_hire: totalOffers > 0 ? (totalHires / totalOffers * 100).toFixed(1) : 0
        }
      };

      const weakestStage = Object.entries(reportData.conversion_rates)
        .sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]))[0];
      
      insights.push(`Weakest conversion: ${weakestStage[0].replace(/_/g, ' ')} at ${weakestStage[1]}%`);
    }

    if (report_type === 'recruiter_performance') {
      const recruiterStats = {};
      
      filteredApps.forEach(app => {
        const recruiter = app.created_by || 'Unknown';
        if (!recruiterStats[recruiter]) {
          recruiterStats[recruiter] = { applications: 0, interviews: 0, offers: 0, hires: 0 };
        }
        recruiterStats[recruiter].applications++;
      });

      filteredInterviews.forEach(interview => {
        const recruiter = interview.recruiter_email || 'Unknown';
        if (recruiterStats[recruiter]) {
          recruiterStats[recruiter].interviews++;
        }
      });

      filteredOffers.forEach(offer => {
        const recruiter = offer.recruiter_email || 'Unknown';
        if (recruiterStats[recruiter]) {
          recruiterStats[recruiter].offers++;
          if (offer.signature_status === 'signed') {
            recruiterStats[recruiter].hires++;
          }
        }
      });

      reportData = { recruiter_stats: recruiterStats };

      const topRecruiter = Object.entries(recruiterStats)
        .sort((a, b) => b[1].hires - a[1].hires)[0];
      
      if (topRecruiter) {
        insights.push(`Top performer: ${topRecruiter[0]} with ${topRecruiter[1].hires} hires`);
      }
    }

    return Response.json({
      success: true,
      report_type,
      filters,
      data: reportData,
      insights,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generate advanced report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});