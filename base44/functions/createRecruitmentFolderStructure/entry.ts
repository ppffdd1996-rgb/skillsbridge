import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      opportunityTitle,
      opportunityId,
      parentFolderId = 'root'
    } = await req.json();

    if (!opportunityTitle) {
      return Response.json(
        { error: 'Missing required field: opportunityTitle' },
        { status: 400 }
      );
    }

    const driveAccessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // Folder structure template
    const folderStructure = [
      {
        name: `${opportunityTitle}`,
        children: [
          { name: 'Candidates' },
          { name: 'Interview Materials' },
          { name: 'Job Description & Requirements' },
          { name: 'Offer Letters & Contracts' },
          { name: 'Communication' },
          { name: 'Reference Checks' }
        ]
      }
    ];

    const createdFolders = {};

    // Create main opportunity folder
    async function createFolder(folderName, parentId) {
      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      };

      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${driveAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metadata)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create folder: ${folderName}`);
      }

      return await response.json();
    }

    // Create recursive folder structure
    async function buildFolders(folders, parentId, level = 0) {
      for (const folder of folders) {
        const created = await createFolder(folder.name, parentId);
        const key = level === 0 ? 'main' : folder.name;
        createdFolders[key] = {
          id: created.id,
          name: created.name,
          link: created.webViewLink
        };

        if (folder.children && folder.children.length > 0) {
          createdFolders[folder.name] = createdFolders[folder.name] || {};
          for (const child of folder.children) {
            const childFolder = await createFolder(child.name, created.id);
            createdFolders[folder.name][child.name] = {
              id: childFolder.id,
              name: childFolder.name,
              link: childFolder.webViewLink
            };
          }
        }
      }
    }

    await buildFolders(folderStructure, parentFolderId);

    return Response.json({
      success: true,
      message: 'Recruitment folder structure created successfully',
      opportunityTitle,
      opportunityId,
      folderStructure: createdFolders
    });
  } catch (error) {
    console.error('Create folder structure error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});