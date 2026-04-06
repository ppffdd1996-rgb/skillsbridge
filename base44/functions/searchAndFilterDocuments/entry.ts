import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      searchQuery,
      fileType,
      folderId,
      createdAfter,
      createdBefore,
      modifiedAfter,
      modifiedBefore,
      maxResults = 50
    } = await req.json();

    const driveAccessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    let query = 'trashed=false';

    // Add search query
    if (searchQuery) {
      query += ` and name contains '${searchQuery}'`;
    }

    // Add file type filter
    if (fileType) {
      const mimeTypeMap = {
        'pdf': 'application/pdf',
        'doc': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image': 'application/vnd.google-apps.folder or mimeType contains \'image/\'',
        'spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'folder': 'mimeType=\'application/vnd.google-apps.folder\''
      };
      const mimeType = mimeTypeMap[fileType] || fileType;
      query += ` and mimeType='${mimeType}'`;
    }

    // Add folder filter
    if (folderId) {
      query += ` and parents='${folderId}'`;
    }

    // Add date filters
    if (createdAfter) {
      const date = new Date(createdAfter).toISOString();
      query += ` and createdTime>='${date}'`;
    }
    if (createdBefore) {
      const date = new Date(createdBefore).toISOString();
      query += ` and createdTime<='${date}'`;
    }
    if (modifiedAfter) {
      const date = new Date(modifiedAfter).toISOString();
      query += ` and modifiedTime>='${date}'`;
    }
    if (modifiedBefore) {
      const date = new Date(modifiedBefore).toISOString();
      query += ` and modifiedTime<='${date}'`;
    }

    const params = new URLSearchParams();
    params.append('q', query);
    params.append('spaces', 'drive');
    params.append('pageSize', Math.min(maxResults, 100));
    params.append('fields', 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,size,owners(displayName,emailAddress))');
    params.append('orderBy', 'modifiedTime desc');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${driveAccessToken}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return Response.json(
        { error: 'Failed to search documents', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const files = data.files || [];

    // Format results
    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.mimeType,
      size: file.size,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      driveLink: file.webViewLink,
      owner: file.owners?.[0]?.displayName || 'Unknown'
    }));

    return Response.json({
      success: true,
      searchQuery: searchQuery || 'all files',
      totalResults: formattedFiles.length,
      filters: {
        fileType: fileType || 'any',
        folderId: folderId || 'all',
        createdAfter: createdAfter || 'any',
        createdBefore: createdBefore || 'any',
        modifiedAfter: modifiedAfter || 'any',
        modifiedBefore: modifiedBefore || 'any'
      },
      files: formattedFiles
    });
  } catch (error) {
    console.error('Search documents error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});