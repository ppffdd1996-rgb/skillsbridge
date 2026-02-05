import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function OnboardingTaskManager({ employeeEmail, employeeName, startDate }) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  const { data: tasksData, isLoading, refetch } = useQuery({
    queryKey: ['onboardingTasks', employeeEmail],
    queryFn: () => base44.asServiceRole.entities.OnboardingTask.filter({
      employee_email: employeeEmail
    }).then(tasks => ({
      tasks: tasks.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    })),
    enabled: !!employeeEmail,
    staleTime: 1000 * 60 * 5
  });

  const tasks = tasksData?.tasks || [];

  const filtered = tasks.filter(task => {
    if (filterCategory !== 'all' && task.task_category !== filterCategory) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    return true;
  });

  const handleCompleteTask = async (taskId) => {
    setLoading(true);
    try {
      await base44.asServiceRole.entities.OnboardingTask.update(taskId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      refetch();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length
  };

  const getCategoryColor = (category) => {
    const colors = {
      'pre-boarding': 'bg-blue-100 text-blue-800',
      'day-1': 'bg-green-100 text-green-800',
      'first-week': 'bg-purple-100 text-purple-800',
      'first-month': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === 'in_progress') return <Clock className="w-5 h-5 text-blue-600" />;
    return <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading tasks...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Tasks</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">In Progress</p>
            <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-yellow-600">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="pre-boarding">Pre-boarding</option>
                <option value="day-1">Day 1</option>
                <option value="first-week">First Week</option>
                <option value="first-month">First Month</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Tasks ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusIcon(task.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.task_title}
                        </h3>
                        <Badge className={getCategoryColor(task.task_category)}>
                          {task.task_category.replace('-', ' ')}
                        </Badge>
                        <Badge variant={task.status === 'completed' ? 'outline' : 'default'}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Due: {new Date(task.scheduled_date).toLocaleDateString()}</span>
                        <span>Assigned to: {task.assigned_to}</span>
                      </div>
                    </div>
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={loading}
                        className="whitespace-nowrap"
                      >
                        Mark Done
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No tasks match the selected filters</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}