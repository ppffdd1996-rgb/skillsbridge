import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, FileText } from 'lucide-react';
import EmailTemplateSelector from './EmailTemplateSelector';

export default function CandidateCommunication({ candidate, application }) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  if (!candidate || !application) {
    return null;
  }

  const getCommunicationStage = () => {
    const status = application.status;
    const stageMap = {
      'applied': 'invitation',
      'screening': 'invitation',
      'interviewing': 'feedback',
      'offered': 'offer',
      'rejected': 'rejection',
      'hired': 'offer'
    };
    return stageMap[status] || 'general';
  };

  const getStageColor = () => {
    const stage = getCommunicationStage();
    const colors = {
      'invitation': 'bg-blue-100 text-blue-800',
      'feedback': 'bg-purple-100 text-purple-800',
      'offer': 'bg-green-100 text-green-800',
      'rejection': 'bg-red-100 text-red-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[stage] || colors.general;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Current Stage</p>
            <Badge className={getStageColor()}>
              {getCommunicationStage().replace('_', ' ')}
            </Badge>
            <p className="text-xs text-gray-500 mt-1">Based on application status: {application.status}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Candidate:</strong> {candidate.applicant_name || 'Unknown'} ({candidate.applicant_email})
            </p>
          </div>

          <Button
            onClick={() => setShowTemplateSelector(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Email from Template
          </Button>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">Features</p>
            <ul className="space-y-1 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-indigo-600">✓</span>
                Pre-defined templates for each stage
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-600">✓</span>
                Customize email variables
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-600">✓</span>
                Attach documents from Google Drive
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <EmailTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        candidateEmail={candidate.applicant_email}
        candidateName={candidate.applicant_name}
        onSendSuccess={() => {
          alert('Email sent successfully!');
        }}
      />
    </>
  );
}