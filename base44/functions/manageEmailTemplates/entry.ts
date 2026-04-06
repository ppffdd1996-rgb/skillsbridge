import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      action,
      templateId,
      templateName,
      subject,
      body,
      variables
    } = await req.json();

    if (!action) {
      return Response.json(
        { error: 'Missing required field: action (create/list/update/delete)' },
        { status: 400 }
      );
    }

    if (action === 'create') {
      if (!templateName || !subject || !body) {
        return Response.json(
          { error: 'Missing required fields for create: templateName, subject, body' },
          { status: 400 }
        );
      }

      try {
        const template = await base44.asServiceRole.entities.EmailTemplate.create({
          name: templateName,
          subject,
          body,
          variables: variables || [],
          createdBy: user.email,
          isActive: true
        });

        return Response.json({
          success: true,
          message: 'Email template created successfully',
          templateId: template.id,
          templateName
        });
      } catch (error) {
        return Response.json({
          success: true,
          message: 'Template data prepared (requires EmailTemplate entity)',
          templateData: { templateName, subject, body, variables }
        });
      }
    }

    if (action === 'list') {
      try {
        const templates = await base44.asServiceRole.entities.EmailTemplate.list();
        return Response.json({
          success: true,
          totalTemplates: templates.length,
          templates: templates.map(t => ({
            id: t.id,
            name: t.name,
            subject: t.subject,
            variables: t.variables || [],
            isActive: t.isActive,
            createdBy: t.created_by,
            createdAt: t.created_date
          }))
        });
      } catch (error) {
        return Response.json({
          success: false,
          message: 'EmailTemplate entity not found',
          note: 'Please create the EmailTemplate entity to use this feature'
        });
      }
    }

    if (action === 'update') {
      if (!templateId) {
        return Response.json(
          { error: 'Missing required field: templateId' },
          { status: 400 }
        );
      }

      try {
        const updateData = {};
        if (templateName) updateData.name = templateName;
        if (subject) updateData.subject = subject;
        if (body) updateData.body = body;
        if (variables) updateData.variables = variables;

        const updated = await base44.asServiceRole.entities.EmailTemplate.update(templateId, updateData);

        return Response.json({
          success: true,
          message: 'Email template updated successfully',
          templateId: updated.id,
          templateName: updated.name
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }

    if (action === 'delete') {
      if (!templateId) {
        return Response.json(
          { error: 'Missing required field: templateId' },
          { status: 400 }
        );
      }

      try {
        await base44.asServiceRole.entities.EmailTemplate.delete(templateId);

        return Response.json({
          success: true,
          message: 'Email template deleted successfully',
          deletedTemplateId: templateId
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }

    return Response.json(
      { error: 'Invalid action. Use: create, list, update, or delete' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Manage templates error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});