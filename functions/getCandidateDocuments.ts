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
      folderName = 'Recruitment'
    } = await req.json();

    if (!candidateName) {
      return Response.json(
        { error: 'Missing required field: candidateName' },
        { status: 400 }
      );
    }

    const driveAccessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // Search for candidate folder
    const searchQuery = `name contains '${candidateName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&spaces=drive&fields=files(id,name)&pageSize=10`,
      {
        headers: {
          'Authorization': `Bearer ${driveAccessToken}`
        }
      }
    );

    if (!searchResponse.ok) {
      return Response.json(
        { error: 'Failed to search for documents' },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();
    const folders = searchData.files || [];

    const documents = [];

    // Get files from each matching folder
    for (const folder of folders) {
      const filesResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=parents='${folder.id}' and trashed=false&spaces=drive&fields=files(id,name,mimeType,createdTime,webViewLink)&pageSize=50`,
        {
          headers: {
            'Authorization': `Bearer ${driveAccessToken}`
          }
        }
      );

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        const files = filesData.files || [];

        documents.push({
          folderName: folder.name,
          folderId: folder.id,
          files: files.map(file => ({
            id: file.id,
            name: file.name,
            type: file.mimeType,
            createdTime: file.createdTime,
            driveLink: file.webViewLink
          }))
        });
      }
    }

    return Response.json({
      success: true,
      candidateName,
      totalFolders: documents.length,
      totalDocuments: documents.reduce((sum, folder) => sum + folder.files.length, 0),
      documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});