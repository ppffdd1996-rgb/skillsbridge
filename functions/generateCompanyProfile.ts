import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      company_name,
      industry,
      company_size,
      brief_description,
      target_roles,
      website
    } = await req.json();

    if (!company_name || !industry) {
      return Response.json({ error: 'company_name and industry required' }, { status: 400 });
    }

    // Use AI to generate comprehensive company profile
    const profile = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Generate a comprehensive, professional company profile based on this information:

Company Name: ${company_name}
Industry: ${industry}
Company Size: ${company_size || 'Not specified'}
Brief Description: ${brief_description || 'Not provided'}
Target Roles: ${target_roles?.join(', ') || 'Not specified'}
Website: ${website || 'Not provided'}

Create:
1. A compelling 2-3 paragraph company description that highlights uniqueness and appeal to candidates
2. A concise, inspiring mission statement (1-2 sentences)
3. 5-7 culture highlights that would attract top talent
4. 4-6 core company values
5. 8-12 relevant keywords for attracting candidates (skills, technologies, culture terms)
6. 3-5 target candidate pools (e.g., "Senior Software Engineers", "Data Scientists", "Product Designers")
7. Branding elements: primary color (hex), secondary color (hex), tone (professional/casual/innovative), personality (innovative/traditional/dynamic)
8. 6-8 employee benefits that are common in this industry

Make the content authentic, professional, and tailored to attract the right talent.`,
      response_json_schema: {
        type: "object",
        properties: {
          description: { type: "string" },
          mission_statement: { type: "string" },
          culture_highlights: {
            type: "array",
            items: { type: "string" }
          },
          values: {
            type: "array",
            items: { type: "string" }
          },
          keywords: {
            type: "array",
            items: { type: "string" }
          },
          target_candidate_pools: {
            type: "array",
            items: { type: "string" }
          },
          branding_elements: {
            type: "object",
            properties: {
              primary_color: { type: "string" },
              secondary_color: { type: "string" },
              tone: { type: "string" },
              personality: { type: "string" }
            }
          },
          benefits: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Save or update profile
    const existing = await base44.asServiceRole.entities.CompanyProfile.filter({
      recruiter_email: user.email
    });

    let savedProfile;
    if (existing.length > 0) {
      savedProfile = await base44.asServiceRole.entities.CompanyProfile.update(
        existing[0].id,
        {
          company_name,
          industry,
          company_size,
          website,
          ...profile
        }
      );
    } else {
      savedProfile = await base44.asServiceRole.entities.CompanyProfile.create({
        recruiter_email: user.email,
        company_name,
        industry,
        company_size,
        website,
        ...profile
      });
    }

    return Response.json({
      success: true,
      profile: savedProfile
    });

  } catch (error) {
    console.error('Generate company profile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});