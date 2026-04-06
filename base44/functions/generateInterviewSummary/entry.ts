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
      opportunityTitle,
      jobRequirements,
      candidateSkills,
      interviewNotes,
      questionsAndAnswers = []
    } = await req.json();

    if (!interviewNotes) {
      return Response.json(
        { error: 'Missing required field: interviewNotes' },
        { status: 400 }
      );
    }

    const questionsContext = questionsAndAnswers.length > 0
      ? '\n\nQuestions & Answers:\n' + questionsAndAnswers
        .map((qa, idx) => `Q${idx + 1}: ${qa.question}\nA: ${qa.answer}`)
        .join('\n\n')
      : '';

    const prompt = `You are an expert recruiter and interview analyst. Analyze the complete interview and provide a comprehensive summary with key insights.

Candidate Name: ${candidateName}
Position: ${opportunityTitle}

Job Requirements:
${jobRequirements || 'Not specified'}

Candidate's Pre-Interview Skills:
${candidateSkills ? candidateSkills.join(', ') : 'Not provided'}

Interview Notes:
${interviewNotes}
${questionsContext}

Provide a detailed analysis in JSON format:
{
  "overallAssessment": "<1-2 paragraph summary of the candidate>",
  "recommendedRating": <1-5 score>,
  "ratingJustification": "<why this rating>",
  "strengths": [<list of key strengths demonstrated>],
  "weaknesses": [<list of areas of concern>],
  "skillsMatched": {
    "matched": [<skills aligned with job requirements>],
    "gaps": [<skills required but not demonstrated>],
    "canLearn": [<skills that can be developed>]
  },
  "culturalFit": "<assessment of cultural alignment>",
  "keyInsights": [<3-5 important takeaways>],
  "recommendations": [<actionable next steps>],
  "redFlags": [<any concerns or red flags>],
  "candidates_strengths_compared_to_role": "<how candidate stands out for this specific role>"
}

Return ONLY the JSON object.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          overallAssessment: { type: 'string' },
          recommendedRating: { type: 'number' },
          ratingJustification: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' } },
          weaknesses: { type: 'array', items: { type: 'string' } },
          skillsMatched: {
            type: 'object',
            properties: {
              matched: { type: 'array', items: { type: 'string' } },
              gaps: { type: 'array', items: { type: 'string' } },
              canLearn: { type: 'array', items: { type: 'string' } }
            }
          },
          culturalFit: { type: 'string' },
          keyInsights: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          redFlags: { type: 'array', items: { type: 'string' } },
          candidates_strengths_compared_to_role: { type: 'string' }
        }
      }
    });

    // Store summary in application notes
    try {
      const applications = await base44.asServiceRole.entities.Application.filter({
        applicant_name: candidateName
      });

      if (applications.length > 0) {
        const app = applications[0];
        await base44.asServiceRole.entities.Application.update(app.id, {
          ai_summary: response.overallAssessment,
          screening_notes: JSON.stringify(response, null, 2)
        });
      }
    } catch (dbError) {
      console.log('Note: Could not update application record');
    }

    return Response.json({
      success: true,
      candidateName,
      opportunityTitle,
      summary: response || {}
    });
  } catch (error) {
    console.error('Generate interview summary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});