import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Shield, Save, Upload, Zap, Eye, TrendingUp } from "lucide-react";
import PortfolioProjects from "@/components/profile/PortfolioProjects";
import BoostModal from "@/components/boost/BoostModal";
import BoostBadge from "@/components/boost/BoostBadge";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [boostModalOpen, setBoostModalOpen] = useState(false);
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
    anonymous_mode: false,
    portfolio_projects: []
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
          anonymous_mode: u.anonymous_mode || false,
          portfolio_projects: u.portfolio_projects || []
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

  const isBoosted = user?.boosted_until && new Date(user.boosted_until) > new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <BoostBadge boostedUntil={user?.boosted_until} />
          </div>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Boost Stats Card */}
        {isBoosted && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-gray-900">Profile Boost Active</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium">Views</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{user.boost_impressions || 0}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Expires</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(user.boosted_until).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your profile is being featured in search results and getting priority visibility
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isBoosted && (
          <Card className="border-0 shadow-sm border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Boost Your Profile</h3>
                  <p className="text-sm text-gray-600">Get 3-5x more visibility and priority in search results</p>
                </div>
                <Button
                  onClick={() => setBoostModalOpen(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Boost Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

        <PortfolioProjects
          projects={formData.portfolio_projects || []}
          onUpdate={(projects) => setFormData({ ...formData, portfolio_projects: projects })}
        />

        {boostModalOpen && (
          <BoostModal
            type="profile"
            targetId={user.email}
            targetTitle={user.display_name || user.full_name || user.email}
            onClose={() => setBoostModalOpen(false)}
            onBoostActivated={() => window.location.reload()}
          />
        )}
      </div>
    </div>
  );
}