import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      fileId,
      action,
      users,
      role = 'reader'
    } = await req.json();

    if (!fileId || !action) {
      return Response.json(
        { error: 'Missing required fields: fileId, action (add/remove/list)' },
        { status: 400 }
      );
    }

    const driveAccessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    if (action === 'list') {
      // List all permissions for a file
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?fields=permissions(id,type,role,emailAddress,displayName)`,
        {
          headers: {
            'Authorization': `Bearer ${driveAccessToken}`
          }
        }
      );

      if (!response.ok) {
        return Response.json(
          { error: 'Failed to list permissions' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return Response.json({
        success: true,
        fileId,
        permissions: data.permissions || []
      });
    }

    if (action === 'add') {
      if (!users || !Array.isArray(users) || users.length === 0) {
        return Response.json(
          { error: 'Missing users array for add action' },
          { status: 400 }
        );
      }

      const addedPermissions = [];
      const failedPermissions = [];

      for (const user of users) {
        try {
          const permissionData = {
            type: user.type || 'user',
            role: user.role || role,
            emailAddress: user.email
          };

          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=true`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${driveAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(permissionData)
            }
          );

          if (response.ok) {
            const permission = await response.json();
            addedPermissions.push({
              email: user.email,
              role: user.role || role,
              permissionId: permission.id,
              status: 'added'
            });
          } else {
            failedPermissions.push({
              email: user.email,
              error: 'Failed to add permission'
            });
          }
        } catch (error) {
          failedPermissions.push({
            email: user.email,
            error: error.message
          });
        }
      }

      return Response.json({
        success: addedPermissions.length > 0,
        fileId,
        addedCount: addedPermissions.length,
        failedCount: failedPermissions.length,
        added: addedPermissions,
        failed: failedPermissions
      });
    }

    if (action === 'remove') {
      if (!users || !Array.isArray(users) || users.length === 0) {
        return Response.json(
          { error: 'Missing users array for remove action' },
          { status: 400 }
        );
      }

      const removedPermissions = [];
      const failedPermissions = [];

      for (const user of users) {
        try {
          const permissionId = user.permissionId;
          if (!permissionId) {
            failedPermissions.push({
              email: user.email,
              error: 'Missing permissionId'
            });
            continue;
          }

          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${driveAccessToken}`
              }
            }
          );

          if (response.ok) {
            removedPermissions.push({
              email: user.email,
              permissionId,
              status: 'removed'
            });
          } else {
            failedPermissions.push({
              email: user.email,
              error: 'Failed to remove permission'
            });
          }
        } catch (error) {
          failedPermissions.push({
            email: user.email,
            error: error.message
          });
        }
      }

      return Response.json({
        success: removedPermissions.length > 0,
        fileId,
        removedCount: removedPermissions.length,
        failedCount: failedPermissions.length,
        removed: removedPermissions,
        failed: failedPermissions
      });
    }

    return Response.json(
      { error: 'Invalid action. Use: add, remove, or list' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Manage permissions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});