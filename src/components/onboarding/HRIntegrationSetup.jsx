import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Check, AlertCircle, RefreshCw } from 'lucide-react';

export default function HRIntegrationSetup() {
  const [showForm, setShowForm] = useState(false);
  const [systemType, setSystemType] = useState('');
  const [systemName, setSystemName] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [autoCreateEmployee, setAutoCreateEmployee] = useState(true);
  const [autoSyncPayroll, setAutoSyncPayroll] = useState(true);
  const [autoSyncBenefits, setAutoSyncBenefits] = useState(true);
  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['hrIntegrations'],
    queryFn: () => base44.asServiceRole.entities.HRSystemIntegration.list()
      .then(integrations => ({ integrations }))
      .catch(() => ({ integrations: [] }))
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!systemType || !systemName) {
        throw new Error('System type and name required');
      }

      return base44.asServiceRole.entities.HRSystemIntegration.create({
        system_type: systemType,
        system_name: systemName,
        api_endpoint: apiEndpoint,
        is_active: true,
        sync_settings: {
          auto_create_employee: autoCreateEmployee,
          auto_sync_payroll: autoSyncPayroll,
          auto_sync_benefits: autoSyncBenefits,
          sync_frequency: 'realtime'
        },
        sync_status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrIntegrations'] });
      setShowForm(false);
      setSystemType('');
      setSystemName('');
      setApiEndpoint('');
    }
  });

  const systemList = integrations?.integrations || [];

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'error') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getSystemIcon = (type) => {
    const icons = {
      workday: '💼',
      bamboohr: '🌿',
      gusto: '💰',
      rippling: '🔗',
      custom: '⚙️'
    };
    return icons[type] || '📦';
  };

  return (
    <div className="space-y-6">
      {/* Configuration Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Set Up HR System Integrations</h3>
          <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
            <li>Add your HR system configuration below</li>
            <li>Set environment secrets when ready (WORKDAY_API_KEY, BAMBOOHR_API_KEY, etc.)</li>
            <li>Enable auto-sync for payroll and benefits</li>
            <li>When offers are accepted, employees will be created automatically</li>
          </ol>
        </CardContent>
      </Card>

      {/* Add New Integration */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2 w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add HR System
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add New HR System Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HR System Type *
              </label>
              <Select value={systemType} onValueChange={setSystemType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select system..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workday">Workday</SelectItem>
                  <SelectItem value="bamboohr">BambooHR</SelectItem>
                  <SelectItem value="gusto">Gusto</SelectItem>
                  <SelectItem value="rippling">Rippling</SelectItem>
                  <SelectItem value="custom">Custom API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Name (for reference) *
              </label>
              <Input
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="e.g., Production Workday"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Endpoint
              </label>
              <Input
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoCreateEmployee}
                  onChange={(e) => setAutoCreateEmployee(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Auto-create employee records on offer acceptance</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoSyncPayroll}
                  onChange={(e) => setAutoSyncPayroll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Auto-sync payroll data</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoSyncBenefits}
                  onChange={(e) => setAutoSyncBenefits(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Auto-sync benefits enrollment</span>
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Set your API key in App Settings → Environment Variables for this system to work
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !systemType || !systemName}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Add Integration'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrations List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading integrations...
          </CardContent>
        </Card>
      ) : systemList.length > 0 ? (
        <div className="space-y-3">
          {systemList.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getSystemIcon(integration.system_type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{integration.system_name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{integration.system_type}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-2 mt-3 text-xs">
                      <div>
                        <p className="text-gray-600">Status</p>
                        <Badge className={getStatusColor(integration.sync_status)}>
                          {integration.sync_status === 'active' ? '✓ Active' : integration.sync_status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">Auto Create Employees</p>
                        <Badge variant="outline">
                          {integration.sync_settings?.auto_create_employee ? '✓ Yes' : '✗ No'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">Payroll Sync</p>
                        <Badge variant="outline">
                          {integration.sync_settings?.auto_sync_payroll ? '✓ Yes' : '✗ No'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">Benefits Sync</p>
                        <Badge variant="outline">
                          {integration.sync_settings?.auto_sync_benefits ? '✓ Yes' : '✗ No'}
                        </Badge>
                      </div>
                    </div>

                    {integration.last_sync && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last synced: {new Date(integration.last_sync).toLocaleString()}
                      </p>
                    )}

                    {integration.error_log && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        {integration.error_log}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No HR systems configured yet. Click "Add HR System" to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}