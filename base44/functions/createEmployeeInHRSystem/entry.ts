import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role === 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      employeeEmail,
      employeeName,
      jobTitle,
      department,
      startDate,
      salary,
      employmentType,
      managerId,
      hrSystemId
    } = await req.json();

    if (!employeeEmail || !employeeName || !jobTitle || !startDate || !hrSystemId) {
      return Response.json(
        { error: 'Missing required fields: employeeEmail, employeeName, jobTitle, startDate, hrSystemId' },
        { status: 400 }
      );
    }

    // Fetch HR system integration configuration
    const hrSystem = await base44.asServiceRole.entities.HRSystemIntegration.filter({
      id: hrSystemId
    });

    if (!hrSystem || hrSystem.length === 0) {
      return Response.json({ error: 'HR system configuration not found' }, { status: 404 });
    }

    const system = hrSystem[0];
    if (!system.is_active) {
      return Response.json({ error: 'HR system is not active' }, { status: 400 });
    }

    const systemType = system.system_type.toLowerCase();
    let result = {};

    try {
      if (systemType === 'workday') {
        result = await createWorkdayEmployee({
          employeeEmail,
          employeeName,
          jobTitle,
          department,
          startDate,
          salary,
          employmentType,
          managerId,
          system
        });
      } else if (systemType === 'bamboohr') {
        result = await createBambooHREmployee({
          employeeEmail,
          employeeName,
          jobTitle,
          department,
          startDate,
          salary,
          employmentType,
          system
        });
      } else if (systemType === 'gusto') {
        result = await createGustoEmployee({
          employeeEmail,
          employeeName,
          jobTitle,
          department,
          startDate,
          salary,
          employmentType,
          system
        });
      } else if (systemType === 'custom') {
        result = await createCustomHREmployee({
          employeeEmail,
          employeeName,
          jobTitle,
          department,
          startDate,
          salary,
          employmentType,
          system
        });
      }

      // Update sync status
      await base44.asServiceRole.entities.HRSystemIntegration.update(hrSystemId, {
        last_sync: new Date().toISOString(),
        sync_status: 'active'
      });

      return Response.json({
        success: true,
        employeeName,
        employeeEmail,
        hrSystem: system.system_name,
        externalId: result.externalId,
        message: result.message || 'Employee created successfully'
      });
    } catch (syncError) {
      // Log error but don't fail completely
      await base44.asServiceRole.entities.HRSystemIntegration.update(hrSystemId, {
        sync_status: 'error',
        error_log: syncError.message
      });

      return Response.json({
        success: false,
        error: `Failed to sync with ${system.system_name}: ${syncError.message}`,
        details: syncError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Create employee error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createWorkdayEmployee(data) {
  const { system, employeeName, employeeEmail, jobTitle, department, startDate, salary, employmentType } = data;

  const payload = {
    FirstName: employeeName.split(' ')[0],
    LastName: employeeName.split(' ').slice(1).join(' '),
    Email: employeeEmail,
    JobTitle: jobTitle,
    Department: department,
    StartDate: startDate,
    Salary: salary,
    EmploymentType: employmentType || 'Employee'
  };

  const response = await fetch(`${system.api_endpoint || 'https://api.workday.com/v1'}/employees`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('WORKDAY_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Workday API error: ${error}`);
  }

  const result = await response.json();
  return {
    externalId: result.id || result.EmployeeID,
    message: `Employee created in Workday with ID: ${result.id}`
  };
}

async function createBambooHREmployee(data) {
  const { system, employeeName, employeeEmail, jobTitle, department, startDate, salary } = data;

  const payload = {
    firstName: employeeName.split(' ')[0],
    lastName: employeeName.split(' ').slice(1).join(' '),
    email: employeeEmail,
    jobTitle: jobTitle,
    department: department,
    hireDate: startDate,
    salary: salary,
    status: 'Active'
  };

  const response = await fetch(`${system.api_endpoint || 'https://api.bamboohr.com/api/gateway.php'}/v1/employees`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(Deno.env.get('BAMBOOHR_API_KEY') + ':x')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`BambooHR API error: ${error}`);
  }

  const result = await response.json();
  return {
    externalId: result.id,
    message: `Employee created in BambooHR with ID: ${result.id}`
  };
}

async function createGustoEmployee(data) {
  const { system, employeeName, employeeEmail, jobTitle, department, startDate, salary } = data;

  const payload = {
    first_name: employeeName.split(' ')[0],
    last_name: employeeName.split(' ').slice(1).join(' '),
    email: employeeEmail,
    job_title: jobTitle,
    department: department,
    hire_date: startDate,
    compensation: {
      amount: salary.replace(/[^\d]/g, ''),
      frequency: 'yearly'
    }
  };

  const response = await fetch(`${system.api_endpoint || 'https://api.gusto.com/v1'}/employees`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('GUSTO_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gusto API error: ${error}`);
  }

  const result = await response.json();
  return {
    externalId: result.uuid,
    message: `Employee created in Gusto with ID: ${result.uuid}`
  };
}

async function createCustomHREmployee(data) {
  const { system, employeeName, employeeEmail, jobTitle, department, startDate, salary } = data;

  const payload = {
    name: employeeName,
    email: employeeEmail,
    job_title: jobTitle,
    department: department,
    start_date: startDate,
    salary: salary
  };

  const response = await fetch(system.api_endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('CUSTOM_HR_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Custom HR API error: ${error}`);
  }

  const result = await response.json();
  return {
    externalId: result.id,
    message: `Employee created in custom HR system`
  };
}