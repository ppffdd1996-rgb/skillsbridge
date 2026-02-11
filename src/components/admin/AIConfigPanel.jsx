import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIConfigPanel() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const configs = await base44.entities.AIConfiguration.list();
      return configs.length > 0 ? configs[0] : {
        config_name: 'Default',
        category: 'general',
        match_threshold: 0.7,
        skill_verification_threshold: 70,
        auto_screen_applications: false,
        auto_schedule_interviews: false,
        enable_ai_interview_questions: true,
        max_daily_verifications: 100
      };
    }
  });

  const [formData, setFormData] = useState(null);

  React.useEffect(() => {
    if (config && !formData) {
      setFormData(config);
    }
  }, [config]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      if (config.id) {
        await base44.entities.AIConfiguration.update(config.id, formData);
      } else {
        await base44.entities.AIConfiguration.create(formData);
      }
    },
    onSuccess: () => {
      toast.success('AI configuration saved');
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
    },
    onError: () => {
      toast.error('Failed to save configuration');
    }
  });

  if (isLoading || !formData) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Match Threshold (0-1)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={formData.match_threshold}
              onChange={(e) => setFormData({ ...formData, match_threshold: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum score for candidate-opportunity matching</p>
          </div>

          <div>
            <Label>Skill Verification Threshold (0-100)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.skill_verification_threshold}
              onChange={(e) => setFormData({ ...formData, skill_verification_threshold: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum score to pass skill verification</p>
          </div>

          <div>
            <Label>Max Daily Verifications</Label>
            <Input
              type="number"
              min="0"
              value={formData.max_daily_verifications}
              onChange={(e) => setFormData({ ...formData, max_daily_verifications: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Daily limit for AI skill verifications</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-semibold text-gray-900">Automation Settings</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Screen Applications</Label>
              <p className="text-xs text-gray-500">Automatically screen applications with AI</p>
            </div>
            <Switch
              checked={formData.auto_screen_applications}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_screen_applications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Schedule Interviews</Label>
              <p className="text-xs text-gray-500">Automatically schedule interviews when possible</p>
            </div>
            <Switch
              checked={formData.auto_schedule_interviews}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_schedule_interviews: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>AI Interview Questions</Label>
              <p className="text-xs text-gray-500">Generate interview questions using AI</p>
            </div>
            <Switch
              checked={formData.enable_ai_interview_questions}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_ai_interview_questions: checked })}
            />
          </div>
        </div>

        <Button
          onClick={() => saveConfig.mutate()}
          disabled={saveConfig.isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          {saveConfig.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}