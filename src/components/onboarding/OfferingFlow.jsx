import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Send, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OfferingFlow({ applicationId, candidateName, candidateEmail, jobTitle }) {
  const [step, setStep] = useState(1); // 1: Generate Offer, 2: Review, 3: Send
  const [loading, setLoading] = useState(false);
  const [offerData, setOfferData] = useState({
    candidateName: candidateName || '',
    candidateEmail: candidateEmail || '',
    jobTitle: jobTitle || '',
    startDate: '',
    salary: '',
    benefits: 'Comprehensive health insurance, 401k matching, flexible work',
    companyName: 'Your Company',
    employmentType: 'Full-time'
  });
  const [generatedOffer, setGeneratedOffer] = useState(null);
  const [sent, setSent] = useState(false);

  const handleGenerateOffer = async () => {
    if (!offerData.candidateName || !offerData.candidateEmail || !offerData.jobTitle || !offerData.startDate || !offerData.salary) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateOfferLetter', offerData);
      if (response.data?.success) {
        setGeneratedOffer(response.data);
        setStep(2);
      }
    } catch (error) {
      console.error('Error generating offer:', error);
      alert('Failed to generate offer letter');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = async () => {
    if (!generatedOffer) return;

    setLoading(true);
    try {
      // Create offer letter record
      const offerRecord = await base44.asServiceRole.entities.OfferLetter.create({
        candidate_email: generatedOffer.candidateEmail,
        candidate_name: generatedOffer.candidateName,
        job_title: generatedOffer.jobTitle,
        start_date: generatedOffer.startDate,
        salary: generatedOffer.salary,
        benefits: offerData.benefits,
        signature_status: 'sent',
        recruiter_email: (await base44.auth.me()).email,
        sent_at: new Date().toISOString()
      });

      // Send email with offer
      await base44.integrations.Core.SendEmail({
        to: generatedOffer.candidateEmail,
        subject: `Offer Letter: ${generatedOffer.jobTitle} at ${offerData.companyName}`,
        body: `Dear ${generatedOffer.candidateName},\n\nPlease find your offer letter attached. Please review and confirm your acceptance.\n\nBest regards,\nRecruiting Team`
      });

      setSent(true);
      setStep(3);
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('Failed to send offer letter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
            1
          </div>
          <span className="text-sm font-medium">Generate</span>
        </div>
        <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
            2
          </div>
          <span className="text-sm font-medium">Review</span>
        </div>
        <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
            3
          </div>
          <span className="text-sm font-medium">Send</span>
        </div>
      </div>

      {/* Step 1: Generate */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generate Offer Letter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Name *
                </label>
                <Input
                  value={offerData.candidateName}
                  onChange={(e) => setOfferData({...offerData, candidateName: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Email *
                </label>
                <Input
                  value={offerData.candidateEmail}
                  onChange={(e) => setOfferData({...offerData, candidateEmail: e.target.value})}
                  placeholder="email@example.com"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <Input
                  value={offerData.jobTitle}
                  onChange={(e) => setOfferData({...offerData, jobTitle: e.target.value})}
                  placeholder="Position"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <Input
                  value={offerData.startDate}
                  onChange={(e) => setOfferData({...offerData, startDate: e.target.value})}
                  type="date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary *
                </label>
                <Input
                  value={offerData.salary}
                  onChange={(e) => setOfferData({...offerData, salary: e.target.value})}
                  placeholder="e.g., $80,000 annually"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type
                </label>
                <Select value={offerData.employmentType} onValueChange={(val) => setOfferData({...offerData, employmentType: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits
              </label>
              <Textarea
                value={offerData.benefits}
                onChange={(e) => setOfferData({...offerData, benefits: e.target.value})}
                placeholder="List benefits..."
                className="h-24"
              />
            </div>

            <Button
              onClick={handleGenerateOffer}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Offer Letter
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === 2 && generatedOffer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Review Offer Letter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-6 h-96 overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {generatedOffer.offerContent}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSendOffer}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to Candidate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sent */}
      {step === 3 && sent && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Offer Sent Successfully!</h3>
            <p className="text-gray-600 mb-4">
              The offer letter has been sent to {generatedOffer?.candidateEmail}
            </p>
            <Button
              onClick={() => {
                setStep(1);
                setSent(false);
                setGeneratedOffer(null);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Create Another Offer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}