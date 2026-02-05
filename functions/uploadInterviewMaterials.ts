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
      materials
    } = await req.json();

    if (!opportunityId || !opportunityTitle || !materials || !Array.isArray(materials)) {
      return Response.json(
        { error: 'Missing required fields: opportunityId, opportunityTitle, materials (array)' },
        { status: 400 }
      );
    }

    const driveAccessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    const baseFolderName = 'Recruitment - Interview Materials';
    const opportunityFolderName = opportunityTitle;

    // Get or create base folder
    let baseFolderId = 'root';
    const baseFolderSearchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${baseFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&fields=files(id)&pageSize=1`,
      {
        headers: {
          'Authorization': `Bearer ${driveAccessToken}`
        }
      }
    );

    if (baseFolderSearchResponse.ok) {
      const baseFolderSearchData = await baseFolderSearchResponse.json();
      if (baseFolderSearchData.files && baseFolderSearchData.files.length > 0) {
        baseFolderId = baseFolderSearchData.files[0].id;
      }
    }

    // Get or create opportunity folder
    let opportunityFolderId = 'root';
    const oppFolderSearchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${opportunityFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&fields=files(id)&pageSize=1`,
      {
        headers: {
          'Authorization': `Bearer ${driveAccessToken}`
        }
      }
    );

    if (oppFolderSearchResponse.ok) {
      const oppFolderSearchData = await oppFolderSearchResponse.json();
      if (oppFolderSearchData.files && oppFolderSearchData.files.length > 0) {
        opportunityFolderId = oppFolderSearchData.files[0].id;
      }
    }

    const uploadedMaterials = [];
    const failedMaterials = [];

    for (const material of materials) {
      try {
        const { fileUrl, fileName, description } = material;

        if (!fileUrl || !fileName) {
          failedMaterials.push({
            fileName: fileName || 'Unknown',
            error: 'Missing fileUrl or fileName'
          });
          continue;
        }

        // Download file
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          failedMaterials.push({
            fileName,
            error: 'Failed to download file'
          });
          continue;
        }

        const fileBlob = await fileResponse.arrayBuffer();

        const metadata = {
          name: fileName,
          mimeType: getMimeType(fileName),
          parents: [opportunityFolderId],
          description: description || `Interview material for ${opportunityTitle}`
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', new Blob([fileBlob]));

        const uploadResponse = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${driveAccessToken}`
            },
            body: formData
          }
        );

        if (uploadResponse.ok) {
          const uploadedFile = await uploadResponse.json();
          uploadedMaterials.push({
            fileName: uploadedFile.name,
            fileId: uploadedFile.id,
            driveLink: uploadedFile.webViewLink,
            status: 'success'
          });
        } else {
          failedMaterials.push({
            fileName,
            error: 'Failed to upload to Drive'
          });
        }
      } catch (error) {
        failedMaterials.push({
          fileName: material.fileName || 'Unknown',
          error: error.message
        });
      }
    }

    return Response.json({
      success: uploadedMaterials.length > 0,
      opportunity: opportunityTitle,
      totalMaterials: materials.length,
      uploadedCount: uploadedMaterials.length,
      failedCount: failedMaterials.length,
      uploaded: uploadedMaterials,
      failed: failedMaterials
    });
  } catch (error) {
    console.error('Upload materials error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'zip': 'application/zip'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}