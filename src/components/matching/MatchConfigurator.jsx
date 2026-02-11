import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Save, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

export default function MatchConfigurator({ opportunityId, onConfigChange, initialConfig }) {
  const [config, setConfig] = useState({
    skill_weight: 0.4,
    experience_weight: 0.3,
    education_weight: 0.1,
    portfolio_weight: 0.2,
    required_skills: [],
    preferred_skills: [],
    ...initialConfig
  });

  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState('required');

  const saveConfig = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('saveMatchConfiguration', {
        opportunity_id: opportunityId,
        ...config
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Configuration saved');
      if (onConfigChange) onConfigChange(data.config);
    },
    onError: () => {
      toast.error('Failed to save configuration');
    }
  });

  const totalWeight = config.skill_weight + config.experience_weight + 
                      config.education_weight + config.portfolio_weight;

  const normalizeWeights = () => {
    if (Math.abs(totalWeight - 1) > 0.01) {
      const factor = 1 / totalWeight;
      setConfig({
        ...config,
        skill_weight: config.skill_weight * factor,
        experience_weight: config.experience_weight * factor,
        education_weight: config.education_weight * factor,
        portfolio_weight: config.portfolio_weight * factor
      });
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    
    if (skillType === 'required') {
      setConfig({
        ...config,
        required_skills: [...config.required_skills, newSkill.trim()]
      });
    } else {
      setConfig({
        ...config,
        preferred_skills: [...config.preferred_skills, newSkill.trim()]
      });
    }
    setNewSkill('');
  };

  const removeSkill = (skill, type) => {
    if (type === 'required') {
      setConfig({
        ...config,
        required_skills: config.required_skills.filter(s => s !== skill)
      });
    } else {
      setConfig({
        ...config,
        preferred_skills: config.preferred_skills.filter(s => s !== skill)
      });
    }
  };

  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Match Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Scoring Weights</h4>
            <span className={`text-sm ${Math.abs(totalWeight - 1) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
              Total: {(totalWeight * 100).toFixed(0)}%
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Skills ({(config.skill_weight * 100).toFixed(0)}%)</Label>
              </div>
              <Slider
                value={[config.skill_weight * 100]}
                onValueChange={([value]) => setConfig({ ...config, skill_weight: value / 100 })}
                max={100}
                step={5}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Experience ({(config.experience_weight * 100).toFixed(0)}%)</Label>
              </div>
              <Slider
                value={[config.experience_weight * 100]}
                onValueChange={([value]) => setConfig({ ...config, experience_weight: value / 100 })}
                max={100}
                step={5}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Education ({(config.education_weight * 100).toFixed(0)}%)</Label>
              </div>
              <Slider
                value={[config.education_weight * 100]}
                onValueChange={([value]) => setConfig({ ...config, education_weight: value / 100 })}
                max={100}
                step={5}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Portfolio/Proof ({(config.portfolio_weight * 100).toFixed(0)}%)</Label>
              </div>
              <Slider
                value={[config.portfolio_weight * 100]}
                onValueChange={([value]) => setConfig({ ...config, portfolio_weight: value / 100 })}
                max={100}
                step={5}
              />
            </div>
          </div>

          {Math.abs(totalWeight - 1) > 0.01 && (
            <Button
              variant="outline"
              size="sm"
              onClick={normalizeWeights}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Normalize to 100%
            </Button>
          )}
        </div>

        {/* Skills */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-semibold text-gray-900">Skill Requirements</h4>
          
          <div className="flex gap-2">
            <select
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="required">Required</option>
              <option value="preferred">Preferred</option>
            </select>
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add skill..."
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              className="flex-1"
            />
            <Button onClick={addSkill}>Add</Button>
          </div>

          {config.required_skills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {config.required_skills.map(skill => (
                  <Badge key={skill} className="bg-red-100 text-red-800">
                    {skill}
                    <button
                      onClick={() => removeSkill(skill, 'required')}
                      className="ml-1 hover:text-red-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {config.preferred_skills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preferred Skills</p>
              <div className="flex flex-wrap gap-2">
                {config.preferred_skills.map(skill => (
                  <Badge key={skill} className="bg-blue-100 text-blue-800">
                    {skill}
                    <button
                      onClick={() => removeSkill(skill, 'preferred')}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={() => saveConfig.mutate()}
          disabled={saveConfig.isPending || Math.abs(totalWeight - 1) > 0.01}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveConfig.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
}