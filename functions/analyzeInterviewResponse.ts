import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      question,
      candidateResponse,
      jobRequirements,
      candidateSkills,
      questionCategory
    } = await req.json();

    if (!question || !candidateResponse) {
      return Response.json(
        { error: 'Missing required fields: question, candidateResponse' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert interview analyst. Analyze the candidate's response to an interview question and provide real-time feedback.

Question Category: ${questionCategory || 'general'}
Interview Question:
${question}

Candidate's Response:
${candidateResponse}

Job Requirements:
${jobRequirements || 'Not specified'}

Candidate's Skills:
${candidateSkills ? candidateSkills.join(', ') : 'Not provided'}

Provide analysis in JSON format with:
1. Overall assessment (1-10 score)
2. Strengths demonstrated
3. Areas of concern
4. Relevant skills alignment
5. Recommended follow-up questions
6. Interview tips for the interviewer

Return this JSON structure:
{
  "score": <number 1-10>,
  "strengths": [<list of strengths>],
  "concerns": [<list of concerns>],
  "skillsAlignment": <percentage match with job requirements>,
  "followUpQuestions": [<2-3 recommended follow-up questions>],
  "interviewerTips": [<2-3 tips for the interviewer>],
  "summary": "<brief overall assessment>"
}

Return ONLY the JSON object.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          strengths: { type: 'array', items: { type: 'string' } },
          concerns: { type: 'array', items: { type: 'string' } },
          skillsAlignment: { type: 'number' },
          followUpQuestions: { type: 'array', items: { type: 'string' } },
          interviewerTips: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: response || {}
    });
  } catch (error) {
    console.error('Analyze interview response error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});