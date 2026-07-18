import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // CREATE: generate letter text via LLM, persist OfferLetter, optionally email candidate
    if (action === 'create') {
      const { candidate_email, candidate_name, opportunity_id, job_title, start_date, salary, benefits, send_now } = body;
      if (!candidate_email || !candidate_name || !job_title || !start_date) {
        return Response.json({ error: 'candidate_email, candidate_name, job_title, start_date required' }, { status: 400 });
      }

      // Resolve opportunity for company context
      let opportunity = null;
      if (opportunity_id) {
        try { opportunity = await base44.asServiceRole.entities.Opportunity.get(opportunity_id); } catch (e) {}
      }

      const companyName = opportunity?.company_name || 'Our Company';

      let offerContent = '';
      try {
        const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Generate a professional offer letter.\n\nCandidate: ${candidate_name}\nJob Title: ${job_title}\nStart Date: ${start_date}\nSalary: ${salary || 'Competitive'}\nBenefits: ${benefits || 'Standard company benefits'}\nCompany: ${companyName}\n\nCreate a formal offer letter with greeting, position details, employment terms, benefits summary, at-will clause, and signature lines. Return the full letter text.`,
          response_json_schema: {
            type: 'object',
            properties: { offerLetterContent: { type: 'string' }, summary: { type: 'string' } }
          }
        });
        offerContent = llm.offerLetterContent || '';
      } catch (e) {
        console.log('Offer LLM failed:', e?.message || e);
      }

      const signature_status = send_now ? 'sent' : 'pending';
      const sent_at = send_now ? new Date().toISOString() : undefined;

      const offer = await base44.asServiceRole.entities.OfferLetter.create({
        candidate_email,
        candidate_name,
        opportunity_id: opportunity_id || '',
        job_title,
        start_date,
        salary: salary || '',
        benefits: benefits || '',
        recruiter_email: user.email,
        signature_status,
        sent_at,
        notes: offerContent ? '' : 'LLM generation failed; letter body empty.'
      });

      // Update linked application to 'offered' if exists
      if (opportunity_id) {
        try {
          const apps = await base44.asServiceRole.entities.Application.filter({
            opportunity_id, applicant_email: candidate_email
          });
          if (apps.length > 0) {
            await base44.asServiceRole.entities.Application.update(apps[0].id, { status: 'offered' });
          }
        } catch (e) {}
      }

      if (send_now) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: candidate_email,
            subject: `Offer Letter: ${job_title} at ${companyName}`,
            body: `Hi ${candidate_name},\n\nCongratulations! We're pleased to extend an offer for the ${job_title} position${opportunity ? ' at ' + (opportunity.company_name || companyName) : ''}.\n\nStart Date: ${start_date}\nCompensation: ${salary || 'As discussed'}\n\n${offerContent ? offerContent + '\n\n' : ''}Please review and respond at your earliest convenience.\n\nBest regards,\nThe Hiring Team`,
            from_name: 'SkillsBridge Offers'
          });
        } catch (e) {
          console.log('Offer email failed:', e?.message || e);
        }
      }

      return Response.json({ success: true, offer });
    }

    // UPDATE STATUS
    if (action === 'update_status') {
      const { offer_id, signature_status, notes } = body;
      if (!offer_id || !signature_status) return Response.json({ error: 'offer_id and signature_status required' }, { status: 400 });

      const offer = await base44.asServiceRole.entities.OfferLetter.get(offer_id);
      if (!offer) return Response.json({ error: 'Offer not found' }, { status: 404 });

      const updates = { signature_status };
      if (signature_status === 'signed') updates.signed_at = new Date().toISOString();
      if (signature_status === 'sent' && !offer.sent_at) updates.sent_at = new Date().toISOString();
      if (notes !== undefined) updates.notes = notes;

      const updated = await base44.asServiceRole.entities.OfferLetter.update(offer_id, updates);

      // Sync application status
      if (offer.opportunity_id) {
        try {
          const apps = await base44.asServiceRole.entities.Application.filter({
            opportunity_id: offer.opportunity_id, applicant_email: offer.candidate_email
          });
          if (apps.length > 0) {
            const appStatus = signature_status === 'signed' ? 'hired' : signature_status === 'declined' ? 'rejected' : 'offered';
            await base44.asServiceRole.entities.Application.update(apps[0].id, { status: appStatus });
          }
        } catch (e) {}
      }

      return Response.json({ success: true, offer: updated });
    }

    // BENCHMARK: compare offer salary against market data via LLM with web context
    if (action === 'benchmark') {
      const { job_title, salary, location } = body;
      if (!job_title || !salary) return Response.json({ error: 'job_title and salary required' }, { status: 400 });

      // Parse numeric salary from strings like "$90,000" or "90000 USD"
      const numericSalary = parseFloat(String(salary).replace(/[^0-9.]/g, ''));

      let analysis = null;
      try {
        const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a compensation analyst. Research current market salary data for the role: "${job_title}"${location ? ' in ' + location : ''}.

I'm considering offering a salary of ${salary} (parsed numeric value: ${isNaN(numericSalary) ? 'unknown' : numericSalary}).

Return a JSON object with:
- market_low: numeric lower bound of typical salary range (USD annual)
- market_median: numeric median market salary (USD annual)
- market_high: numeric upper bound (USD annual)
- percentile: the percentile at which the offered salary sits (0-100 number; e.g. 75 means the offer is higher than 75% of market)
- competitiveness: one of "below_market", "at_market", "above_market"
- recommendation: one of "increase_offer", "competitive", "consider_reduction"
- summary: a 2-3 sentence plain-English explanation comparing the offer to market benchmarks and whether it's competitive.
- similar_roles: an array of 3 objects {title, median_salary} of comparable roles and their typical median salaries.

Base numbers on current real market data from the web.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              market_low: { type: 'number' },
              market_median: { type: 'number' },
              market_high: { type: 'number' },
              percentile: { type: 'number' },
              competitiveness: { type: 'string' },
              recommendation: { type: 'string' },
              summary: { type: 'string' },
              similar_roles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    median_salary: { type: 'number' }
                  }
                }
              }
            }
          }
        });
        analysis = llm;
      } catch (e) {
        console.log('Benchmark LLM failed:', e?.message || e);
      }

      if (!analysis) return Response.json({ error: 'Failed to retrieve market data' }, { status: 502 });
      return Response.json({ success: true, job_title, salary, location, analysis });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('manageOffer error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});