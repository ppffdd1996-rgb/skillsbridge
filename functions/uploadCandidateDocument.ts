import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, fileName, candidateName, candidateEmail, documentType, folderName } = await req.json();

    if (!fileUrl || !fileName) {
      return Response.json(
        { error: 'Missing required fields: fileUrl, fileName' },
        { status: 400 }
      );
    }

    const driveAccessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // Download file from URL
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return Response.json(
        { error: 'Failed to download file from source URL' },
        { status: 400 }
      );
    }

    const fileBlob = await fileResponse.arrayBuffer();

    // Create folder name for organization
    const baseFolderName = folderName || `Recruitment - ${new Date().getFullYear()}`;
    const candidateFolderName = candidateName || candidateEmail || 'Unknown Candidate';

    // Get or create parent folder in Google Drive
    let parentFolderId = 'root';

    // Search for existing recruitment folder
    const folderSearchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${baseFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&fields=files(id,name)&pageSize=1`,
      {
        headers: {
          'Authorization': `Bearer ${driveAccessToken}`
        }
      }
    );

    if (folderSearchResponse.ok) {
      const folderSearchData = await folderSearchResponse.json();
      if (folderSearchData.files && folderSearchData.files.length > 0) {
        parentFolderId = folderSearchData.files[0].id;
      }
    }

    // Create file metadata
    const metadata = {
      name: fileName,
      mimeType: getMimeType(fileName),
      parents: [parentFolderId],
      description: `Uploaded for ${candidateFolderName} (${documentType || 'general'})`
    };

    // Upload file to Google Drive
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([fileBlob]));

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name,createdTime',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${driveAccessToken}`
        },
        body: formData
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      return Response.json(
        { error: 'Failed to upload file to Google Drive', details: errorData },
        { status: uploadResponse.status }
      );
    }

    const uploadedFile = await uploadResponse.json();

    return Response.json({
      success: true,
      message: 'Document uploaded successfully',
      fileId: uploadedFile.id,
      fileName: uploadedFile.name,
      driveLink: uploadedFile.webViewLink,
      uploadedAt: uploadedFile.createdTime,
      candidateName: candidateFolderName
    });
  } catch (error) {
    console.error('Upload document error:', error);
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