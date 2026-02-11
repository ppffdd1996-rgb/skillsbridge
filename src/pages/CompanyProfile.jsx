import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Save, Eye, EyeOff, Loader2, Building2, Palette, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function CompanyProfilePage() {
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['company-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.CompanyProfile.filter({ recruiter_email: user.email });
      return profiles.length > 0 ? profiles[0] : null;
    },
    enabled: !!user
  });

  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    brief_description: '',
    target_roles: '',
    website: ''
  });

  const generateProfile = async () => {
    if (!formData.company_name || !formData.industry) {
      toast.error('Company name and industry are required');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateCompanyProfile', {
        ...formData,
        target_roles: formData.target_roles.split(',').map(r => r.trim()).filter(Boolean)
      });

      toast.success('Company profile generated!');
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      setEditing(false);
    } catch (error) {
      toast.error('Failed to generate profile');
    } finally {
      setGenerating(false);
    }
  };

  const togglePublished = useMutation({
    mutationFn: async () => {
      await base44.entities.CompanyProfile.update(profile.id, {
        is_published: !profile.is_published
      });
    },
    onSuccess: () => {
      toast.success(profile.is_published ? 'Profile unpublished' : 'Profile published');
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to manage your company profile</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-8 h-8 text-indigo-600" />
              Company Profile
            </h1>
            <p className="text-gray-600 mt-1">AI-powered profile to attract top talent</p>
          </div>
          {profile && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Cancel Edit' : 'Edit'}
              </Button>
              <Button
                variant={profile.is_published ? 'outline' : 'default'}
                onClick={() => togglePublished.mutate()}
                className="gap-2"
              >
                {profile.is_published ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {!profile || editing ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {profile ? 'Regenerate Profile' : 'Generate AI Profile'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <Label>Industry *</Label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Technology, Healthcare, etc."
                  />
                </div>
                <div>
                  <Label>Company Size</Label>
                  <Select value={formData.company_size} onValueChange={(value) => setFormData({ ...formData, company_size: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-1000">501-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.com"
                  />
                </div>
              </div>
              <div>
                <Label>Brief Description (optional)</Label>
                <Textarea
                  value={formData.brief_description}
                  onChange={(e) => setFormData({ ...formData, brief_description: e.target.value })}
                  placeholder="Tell us about your company in a few sentences..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Target Roles (comma-separated, optional)</Label>
                <Input
                  value={formData.target_roles}
                  onChange={(e) => setFormData({ ...formData, target_roles: e.target.value })}
                  placeholder="Software Engineer, Product Manager, Designer"
                />
              </div>
              <Button
                onClick={generateProfile}
                disabled={generating || !formData.company_name || !formData.industry}
                className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{profile.company_name}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className="bg-indigo-100 text-indigo-800">{profile.industry}</Badge>
                      {profile.company_size && <Badge variant="outline">{profile.company_size} employees</Badge>}
                      {profile.location && <Badge variant="outline">{profile.location}</Badge>}
                    </div>
                  </div>
                  {profile.is_published && (
                    <Badge className="bg-green-100 text-green-800">Published</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description & Mission */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Company Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.description}</p>
                </div>
                {profile.mission_statement && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <h4 className="font-semibold text-indigo-900 mb-2">Mission Statement</h4>
                    <p className="text-gray-700 italic">{profile.mission_statement}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Culture & Values */}
            <div className="grid md:grid-cols-2 gap-6">
              {profile.culture_highlights?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Culture Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {profile.culture_highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-600 mt-1">✓</span>
                          <span className="text-gray-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {profile.values?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Our Values</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.values.map((value, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-800">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Benefits */}
            {profile.benefits?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {profile.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="text-green-600">✓</span>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Branding & Keywords */}
            <div className="grid md:grid-cols-2 gap-6">
              {profile.branding_elements && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Branding Elements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg border"
                        style={{ backgroundColor: profile.branding_elements.primary_color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Primary Color</p>
                        <p className="text-xs text-gray-500">{profile.branding_elements.primary_color}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg border"
                        style={{ backgroundColor: profile.branding_elements.secondary_color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Secondary Color</p>
                        <p className="text-xs text-gray-500">{profile.branding_elements.secondary_color}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Tone:</span> {profile.branding_elements.tone}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Personality:</span> {profile.branding_elements.personality}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(profile.keywords?.length > 0 || profile.target_candidate_pools?.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Targeting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.keywords?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="outline">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.target_candidate_pools?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Target Pools</p>
                        <div className="space-y-1">
                          {profile.target_candidate_pools.map((pool, idx) => (
                            <Badge key={idx} className="bg-indigo-100 text-indigo-800">{pool}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}