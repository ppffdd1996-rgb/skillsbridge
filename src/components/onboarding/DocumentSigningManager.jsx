import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Check, Clock, FileText, Copy } from 'lucide-react';

export default function DocumentSigningManager({ documentId, documentType, documentUrl }) {
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signingService, setSigningService] = useState('docusign');
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: signingRequests, isLoading } = useQuery({
    queryKey: ['signingRequests', documentId],
    queryFn: () => base44.asServiceRole.entities.DocumentSigningRequest.filter({
      document_id: documentId
    }).then(requests => ({
      requests: requests.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    })),
    enabled: !!documentId
  });

  const handleSendForSigning = async () => {
    if (!signerEmail || !signerName) {
      alert('Please enter signer name and email');
      return;
    }

    setSending(true);
    try {
      const response = await base44.functions.invoke('sendDocumentForSigning', {
        documentUrl,
        signerEmail,
        signerName,
        documentType,
        documentId,
        signingService
      });

      if (response.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['signingRequests', documentId] });
        setSignerEmail('');
        setSignerName('');
        setShowForm(false);
        alert('Signing request sent successfully!');
      }
    } catch (error) {
      console.error('Error sending for signing:', error);
      alert('Failed to send document for signing');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-purple-100 text-purple-800',
      signed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'signed') return <Check className="w-4 h-4" />;
    if (status === 'sent' || status === 'viewed') return <Clock className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const requests = signingRequests?.requests || [];

  return (
    <div className="space-y-4">
      {/* Send for Signing Form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          <Send className="w-4 h-4" />
          Send for Signature
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send Document for E-Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signer Name *
                </label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signer Email *
                </label>
                <Input
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Signature Service
              </label>
              <Select value={signingService} onValueChange={setSigningService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="docusign">DocuSign</SelectItem>
                  <SelectItem value="adobe_sign">Adobe Sign</SelectItem>
                  <SelectItem value="manual">Manual (Email Link)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p>Make sure you have set up your {signingService} API credentials in App Settings.</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendForSigning}
                disabled={sending || !signerEmail || !signerName}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Signing Request
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signing Requests List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-4 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading signing requests...
          </CardContent>
        </Card>
      ) : requests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{request.signer_name}</p>
                      <p className="text-sm text-gray-500">{request.signer_email}</p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{request.status}</span>
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1 mb-2">
                    <p>Service: <span className="font-medium capitalize">{request.signing_service}</span></p>
                    {request.sent_at && (
                      <p>Sent: {new Date(request.sent_at).toLocaleString()}</p>
                    )}
                    {request.signed_at && (
                      <p>Signed: {new Date(request.signed_at).toLocaleString()}</p>
                    )}
                    {request.expires_at && (
                      <p>Expires: {new Date(request.expires_at).toLocaleString()}</p>
                    )}
                  </div>

                  {request.signing_link && request.status !== 'signed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(request.signing_link);
                        alert('Link copied to clipboard!');
                      }}
                    >
                      <Copy className="w-3 h-3" />
                      Copy Signing Link
                    </Button>
                  )}

                  {request.signed_document_url && (
                    <a
                      href={request.signed_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Download Signed Document →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}