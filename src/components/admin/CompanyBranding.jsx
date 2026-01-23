import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, Upload, Palette, Image as ImageIcon } from "lucide-react";
import { toast } from 'sonner';

export default function CompanyBranding({ user, onUpdate }) {
  const [formData, setFormData] = useState({
    company_name: '',
    company_logo: '',
    company_cover_image: '',
    company_primary_color: '#4F46E5',
    company_secondary_color: '#7C3AED',
    company_accent_color: '#EC4899',
    company_industry: ''
  });
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        company_name: user.company_name || '',
        company_logo: user.company_logo || '',
        company_cover_image: user.company_cover_image || '',
        company_primary_color: user.company_primary_color || '#4F46E5',
        company_secondary_color: user.company_secondary_color || '#7C3AED',
        company_accent_color: user.company_accent_color || '#EC4899',
        company_industry: user.company_industry || ''
      });
    }
  }, [user]);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const generateBrandingSuggestions = async () => {
    if (!formData.company_name && !formData.company_industry) {
      toast.error('Please enter company name or industry first');
      return;
    }

    setGenerating(true);
    try {
      const prompt = `Generate a professional brand color palette for a company with the following details:
Company Name: ${formData.company_name || 'Not specified'}
Industry: ${formData.company_industry || 'Not specified'}

Provide three complementary colors (primary, secondary, and accent) that:
1. Reflect the industry's professional standards
2. Create a cohesive and modern brand identity
3. Ensure good contrast and accessibility
4. Align with the company's values and positioning

Also suggest visual style keywords for cover images that would match this brand.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            primary_color: { type: "string" },
            secondary_color: { type: "string" },
            accent_color: { type: "string" },
            color_rationale: { type: "string" },
            image_style_suggestions: { type: "string" }
          }
        }
      });

      setFormData(prev => ({
        ...prev,
        company_primary_color: response.primary_color,
        company_secondary_color: response.secondary_color,
        company_accent_color: response.accent_color
      }));

      toast.success('Brand colors suggested!', {
        description: response.color_rationale
      });
    } catch (error) {
      toast.error('Failed to generate suggestions');
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      await base44.auth.updateMe(formData);
      toast.success('Company branding updated!');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to save branding');
      console.error('Save error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Basic company details for branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="Enter company name"
            />
          </div>
          <div>
            <Label>Industry</Label>
            <Input
              value={formData.company_industry}
              onChange={(e) => setFormData(prev => ({ ...prev, company_industry: e.target.value }))}
              placeholder="e.g., Technology, Healthcare, Finance"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Choose colors that represent your brand</CardDescription>
            </div>
            <Button
              onClick={generateBrandingSuggestions}
              disabled={generating}
              variant="outline"
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Suggest Colors
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={formData.company_primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_primary_color: e.target.value }))}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.company_primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_primary_color: e.target.value }))}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={formData.company_secondary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_secondary_color: e.target.value }))}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.company_secondary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_secondary_color: e.target.value }))}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={formData.company_accent_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_accent_color: e.target.value }))}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.company_accent_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_accent_color: e.target.value }))}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-lg border" style={{
            background: `linear-gradient(135deg, ${formData.company_primary_color} 0%, ${formData.company_secondary_color} 50%, ${formData.company_accent_color} 100%)`
          }}>
            <div className="text-white text-center font-medium">Brand Color Preview</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visual Assets</CardTitle>
          <CardDescription>Upload your company logo and cover image</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Company Logo</Label>
            <div className="mt-2 flex items-center gap-4">
              {formData.company_logo && (
                <div className="w-24 h-24 rounded-lg border bg-white p-2 flex items-center justify-center">
                  <img 
                    src={formData.company_logo} 
                    alt="Company logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'company_logo')}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: Square image, transparent background
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label>Cover Image</Label>
            <div className="mt-2">
              {formData.company_cover_image && (
                <div className="w-full h-40 rounded-lg border overflow-hidden mb-3">
                  <img 
                    src={formData.company_cover_image} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'company_cover_image')}
                disabled={uploading}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 1600x400px, represents your company culture
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Palette className="w-4 h-4" />
          Save Branding
        </Button>
      </div>
    </div>
  );
}