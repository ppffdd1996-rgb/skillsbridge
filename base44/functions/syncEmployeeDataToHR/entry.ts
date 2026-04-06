import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role === 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      action,
      hrSystemId,
      employeeEmail,
      syncData = {}
    } = await req.json();

    if (!hrSystemId) {
      return Response.json(
        { error: 'Missing required field: hrSystemId' },
        { status: 400 }
      );
    }

    // Fetch HR system configuration
    const hrSystems = await base44.asServiceRole.entities.HRSystemIntegration.filter({
      id: hrSystemId
    });

    if (!hrSystems || hrSystems.length === 0) {
      return Response.json({ error: 'HR system not found' }, { status: 404 });
    }

    const system = hrSystems[0];
    if (!system.is_active) {
      return Response.json({ error: 'HR system is not active' }, { status: 400 });
    }

    let result = {};

    try {
      if (action === 'payroll') {
        result = await syncPayrollData(system, employeeEmail, syncData);
      } else if (action === 'benefits') {
        result = await syncBenefitsData(system, employeeEmail, syncData);
      } else if (action === 'profile') {
        result = await syncProfileData(system, employeeEmail, syncData);
      } else {
        return Response.json({ error: 'Invalid action' }, { status: 400 });
      }

      // Update sync status
      await base44.asServiceRole.entities.HRSystemIntegration.update(hrSystemId, {
        last_sync: new Date().toISOString(),
        sync_status: 'active'
      });

      return Response.json({
        success: true,
        action,
        employeeEmail,
        hrSystem: system.system_name,
        message: result.message
      });
    } catch (syncError) {
      await base44.asServiceRole.entities.HRSystemIntegration.update(hrSystemId, {
        sync_status: 'error',
        error_log: syncError.message
      });

      return Response.json({
        success: false,
        error: `Sync failed: ${syncError.message}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Sync employee data error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function syncPayrollData(system, employeeEmail, data) {
  const payload = {
    email: employeeEmail,
    salary: data.salary,
    payFrequency: data.payFrequency || 'bi-weekly',
    paymentMethod: data.paymentMethod || 'direct_deposit',
    bankAccount: data.bankAccount,
    taxInfo: data.taxInfo
  };

  const response = await fetch(`${system.api_endpoint}/payroll/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get(`${system.system_type.toUpperCase()}_API_KEY`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Payroll sync error: ${error}`);
  }

  return {
    message: 'Payroll data synced successfully'
  };
}

async function syncBenefitsData(system, employeeEmail, data) {
  const payload = {
    email: employeeEmail,
    healthPlan: data.healthPlan,
    dentalPlan: data.dentalPlan,
    visionPlan: data.visionPlan,
    retirement401k: data.retirement401k,
    dependents: data.dependents,
    beneficiaries: data.beneficiaries
  };

  const response = await fetch(`${system.api_endpoint}/benefits/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get(`${system.system_type.toUpperCase()}_API_KEY`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Benefits sync error: ${error}`);
  }

  return {
    message: 'Benefits data synced successfully'
  };
}

async function syncProfileData(system, employeeEmail, data) {
  const payload = {
    email: employeeEmail,
    name: data.name,
    phone: data.phone,
    address: data.address,
    jobTitle: data.jobTitle,
    department: data.department,
    manager: data.manager,
    customFields: data.customFields || {}
  };

  const response = await fetch(`${system.api_endpoint}/employees/sync`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${Deno.env.get(`${system.system_type.toUpperCase()}_API_KEY`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Profile sync error: ${error}`);
  }

  return {
    message: 'Employee profile synced successfully'
  };
}