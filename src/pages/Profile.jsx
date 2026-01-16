import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Shield, Save, Upload } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    user_type: 'talent',
    display_name: '',
    bio: '',
    avatar_url: '',
    location: '',
    availability: 'flexible',
    compensation_expectation_min: '',
    compensation_expectation_max: '',
    open_to_opportunities: true,
    anonymous_mode: false
  });

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
        setFormData({
          user_type: u.user_type || 'talent',
          display_name: u.display_name || u.full_name || '',
          bio: u.bio || '',
          avatar_url: u.avatar_url || '',
          location: u.location || '',
          availability: u.availability || 'flexible',
          compensation_expectation_min: u.compensation_expectation_min || '',
          compensation_expectation_max: u.compensation_expectation_max || '',
          open_to_opportunities: u.open_to_opportunities !== false,
          anonymous_mode: u.anonymous_mode || false
        });
      }
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      ...formData,
      compensation_expectation_min: formData.compensation_expectation_min ? parseFloat(formData.compensation_expectation_min) : null,
      compensation_expectation_max: formData.compensation_expectation_max ? parseFloat(formData.compensation_expectation_max) : null
    });
    setSaving(false);
    window.location.reload();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, avatar_url: file_url }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Please sign in</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.avatar_url && (
                  <img src={formData.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                )}
                <label className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </span>
                  </Button>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <div>
              <Label>Display Name</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="How should we call you?"
              />
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Work Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>User Type</Label>
              <Select value={formData.user_type} onValueChange={(v) => setFormData(prev => ({ ...prev, user_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="talent">Talent (Looking for work)</SelectItem>
                  <SelectItem value="creator">Creator (Posting opportunities)</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Availability</Label>
              <Select value={formData.availability} onValueChange={(v) => setFormData(prev => ({ ...prev, availability: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Compensation Expectations ($/hour)</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Min"
                  value={formData.compensation_expectation_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation_expectation_min: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={formData.compensation_expectation_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation_expectation_max: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
              <div>
                <p className="font-medium text-gray-900">Open to Opportunities</p>
                <p className="text-sm text-gray-500">Let the system find matches for you</p>
              </div>
              <Switch
                checked={formData.open_to_opportunities}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, open_to_opportunities: v }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Anonymous Mode</p>
                <p className="text-sm text-gray-500">Hide your real name from opportunity creators</p>
              </div>
              <Switch
                checked={formData.anonymous_mode}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, anonymous_mode: v }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}