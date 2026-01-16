import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, X, Send, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CreateOpportunity() {
  const [user, setUser] = useState(null);
  const [creating, setCreating] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills_required: [],
    effort: '',
    compensation_type: 'hourly',
    compensation_amount: '',
    has_trial_task: false,
    trial_task_description: '',
    trial_task_pay: '',
    location_type: 'remote',
    location: '',
    match_threshold: 70
  });

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
      }
    };
    loadUser();
  }, []);

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills_required.includes(skillInput.trim())) {
      setFormData(prev => ({ ...prev, skills_required: [...prev.skills_required, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({ ...prev, skills_required: prev.skills_required.filter(s => s !== skill) }));
  };

  const handleCreate = async () => {
    setCreating(true);
    await base44.entities.Opportunity.create({
      ...formData,
      creator_id: user.email,
      status: 'active',
      match_threshold: formData.match_threshold / 100,
      path: formData.has_trial_task ? ['trial_task', 'review', 'match'] : ['review', 'match']
    });

    // Trigger matching algorithm
    await base44.functions.invoke('calculateMatches', { opportunity_id: null });

    setCreating(false);
    window.location.href = createPageUrl('Opportunities');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Opportunities</h2>
            <p className="text-gray-500 mb-6">Sign in to post skill-based work opportunities.</p>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => base44.auth.redirectToLogin()}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Opportunities')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Opportunity</h1>
            <p className="text-gray-500 text-sm">Post a skill-based work opportunity</p>
          </div>
        </div>

        {/* Basic Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Opportunity Title *</Label>
              <Input
                placeholder="e.g., React Developer for Dashboard"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the work, expectations, and what success looks like..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <Button variant="outline" onClick={handleAddSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {formData.skills_required.map((skill) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge variant="outline" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200 pr-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="ml-1 hover:bg-indigo-200 rounded p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Work Details */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Work Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Time Commitment *</Label>
                <Input
                  placeholder="e.g., 3-5 hrs/week"
                  value={formData.effort}
                  onChange={(e) => setFormData(prev => ({ ...prev, effort: e.target.value }))}
                />
              </div>
              <div>
                <Label>Location Type</Label>
                <Select value={formData.location_type} onValueChange={(v) => setFormData(prev => ({ ...prev, location_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="on-site">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.location_type !== 'remote' && (
              <div>
                <Label>Location</Label>
                <Input
                  placeholder="City, State"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.compensation_type} onValueChange={(v) => setFormData(prev => ({ ...prev, compensation_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  placeholder="e.g., $75/hr or $500 total"
                  value={formData.compensation_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation_amount: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Task */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Trial Task (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div>
                <p className="font-medium text-gray-900">Offer Paid Trial Task</p>
                <p className="text-sm text-gray-500">Test talent before committing</p>
              </div>
              <Switch
                checked={formData.has_trial_task}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, has_trial_task: v }))}
              />
            </div>
            
            {formData.has_trial_task && (
              <>
                <div>
                  <Label>Task Description</Label>
                  <Textarea
                    placeholder="Describe the trial task..."
                    value={formData.trial_task_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, trial_task_description: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label>Task Payment</Label>
                  <Input
                    placeholder="e.g., $150"
                    value={formData.trial_task_pay}
                    onChange={(e) => setFormData(prev => ({ ...prev, trial_task_pay: e.target.value }))}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Matching */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Match Threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Minimum skill match: {formData.match_threshold}%</Label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={formData.match_threshold}
              onChange={(e) => setFormData(prev => ({ ...prev, match_threshold: parseInt(e.target.value) }))}
              className="w-full mt-2"
            />
            <p className="text-sm text-gray-500 mt-2">
              Only talent with {formData.match_threshold}%+ skill match will see this opportunity
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="sticky bottom-4">
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={handleCreate}
            disabled={creating || !formData.title || !formData.description || !formData.effort || !formData.compensation_amount || formData.skills_required.length === 0}
          >
            <Send className="w-4 h-4" />
            {creating ? 'Creating...' : 'Create Opportunity'}
          </Button>
        </div>
      </div>
    </div>
  );
}