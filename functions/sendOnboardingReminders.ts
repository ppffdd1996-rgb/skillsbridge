import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all pending onboarding tasks due today or tomorrow
    const tasks = await base44.asServiceRole.entities.OnboardingTask.filter({
      status: 'pending',
      reminder_sent: false
    });

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasksToRemind = tasks.filter(task => {
      const taskDate = new Date(task.scheduled_date);
      return taskDate <= tomorrow && taskDate >= now;
    });

    const sent = [];
    const failed = [];

    for (const task of tasksToRemind) {
      try {
        const assignee = task.assigned_to;
        const subject = `Onboarding Reminder: ${task.task_title}`;
        const body = `
Hello,

This is a reminder about an upcoming onboarding task:

Task: ${task.task_title}
Employee: ${task.employee_name} (${task.employee_email})
Start Date: ${task.start_date}
Due: ${new Date(task.scheduled_date).toLocaleDateString()}
Category: ${task.task_category}

Description: ${task.description}

Please complete this task on schedule to ensure a smooth onboarding experience.

Best regards,
Onboarding System
        `;

        // Send email
        await base44.integrations.Core.SendEmail({
          to: assignee,
          subject,
          body
        });

        // Mark as reminder sent
        await base44.asServiceRole.entities.OnboardingTask.update(task.id, {
          reminder_sent: true
        });

        sent.push(task.id);
      } catch (error) {
        console.error(`Failed to send reminder for task ${task.id}:`, error);
        failed.push({ taskId: task.id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      totalTasks: tasks.length,
      tasksToRemind: tasksToRemind.length,
      remindersSent: sent.length,
      remindersFailed: failed.length,
      failed
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});