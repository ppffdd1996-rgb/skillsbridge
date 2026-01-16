import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, MapPin, DollarSign, Building2, Plus, X, 
  ArrowLeft, Eye, Send, ListChecks, Gift
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PostJob() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    company_logo: '',
    location: '',
    remote_type: 'on-site',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_min: '',
    salary_max: '',
    salary_period: 'yearly',
    description: '',
    requirements: [],
    benefits: [],
    skills: [],
    industry: '',
    status: 'active'
  });

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = (field, value, setter) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
      setter('');
    }
  };

  const removeItem = (field, item) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter(i => i !== item) }));
  };

  const handlePost = async () => {
    setPosting(true);
    await base44.entities.Job.create({
      ...formData,
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
      posted_by: user.email,
      applicants_count: 0
    });
    setPosting(false);
    window.location.href = createPageUrl('MyJobs');
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to post jobs</h2>
            <p className="text-gray-500 mb-6">Create an account or sign in to post job listings.</p>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
              <p className="text-gray-500 text-sm">Fill in the details to attract top talent</p>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Job Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Your Company"
                />
              </div>
              <div>
                <Label>Company Logo URL</Label>
                <Input
                  value={formData.company_logo}
                  onChange={(e) => handleChange('company_logo', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <Label>Industry</Label>
              <Input
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                placeholder="e.g. Technology, Healthcare, Finance"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location & Type */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Location & Work Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Location *</Label>
              <Input
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Work Type</Label>
                <Select value={formData.remote_type} onValueChange={(v) => handleChange('remote_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-site">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Job Type</Label>
                <Select value={formData.job_type} onValueChange={(v) => handleChange('job_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(v) => handleChange('experience_level', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Compensation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Minimum Salary</Label>
                <Input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => handleChange('salary_min', e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label>Maximum Salary</Label>
                <Input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => handleChange('salary_max', e.target.value)}
                  placeholder="80000"
                />
              </div>
              <div>
                <Label>Period</Label>
                <Select value={formData.salary_period} onValueChange={(v) => handleChange('salary_period', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Per Year</SelectItem>
                    <SelectItem value="hourly">Per Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and what a typical day looks like..."
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-indigo-600" />
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Add a requirement..."
                onKeyPress={(e) => e.key === 'Enter' && addItem('requirements', newRequirement, setNewRequirement)}
              />
              <Button variant="outline" onClick={() => addItem('requirements', newRequirement, setNewRequirement)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {formData.requirements.map((req, i) => (
                  <motion.div
                    key={req}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="flex-1 text-sm">{req}</span>
                    <button onClick={() => removeItem('requirements', req)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
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
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={(e) => e.key === 'Enter' && addItem('skills', newSkill, setNewSkill)}
              />
              <Button variant="outline" onClick={() => addItem('skills', newSkill, setNewSkill)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {formData.skills.map((skill) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge variant="outline" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200 pr-1">
                      {skill}
                      <button onClick={() => removeItem('skills', skill)} className="ml-1 hover:bg-indigo-200 rounded p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-600" />
              Benefits & Perks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                placeholder="Add a benefit..."
                onKeyPress={(e) => e.key === 'Enter' && addItem('benefits', newBenefit, setNewBenefit)}
              />
              <Button variant="outline" onClick={() => addItem('benefits', newBenefit, setNewBenefit)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {formData.benefits.map((benefit) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200 pr-1">
                      {benefit}
                      <button onClick={() => removeItem('benefits', benefit)} className="ml-1 hover:bg-green-200 rounded p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 sticky bottom-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => handleChange('status', 'draft')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            onClick={handlePost}
            disabled={posting || !formData.title || !formData.company_name || !formData.location}
          >
            <Send className="w-4 h-4 mr-2" />
            {posting ? 'Publishing...' : 'Publish Job'}
          </Button>
        </div>
      </div>
    </div>
  );
}