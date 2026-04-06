import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      documentUrl,
      signerEmail,
      signerName,
      signerRole = 'Signer',
      documentType = 'offer_letter',
      documentId,
      signingService = 'docusign',
      signingDays = 14,
      additionalSigners = []
    } = await req.json();

    if (!documentUrl || !signerEmail || !signerName || !documentId) {
      return Response.json(
        { error: 'Missing required fields: documentUrl, signerEmail, signerName, documentId' },
        { status: 400 }
      );
    }

    let signingResult = {};

    try {
      if (signingService === 'docusign') {
        signingResult = await sendViaDocuSign({
          documentUrl,
          signerEmail,
          signerName,
          signerRole,
          signingDays,
          additionalSigners
        });
      } else if (signingService === 'adobe_sign') {
        signingResult = await sendViaAdobeSign({
          documentUrl,
          signerEmail,
          signerName,
          signingDays
        });
      } else if (signingService === 'manual') {
        signingResult = await sendManualSigningRequest({
          documentUrl,
          signerEmail,
          signerName,
          documentType
        });
      }

      // Create signing request record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + signingDays);

      const signingRequest = await base44.asServiceRole.entities.DocumentSigningRequest.create({
        document_id: documentId,
        document_type: documentType,
        signer_email: signerEmail,
        signer_name: signerName,
        signing_service: signingService,
        signing_request_id: signingResult.requestId,
        document_url: documentUrl,
        signing_link: signingResult.signingLink,
        status: 'sent',
        sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        signers: [
          { name: signerName, email: signerEmail, status: 'pending' },
          ...additionalSigners
        ]
      });

      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: signerEmail,
        subject: `${documentType === 'offer_letter' ? 'Offer Letter' : 'Document'} Awaiting Your Signature`,
        body: `Hi ${signerName},\n\nYou have been requested to sign a document. Please click the link below to review and sign:\n\n${signingResult.signingLink}\n\nThis request expires on ${expiresAt.toLocaleDateString()}.\n\nBest regards,\nRecruiting Team`
      });

      return Response.json({
        success: true,
        signingRequestId: signingRequest.id,
        signerEmail,
        signerName,
        signingService,
        signingLink: signingResult.signingLink,
        expiresAt: expiresAt.toISOString(),
        message: `Document sent for signing via ${signingService}`
      });
    } catch (signingError) {
      console.error('Signing service error:', signingError);
      return Response.json({
        success: false,
        error: `Failed to send document via ${signingService}: ${signingError.message}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Send for signing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendViaDocuSign(data) {
  const { documentUrl, signerEmail, signerName, signerRole, signingDays, additionalSigners } = data;

  // Fetch document
  const docResponse = await fetch(documentUrl);
  if (!docResponse.ok) {
    throw new Error('Failed to fetch document');
  }
  const docBuffer = await docResponse.arrayBuffer();
  const base64Doc = btoa(String.fromCharCode(...new Uint8Array(docBuffer)));

  const payload = {
    emailSubject: 'Please Sign This Document',
    documents: [
      {
        documentBase64: base64Doc,
        documentId: '1',
        documentName: 'Document.pdf'
      }
    ],
    recipients: {
      signers: [
        {
          email: signerEmail,
          name: signerName,
          recipientId: '1',
          routingOrder: '1'
        },
        ...additionalSigners.map((signer, idx) => ({
          email: signer.email,
          name: signer.name,
          recipientId: (idx + 2).toString(),
          routingOrder: (idx + 2).toString()
        }))
      ]
    },
    status: 'sent'
  };

  const response = await fetch('https://demo.docusign.net/restapi/v2.1/accounts/{accountId}/envelopes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('DOCUSIGN_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DocuSign API error: ${error}`);
  }

  const result = await response.json();
  const signingLink = `https://demo.docusign.net/Signing/startinsession.aspx?t=${result.envelopeId}`;

  return {
    requestId: result.envelopeId,
    signingLink
  };
}

async function sendViaAdobeSign(data) {
  const { documentUrl, signerEmail, signerName, signingDays } = data;

  const payload = {
    fileInfos: [
      {
        documentUrl: documentUrl
      }
    ],
    participantSetsInfo: [
      {
        memberInfos: [
          {
            email: signerEmail,
            name: signerName
          }
        ]
      }
    ],
    signatureType: 'ESIGN',
    name: 'Document Signature Request'
  };

  const response = await fetch('https://api.adobesign.com/api/rest/v6/agreements', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('ADOBE_SIGN_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Adobe Sign API error: ${error}`);
  }

  const result = await response.json();

  return {
    requestId: result.id,
    signingLink: `https://secure.adobesign.com/public/esignatures?participantId=${result.participantId}`
  };
}

async function sendManualSigningRequest(data) {
  const { documentUrl, signerEmail, signerName, documentType } = data;

  // For manual signing, generate a unique token
  const token = crypto.getRandomValues(new Uint8Array(16)).join('');
  const signingLink = `${Deno.env.get('APP_URL') || 'https://app.example.com'}/sign?token=${token}&email=${encodeURIComponent(signerEmail)}`;

  return {
    requestId: token,
    signingLink
  };
}