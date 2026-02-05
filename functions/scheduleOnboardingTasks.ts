import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      employeeEmail,
      employeeName,
      startDate,
      managerEmail
    } = await req.json();

    if (!employeeEmail || !employeeName || !startDate) {
      return Response.json(
        { error: 'Missing required fields: employeeEmail, employeeName, startDate' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const tasks = [];

    // Pre-boarding tasks (before start date)
    const preboardingDate = new Date(start);
    preboardingDate.setDate(preboardingDate.getDate() - 7);

    const preboarding = [
      {
        title: 'Send onboarding documents',
        description: 'Send all necessary HR documents for completion',
        daysOffset: -7
      },
      {
        title: 'Prepare workspace',
        description: 'Set up desk, computer, software access',
        daysOffset: -3,
        assignTo: managerEmail
      },
      {
        title: 'Order equipment',
        description: 'Laptop, monitor, peripherals delivery',
        daysOffset: -7
      },
      {
        title: 'Create employee accounts',
        description: 'Email, network, system access setup',
        daysOffset: -3
      }
    ];

    for (const task of preboarding) {
      const taskDate = new Date(start);
      taskDate.setDate(taskDate.getDate() + task.daysOffset);

      const created = await base44.asServiceRole.entities.OnboardingTask.create({
        employee_email: employeeEmail,
        employee_name: employeeName,
        start_date: startDate,
        task_title: task.title,
        task_category: 'pre-boarding',
        scheduled_date: taskDate.toISOString(),
        description: task.description,
        assigned_to: task.assignTo || user.email,
        status: 'pending'
      });
      tasks.push(created);
    }

    // Day 1 tasks
    const day1Tasks = [
      {
        title: 'Welcome meeting with manager',
        description: 'Introduction, team overview, role expectations',
        daysOffset: 0,
        assignTo: managerEmail
      },
      {
        title: 'IT orientation',
        description: 'System access, software tools, network setup',
        daysOffset: 0
      },
      {
        title: 'HR orientation',
        description: 'Policies, benefits, HR systems overview',
        daysOffset: 0
      },
      {
        title: 'Workspace orientation',
        description: 'Building tour, facilities, security',
        daysOffset: 0,
        assignTo: managerEmail
      }
    ];

    for (const task of day1Tasks) {
      const taskDate = new Date(start);
      taskDate.setDate(taskDate.getDate() + task.daysOffset);
      taskDate.setHours(9, 0, 0);

      const created = await base44.asServiceRole.entities.OnboardingTask.create({
        employee_email: employeeEmail,
        employee_name: employeeName,
        start_date: startDate,
        task_title: task.title,
        task_category: 'day-1',
        scheduled_date: taskDate.toISOString(),
        description: task.description,
        assigned_to: task.assignTo || user.email,
        status: 'pending'
      });
      tasks.push(created);
    }

    // First week tasks
    const weekTasks = [
      {
        title: 'Team introductions',
        description: 'Meet all team members, understand roles',
        daysOffset: 1
      },
      {
        title: 'Project overview',
        description: 'Current projects, priorities, roadmap',
        daysOffset: 2,
        assignTo: managerEmail
      },
      {
        title: 'Goal setting meeting',
        description: '30/60/90 day goals, expectations',
        daysOffset: 3,
        assignTo: managerEmail
      },
      {
        title: 'System training',
        description: 'CRM, project management, communication tools',
        daysOffset: 4
      }
    ];

    for (const task of weekTasks) {
      const taskDate = new Date(start);
      taskDate.setDate(taskDate.getDate() + task.daysOffset);

      const created = await base44.asServiceRole.entities.OnboardingTask.create({
        employee_email: employeeEmail,
        employee_name: employeeName,
        start_date: startDate,
        task_title: task.title,
        task_category: 'first-week',
        scheduled_date: taskDate.toISOString(),
        description: task.description,
        assigned_to: task.assignTo || user.email,
        status: 'pending'
      });
      tasks.push(created);
    }

    // First month task
    const monthTask = await base44.asServiceRole.entities.OnboardingTask.create({
      employee_email: employeeEmail,
      employee_name: employeeName,
      start_date: startDate,
      task_title: '30-Day Check-in',
      task_category: 'first-month',
      scheduled_date: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Progress review, feedback, any concerns',
      assigned_to: managerEmail || user.email,
      status: 'pending'
    });
    tasks.push(monthTask);

    return Response.json({
      success: true,
      employeeEmail,
      employeeName,
      startDate,
      totalTasksCreated: tasks.length,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.task_title,
        category: t.task_category,
        scheduledDate: t.scheduled_date
      }))
    });
  } catch (error) {
    console.error('Schedule onboarding tasks error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});