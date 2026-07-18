import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, CheckCircle2, Circle, Clock, Calendar, PartyPopper,
  ClipboardList, Briefcase, ListChecks
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'pre-boarding': { label: 'Pre-boarding', color: 'blue', icon: ClipboardList },
  'day-1': { label: 'Day 1', color: 'indigo', icon: PartyPopper },
  'first-week': { label: 'First Week', color: 'purple', icon: ListChecks },
  'first-month': { label: 'First Month', color: 'green', icon: CheckCircle2 }
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'gray' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Done', color: 'green' },
  skipped: { label: 'Skipped', color: 'gray' }
};

function TaskItem({ task, onToggle }) {
  const cat = CATEGORY_CONFIG[task.task_category] || CATEGORY_CONFIG['pre-boarding'];
  const isDone = task.status === 'completed';
  return (
    <Card className={isDone ? 'opacity-60' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <button onClick={() => onToggle(task)} className="mt-0.5 flex-shrink-0">
            {isDone
              ? <CheckCircle2 className="w-6 h-6 text-green-600" />
              : <Circle className="w-6 h-6 text-gray-300 hover:text-indigo-500" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium text-gray-900 ${isDone ? 'line-through' : ''}`}>{task.task_title}</h3>
              <Badge className={`bg-${cat.color}-100 text-${cat.color}-800 gap-1`}>
                <cat.icon className="w-3 h-3" />{cat.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            {task.scheduled_date && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />Due: {new Date(task.scheduled_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CandidateOnboardingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-onboarding-tasks'],
    queryFn: () => base44.entities.OnboardingTask.filter({ employee_email: user?.email }, 'scheduled_date'),
    enabled: !!user
  });

  const toggleMutation = useMutation({
    mutationFn: (task) => base44.entities.OnboardingTask.update(task.id, {
      status: task.status === 'completed' ? 'pending' : 'completed',
      completed_at: task.status === 'completed' ? null : new Date().toISOString()
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-onboarding-tasks'] }),
    onError: (e) => toast({ title: 'Failed to update task', description: e.message, variant: 'destructive' })
  });

  const grouped = useMemo(() => {
    const groups = { 'pre-boarding': [], 'day-1': [], 'first-week': [], 'first-month': [] };
    tasks.forEach(t => { (groups[t.task_category] || (groups['pre-boarding'])).push(t); });
    return groups;
  }, [tasks]);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);
  }, [tasks]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!isLoading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <PartyPopper className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-900">No onboarding checklist yet</h2>
              <p className="text-gray-600 mt-1 max-w-md mx-auto">Your personalized first-day preparation checklist will appear here automatically once you accept a job offer.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <PartyPopper className="w-8 h-8 text-indigo-600" /> Your Onboarding Checklist
          </h1>
          <p className="text-gray-600 mt-1">Welcome aboard! Complete these tasks to prepare for your first day.</p>
        </div>

        {/* Progress */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-600" /> Onboarding Progress</h3>
              <span className="text-2xl font-bold text-indigo-600">{progress}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-gray-600 mt-2">{tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks complete</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <Tabs defaultValue="pre-boarding">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
              {Object.entries(CATEGORY_CONFIG).map(([k, c]) => (
                <TabsTrigger key={k} value={k} className="gap-1">
                  <c.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{c.label}</span>
                  <Badge className="ml-1 bg-gray-100 text-gray-600">{(grouped[k] || []).length}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(CATEGORY_CONFIG).map(([k, c]) => (
              <TabsContent key={k} value={k} className="space-y-3">
                {(grouped[k] || []).length === 0 ? (
                  <Card><CardContent className="pt-8 pb-8 text-center text-gray-500">No tasks in this stage.</CardContent></Card>
                ) : (grouped[k] || []).map(task => (
                  <TaskItem key={task.id} task={task} onToggle={toggleMutation.mutate} />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}