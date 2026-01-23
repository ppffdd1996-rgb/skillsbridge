import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Sparkles, User, Briefcase, Target, ArrowRight, X, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles, page: null },
  { id: 'profile', title: 'Setup Profile', icon: User, page: 'Profile' },
  { id: 'opportunity', title: 'Create Job', icon: Briefcase, page: 'CreateOpportunity' },
  { id: 'matching', title: 'How It Works', icon: Target, page: null },
  { id: 'complete', title: 'Complete', icon: CheckCircle, page: null }
];

export default function OnboardingFlow({ user }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [guidance, setGuidance] = useState(null);
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: onboarding } = useQuery({
    queryKey: ['onboarding', user?.email],
    queryFn: async () => {
      const existing = await base44.entities.Onboarding.filter({ user_email: user.email });
      if (existing.length > 0) return existing[0];
      
      const newOnboarding = await base44.entities.Onboarding.create({
        user_email: user.email,
        current_step: 0,
        completed_steps: []
      });
      return newOnboarding;
    },
    enabled: !!user
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: (data) => base44.entities.Onboarding.update(onboarding.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    }
  });

  useEffect(() => {
    if (onboarding && !onboarding.completed && !onboarding.skipped) {
      setCurrentStep(onboarding.current_step || 0);
      loadGuidance(STEPS[onboarding.current_step || 0].id);
    }
  }, [onboarding]);

  const loadGuidance = async (step) => {
    setLoadingGuidance(true);
    try {
      const response = await base44.functions.invoke('generateOnboardingGuidance', {
        step,
        context: { userName: user?.display_name || user?.full_name }
      });
      setGuidance(response.data.guidance);
    } catch (error) {
      console.error('Error loading guidance:', error);
    } finally {
      setLoadingGuidance(false);
    }
  };

  const nextStep = async () => {
    const step = STEPS[currentStep];
    const newCompletedSteps = [...(onboarding.completed_steps || []), step.id];
    
    if (currentStep < STEPS.length - 1) {
      const nextStepIndex = currentStep + 1;
      await updateOnboardingMutation.mutateAsync({
        current_step: nextStepIndex,
        completed_steps: newCompletedSteps
      });
      setCurrentStep(nextStepIndex);
      loadGuidance(STEPS[nextStepIndex].id);
    } else {
      await updateOnboardingMutation.mutateAsync({
        completed: true,
        completed_steps: newCompletedSteps
      });
    }
  };

  const goToPage = (page) => {
    if (page) {
      navigate(createPageUrl(page));
    }
  };

  const skipOnboarding = async () => {
    await updateOnboardingMutation.mutateAsync({ skipped: true });
  };

  if (!onboarding || onboarding.completed || onboarding.skipped) {
    return null;
  }

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" hideClose>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Getting Started
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={skipOnboarding}>
              <X className="w-4 h-4 mr-1" />
              Skip
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="text-sm font-medium text-indigo-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isComplete = idx < currentStep;
              const isCurrent = idx === currentStep;
              
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${isComplete ? 'bg-green-600 text-white' : 
                      isCurrent ? 'bg-indigo-600 text-white' : 
                      'bg-gray-200 text-gray-400'}
                  `}>
                    {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs text-center ${isCurrent ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StepIcon className="w-5 h-5 text-indigo-600" />
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingGuidance ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : guidance ? (
                    <div className="space-y-4">
                      <p className="text-gray-700">{guidance.message}</p>
                      {guidance.tips && guidance.tips.length > 0 && (
                        <div className="bg-white/60 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-900 mb-2">💡 Tips:</p>
                          <ul className="space-y-2">
                            {guidance.tips.map((tip, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-indigo-600 mt-0.5">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                {step.page && (
                  <Button
                    variant="outline"
                    onClick={() => goToPage(step.page)}
                    className="gap-2"
                  >
                    Go to {step.title}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={nextStep}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}