import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role === 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      employee_email,
      employee_name,
      role,
      department,
      user_type,
      start_date,
      application_id
    } = await req.json();

    if (!employee_email || !employee_name || !role || !department) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get skill verification reports if available
    let skillGaps = [];
    let existingSkills = [];
    if (application_id) {
      const application = await base44.asServiceRole.entities.Application.filter({ id: application_id });
      if (application.length > 0 && application[0].skill_verifications) {
        const verifications = application[0].skill_verifications;
        verifications.forEach(v => {
          if (v.ai_verification_score < 70) {
            skillGaps.push(v.skill);
          } else {
            existingSkills.push(v.skill);
          }
        });
      }
    }

    // Fetch team members from the same department
    const teamMembers = await base44.asServiceRole.entities.User.list();
    const departmentTeam = teamMembers.filter(m => 
      m.department === department && m.email !== employee_email
    ).slice(0, 5);

    // Generate personalized content using AI
    const personalizationPrompt = `Generate a comprehensive personalized onboarding plan for a new hire:

Employee: ${employee_name}
Role: ${role}
Department: ${department}
User Type: ${user_type}
Start Date: ${start_date}
Existing Skills: ${existingSkills.join(', ') || 'None provided'}
Skill Gaps: ${skillGaps.join(', ') || 'None identified'}

Create:
1. A warm, personalized welcome message (2-3 paragraphs)
2. 8-10 role-specific onboarding tasks with categories (pre-boarding, day-1, first-week, first-month)
3. 4-5 onboarding milestones with target dates
4. Brief context about what makes this role unique

Consider the user type: ${user_type === 'employer' ? 'This person will be managing teams and posting jobs' : 'This person will be applying to jobs and building their profile'}

Return JSON with:
{
  "welcome_message": "...",
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "category": "pre-boarding|day-1|first-week|first-month",
      "priority": "high|medium|low",
      "days_offset": <number of days from start>
    }
  ],
  "milestones": [
    {
      "title": "...",
      "description": "...",
      "days_offset": <number>
    }
  ]
}`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: personalizationPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          welcome_message: { type: "string" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
                priority: { type: "string" },
                days_offset: { type: "number" }
              }
            }
          },
          milestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                days_offset: { type: "number" }
              }
            }
          }
        }
      }
    });

    // Generate team introductions
    const teamIntroductions = [];
    for (const member of departmentTeam) {
      const introPrompt = `Write a brief, friendly introduction for ${member.full_name} (${member.role || 'Team Member'}) to ${employee_name} who is joining as ${role}. Keep it warm and helpful, 2-3 sentences mentioning how they might work together.`;
      
      try {
        const intro = await base44.integrations.Core.InvokeLLM({
          prompt: introPrompt
        });
        teamIntroductions.push({
          name: member.full_name,
          role: member.role || 'Team Member',
          email: member.email,
          introduction: intro
        });
      } catch (err) {
        console.error('Failed to generate intro for:', member.email);
      }
    }

    // Get training recommendations if skill gaps exist
    let recommendedTraining = [];
    if (skillGaps.length > 0) {
      const trainingResponse = await base44.functions.invoke('suggestTrainingResources', {
        skill_gaps: skillGaps,
        role,
        user_type
      });
      recommendedTraining = trainingResponse.data.resources || [];
    }

    // Calculate scheduled dates for tasks
    const startDateObj = new Date(start_date);
    const personalizedTasks = aiResponse.tasks.map(task => {
      const scheduledDate = new Date(startDateObj);
      scheduledDate.setDate(scheduledDate.getDate() + task.days_offset);
      return {
        ...task,
        scheduled_date: scheduledDate.toISOString(),
        assigned_to: task.category === 'day-1' ? user.email : employee_email
      };
    });

    const milestones = aiResponse.milestones.map(milestone => {
      const targetDate = new Date(startDateObj);
      targetDate.setDate(targetDate.getDate() + milestone.days_offset);
      return {
        ...milestone,
        target_date: targetDate.toISOString(),
        completed: false
      };
    });

    // Create personalized onboarding plan
    const plan = await base44.asServiceRole.entities.PersonalizedOnboardingPlan.create({
      employee_email,
      employee_name,
      role,
      department,
      user_type: user_type || 'candidate',
      start_date,
      personalized_tasks: personalizedTasks,
      welcome_message: aiResponse.welcome_message,
      team_introductions: teamIntroductions,
      skill_gaps_identified: skillGaps,
      recommended_training: recommendedTraining,
      milestones,
      status: 'active'
    });

    // Create actual OnboardingTask entities
    const taskPromises = personalizedTasks.map(task =>
      base44.asServiceRole.entities.OnboardingTask.create({
        employee_email,
        employee_name,
        start_date,
        task_title: task.title,
        task_category: task.category,
        scheduled_date: task.scheduled_date,
        description: task.description,
        assigned_to: task.assigned_to,
        status: 'pending'
      })
    );
    await Promise.all(taskPromises);

    return Response.json({
      success: true,
      plan,
      tasks_created: personalizedTasks.length,
      team_members_introduced: teamIntroductions.length,
      training_modules: recommendedTraining.length
    });

  } catch (error) {
    console.error('Personalized onboarding generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});