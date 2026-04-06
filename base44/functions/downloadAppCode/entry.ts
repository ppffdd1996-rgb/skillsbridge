import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Collect all app code
    const codePackage = {
      app_name: "SkillsBridge Recruitment Platform",
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      files: {
        entities: {},
        pages: {},
        components: {},
        functions: {},
        agents: {},
        layout: null
      }
    };

    // Get all entities
    const entitySchemas = [
      'User', 'Skill', 'Opportunity', 'Match', 'Application', 'Interview',
      'EmailTemplate', 'SupportTicket', 'InterviewSlot', 'PersonalizedOnboardingPlan',
      'DocumentSigningRequest', 'SkillVerificationReport', 'HRSystemIntegration',
      'CandidateEngagement', 'OfferLetter', 'OnboardingTask', 'HRDocument',
      'TalentPoolMember', 'ScheduledEmail', 'RecruiterCollaboration', 'RecruiterNote',
      'TalentPool', 'Boost', 'Message', 'Conversation', 'Flag', 'Payment',
      'Onboarding', 'RecruiterAvailability', 'PlatformAnalytics', 'AIConfiguration',
      'MatchConfiguration', 'CompanyProfile'
    ];

    for (const entityName of entitySchemas) {
      try {
        const schema = await base44.asServiceRole.entities[entityName].schema();
        codePackage.files.entities[`${entityName}.json`] = schema;
      } catch (error) {
        console.log(`Skipping ${entityName}: ${error.message}`);
      }
    }

    // Note: We cannot directly read page/component/function source code from the database
    // This would require file system access which isn't available in the runtime
    // Instead, we'll return entity schemas and metadata

    const metadata = {
      total_entities: Object.keys(codePackage.files.entities).length,
      note: "Entity schemas exported. For complete source code including pages, components, and functions, please access the Base44 dashboard code editor."
    };

    return Response.json({
      success: true,
      ...codePackage,
      metadata
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="skillsbridge-code-${Date.now()}.json"`
      }
    });

  } catch (error) {
    console.error('Download app code error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});