import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      employeeName,
      employeeEmail,
      jobTitle,
      startDate,
      companyName,
      documentTypes = ['employment_contract', 'nda', 'handbook_acknowledgment']
    } = await req.json();

    if (!employeeName || !employeeEmail || !jobTitle || !startDate) {
      return Response.json(
        { error: 'Missing required fields: employeeName, employeeEmail, jobTitle, startDate' },
        { status: 400 }
      );
    }

    const documents = [];

    for (const docType of documentTypes) {
      let prompt = '';
      let templateName = '';

      if (docType === 'employment_contract') {
        templateName = 'Employment Contract';
        prompt = `Generate a professional employment contract for:
        Employee: ${employeeName} (${employeeEmail})
        Position: ${jobTitle}
        Start Date: ${startDate}
        Company: ${companyName || 'Our Company'}
        
        Include: duties, compensation, benefits, at-will employment, confidentiality, IP assignment, termination clause.`;
      } else if (docType === 'nda') {
        templateName = 'Non-Disclosure Agreement';
        prompt = `Generate a professional NDA for ${employeeName} joining ${companyName || 'the company'} as ${jobTitle}. Include: confidentiality obligations, prohibited disclosures, exceptions, term, remedies.`;
      } else if (docType === 'handbook_acknowledgment') {
        templateName = 'Employee Handbook Acknowledgment';
        prompt = `Generate a professional employee handbook acknowledgment form for ${employeeName}. Include: confirmation of receipt, understanding of policies, acknowledgment of at-will employment, signature lines.`;
      } else if (docType === 'tax_form') {
        templateName = 'Tax Form (W-4/I-9)';
        prompt = `Generate a summary form for ${employeeName} to complete IRS tax withholding (W-4) and employment eligibility (I-9) information. Include fields for: name, SSN, address, filing status, allowances.`;
      } else if (docType === 'insurance_form') {
        templateName = 'Insurance & Benefits Enrollment';
        prompt = `Generate a benefits enrollment form for ${employeeName}. Include: health insurance selection, dental, vision, 401k enrollment, beneficiary information, life insurance.`;
      } else if (docType === 'emergency_contact') {
        templateName = 'Emergency Contact Form';
        prompt = `Generate an emergency contact form for ${employeeName}. Include fields for: primary contact name/phone, secondary contact, relationship, medical conditions, allergies.`;
      } else if (docType === 'direct_deposit') {
        templateName = 'Direct Deposit Authorization';
        prompt = `Generate a direct deposit authorization form for ${employeeName}. Include: employee info, bank routing number, account number, account type, signature lines.`;
      }

      if (prompt) {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              content: { type: 'string' }
            }
          }
        });

        documents.push({
          type: docType,
          name: templateName,
          content: response.content || ''
        });
      }
    }

    return Response.json({
      success: true,
      employeeName,
      employeeEmail,
      jobTitle,
      startDate,
      documents
    });
  } catch (error) {
    console.error('Generate HR documents error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});