import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      candidateName,
      candidateEmail,
      jobTitle,
      startDate,
      salary,
      benefits,
      companyName,
      departmentName,
      reportsTo,
      employmentType = 'Full-time'
    } = await req.json();

    if (!candidateName || !candidateEmail || !jobTitle || !startDate || !salary) {
      return Response.json(
        { error: 'Missing required fields: candidateName, candidateEmail, jobTitle, startDate, salary' },
        { status: 400 }
      );
    }

    const prompt = `Generate a professional offer letter for the following candidate:

Candidate Name: ${candidateName}
Candidate Email: ${candidateEmail}
Job Title: ${jobTitle}
Start Date: ${startDate}
Salary: ${salary}
Employment Type: ${employmentType}
Company Name: ${companyName || 'Our Company'}
Department: ${departmentName || 'N/A'}
Reports To: ${reportsTo || 'Not specified'}
Benefits: ${benefits || 'Standard company benefits'}

Create a formal, professional offer letter that includes:
1. Warm greeting
2. Position details (title, department, reporting line)
3. Employment terms (start date, type, salary)
4. Benefits summary
5. At-will employment clause
6. Confidentiality and IP assignment
7. Next steps and signature lines
8. Professional closing

Format as a complete letter ready to be converted to PDF. Include signature date line for both employee and company representative.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          offerLetterContent: { type: 'string' },
          summary: { type: 'string' }
        }
      }
    });

    const offerContent = response.offerLetterContent || '';

    return Response.json({
      success: true,
      candidateName,
      candidateEmail,
      jobTitle,
      startDate,
      offerContent
    });
  } catch (error) {
    console.error('Generate offer letter error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});