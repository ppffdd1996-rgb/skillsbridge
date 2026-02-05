import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, FileText, Plus } from 'lucide-react';

export default function EmailTemplateSelector({ isOpen, onClose, candidateEmail, candidateName, onSendSuccess }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [variables, setVariables] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.functions.invoke('manageEmailTemplates', { action: 'list' })
      .then(res => res.data.templates || [])
      .catch(() => [])
  });

  useEffect(() => {
    if (selectedTemplate) {
      const initialVariables = {};
      selectedTemplate.variables?.forEach(variable => {
        if (variable === 'candidate_name') {
          initialVariables[variable] = candidateName || '';
        } else {
          initialVariables[variable] = '';
        }
      });
      setVariables(initialVariables);
    }
  }, [selectedTemplate, candidateName]);

  const handleVariableChange = (variable, value) => {
    setVariables(prev => ({ ...prev, [variable]: value }));
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate) return;

    setSending(true);
    try {
      const response = await base44.functions.invoke('sendEmailFromTemplate', {
        templateId: selectedTemplate.id,
        to: candidateEmail,
        templateVariables: variables,
        attachments: attachments
      });

      if (response.data?.success) {
        onSendSuccess?.();
        onClose();
        setSelectedTemplate(null);
        setVariables({});
        setAttachments([]);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const getTemplateIcon = (category) => {
    const icons = {
      interview_invitation: '📨',
      follow_up: '💬',
      offer: '🎉',
      rejection: '📋',
      candidate_outreach: '🔍'
    };
    return icons[category] || '✉️';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email to {candidateName}</DialogTitle>
          <DialogDescription>
            Select a template and customize variables to send a professional email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Template</Label>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading templates...
              </div>
            ) : !selectedTemplate ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates?.map(template => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-indigo-500 transition-colors"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getTemplateIcon(template.category)}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {template.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedTemplate.name}</h3>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {selectedTemplate.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Variable Input */}
          {selectedTemplate && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Email Variables</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.variables?.map(variable => (
                  <div key={variable}>
                    <Label className="text-sm text-gray-700 capitalize">
                      {variable.replace(/_/g, ' ')}
                    </Label>
                    {variable.includes('description') || variable === 'feedback_summary' || variable === 'strengths' || variable === 'development_areas' ? (
                      <Textarea
                        value={variables[variable] || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                        className="mt-1 h-20"
                      />
                    ) : (
                      <Input
                        value={variables[variable] || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                        className="mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {selectedTemplate && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Attachments</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocumentPicker(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Document
                </Button>
              </div>

              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{attachment.fileName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No attachments added yet</p>
              )}
            </div>
          )}

          {/* Document Picker Modal */}
          {showDocumentPicker && (
            <DocumentPickerModal
              onSelect={(doc) => {
                setAttachments(prev => [...prev, { fileUrl: doc.driveLink, fileName: doc.name }]);
                setShowDocumentPicker(false);
              }}
              onClose={() => setShowDocumentPicker(false)}
            />
          )}

          {/* Action Buttons */}
          {selectedTemplate && (
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sending}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentPickerModal({ onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [documents, setDocuments] = useState([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await base44.functions.invoke('searchAndFilterDocuments', {
        searchQuery: searchQuery,
        maxResults: 20
      });

      if (response.data?.files) {
        setDocuments(response.data.files);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Document from Google Drive</DialogTitle>
          <DialogDescription>
            Search for documents to attach to your email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {documents.length > 0 && (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-500">{doc.owner}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(doc)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!searching && documents.length === 0 && searchQuery && (
            <p className="text-center text-gray-500 py-4">No documents found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}