import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      opportunityId,
      opportunityTitle,
      jobDescription,
      candidateName,
      candidateSkills,
      candidateExperience,
      interviewType = 'technical'
    } = await req.json();

    if (!jobDescription) {
      return Response.json(
        { error: 'Missing required field: jobDescription' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert recruiter and interview coach. Generate comprehensive interview questions for a ${interviewType} interview.

Job Position: ${opportunityTitle || 'Not specified'}
Job Description:
${jobDescription}

Candidate Name: ${candidateName || 'Unknown'}
Candidate Skills: ${candidateSkills ? candidateSkills.join(', ') : 'Not provided'}
Candidate Experience: ${candidateExperience || 'Not provided'}
Interview Type: ${interviewType}

Generate ${interviewType === 'technical' ? 8 : 10} interview questions that:
1. Assess relevant skills and experience
2. Explore problem-solving abilities
3. Evaluate cultural fit
4. Include follow-up probing questions

Format your response as a JSON array with this structure:
[
  {
    "question": "The main question",
    "category": "technical|behavioral|situational|culture-fit",
    "difficulty": "easy|medium|hard",
    "why": "Why this question is important",
    "followUp": ["Follow-up question 1", "Follow-up question 2"]
  }
]

Return ONLY the JSON array, no additional text.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                category: { type: 'string' },
                difficulty: { type: 'string' },
                why: { type: 'string' },
                followUp: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    });

    // Parse response
    let questions = [];
    if (typeof response === 'string') {
      try {
        questions = JSON.parse(response);
        if (!Array.isArray(questions)) {
          questions = questions.questions || [];
        }
      } catch (e) {
        questions = [];
      }
    } else if (response.questions) {
      questions = response.questions;
    } else if (Array.isArray(response)) {
      questions = response;
    }

    return Response.json({
      success: true,
      opportunityTitle,
      candidateName,
      interviewType,
      totalQuestions: questions.length,
      questions: questions.slice(0, 10)
    });
  } catch (error) {
    console.error('Generate interview questions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});