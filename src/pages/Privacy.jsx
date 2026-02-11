import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">Last updated: February 11, 2026</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6 prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-indigo-600" />
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                At SkillsBridge, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our platform. Please read this 
                privacy policy carefully. If you do not agree with the terms of this privacy policy, please 
                do not access the site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-600" />
                Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Name and contact information (email address)</li>
                    <li>Professional information (skills, experience, portfolio)</li>
                    <li>Account credentials and preferences</li>
                    <li>Communication and correspondence with us</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Usage Information</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Interaction with features and content</li>
                    <li>Search queries and filters used</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-indigo-600" />
                How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To create and manage your account</li>
                <li>To match you with relevant opportunities using AI algorithms</li>
                <li>To verify your skills through AI-powered analysis</li>
                <li>To facilitate communication between candidates and employers</li>
                <li>To improve our services and user experience</li>
                <li>To send you important updates and notifications</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-indigo-600" />
                Information Sharing
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>With Employers:</strong> Your profile and skills are visible to potential employers when you apply or express interest in opportunities</li>
                <li><strong>Service Providers:</strong> With trusted third-party services that help us operate (e.g., Google Calendar for scheduling)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                Data Security
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal 
                information. However, no electronic transmission over the internet or information storage technology 
                can be guaranteed to be 100% secure. While we strive to use commercially acceptable means to protect 
                your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                Your Rights
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your data</li>
                <li>Objection to processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our platform and hold 
                certain information. You can instruct your browser to refuse all cookies or to indicate when 
                a cookie is being sent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We integrate with third-party services including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Google Calendar:</strong> For interview scheduling</li>
                <li><strong>Google Drive:</strong> For document storage</li>
                <li><strong>Gmail:</strong> For email communications</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                These services have their own privacy policies. We encourage you to review them.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for users under the age of 18. We do not knowingly collect 
                personal information from children under 18.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us through our Support Center.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}