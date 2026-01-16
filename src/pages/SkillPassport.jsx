import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Plus, Target, Upload, ExternalLink, Trash2, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SkillPassport from "@/components/skills/SkillPassport";

export default function SkillPassportPage() {
  const [user, setUser] = useState(null);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: 'competent',
    proof_url: '',
    proof_type: 'portfolio',
    years_experience: ''
  });

  const queryClient = useQueryClient();

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

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ['mySkills', user?.email],
    queryFn: () => user ? base44.entities.Skill.filter({ user_email: user.email }) : [],
    enabled: !!user
  });

  const addSkillMutation = useMutation({
    mutationFn: async (skillData) => {
      const newSkill = await base44.entities.Skill.create({
        ...skillData,
        user_email: user.email,
        verified_by: 'self',
        years_experience: skillData.years_experience ? parseInt(skillData.years_experience) : null
      });

      // Trigger AI verification if proof provided
      if (skillData.proof_url) {
        await base44.functions.invoke('verifySkill', { skill_id: newSkill.id });
      }

      return newSkill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySkills'] });
      setShowAddSkill(false);
      setFormData({
        name: '',
        level: 'competent',
        proof_url: '',
        proof_type: 'portfolio',
        years_experience: ''
      });
    }
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (skillId) => base44.entities.Skill.delete(skillId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mySkills'] })
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, proof_url: file_url }));
    }
  };

  const verifiedSkills = skills.filter(s => s.verified_by !== 'self');
  const verificationScore = verifiedSkills.reduce((acc, s) => acc + (s.verification_score || 0), 0) / (verifiedSkills.length || 1);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Build Your Skill Passport</h2>
            <p className="text-gray-500 mb-6">Sign in to create your verified skill profile.</p>
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
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Skill Passport</h1>
            <p className="text-gray-500 mt-1">Build your proof-based professional profile</p>
          </div>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={() => setShowAddSkill(true)}
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{skills.length}</p>
                  <p className="text-sm text-gray-500">Total Skills</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{verifiedSkills.length}</p>
                  <p className="text-sm text-gray-500">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(verificationScore)}</p>
                  <p className="text-sm text-gray-500">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill Passport */}
        <SkillPassport skills={skills} editable={false} />

        {/* Add Skill Dialog */}
        <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Skill</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label>Skill Name *</Label>
                <Input
                  placeholder="e.g., React, Python, Data Analysis"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label>Your Level</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData(prev => ({ ...prev, level: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learning">Learning (Beginner)</SelectItem>
                    <SelectItem value="competent">Competent (Working knowledge)</SelectItem>
                    <SelectItem value="proficient">Proficient (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  placeholder="e.g., 3"
                  value={formData.years_experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, years_experience: e.target.value }))}
                />
              </div>

              <div>
                <Label>Proof Type</Label>
                <Select value={formData.proof_type} onValueChange={(v) => setFormData(prev => ({ ...prev, proof_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portfolio">Portfolio / Website</SelectItem>
                    <SelectItem value="github">GitHub Repository</SelectItem>
                    <SelectItem value="demo">Live Demo</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="task_completion">Completed Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Proof URL or File</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={formData.proof_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, proof_url: e.target.value }))}
                  />
                  <label className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="w-4 h-4" />
                      </span>
                    </Button>
                    <input 
                      type="file" 
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Add proof to get AI verification and higher match scores
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowAddSkill(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => addSkillMutation.mutate(formData)}
                  disabled={!formData.name || addSkillMutation.isLoading}
                >
                  {addSkillMutation.isLoading ? 'Adding...' : 'Add Skill'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}