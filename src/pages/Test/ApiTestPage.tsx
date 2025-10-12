import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useHealthCheck, useDashboardStats, useUseCases } from '@/services/queries';

export const ApiTestPage: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // React Query hooks
  const { data: healthData, isLoading: healthLoading, error: healthError } = useHealthCheck();
  const { data: statsData, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: useCasesData, isLoading: useCasesLoading, error: useCasesError } = useUseCases();

  const testRawConnection = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        const data = await response.text();
        setResult(`✅ Raw connection successful! Response: ${data}`);
      } else {
        setResult(`❌ Raw connection failed! Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setResult(`❌ Raw connection failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRootEndpoint = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const response = await fetch('http://localhost:8000/');
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Root endpoint working! Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Root endpoint failed! Status: ${response.status}`);
      }
    } catch (error) {
      setResult(`❌ Root endpoint failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateAccount = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: 'test_frontend',
          account_name: 'Test from Frontend',
          plan_type: 'minutes_based',
          initial_minutes: 100.0,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Account creation successful! Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Account creation failed! Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ Account creation failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">API Connection Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Tests */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Manual Tests</h2>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={testRawConnection}
              isLoading={isLoading}
              disabled={isLoading}
              size="sm"
            >
              Test Raw Health
            </Button>
            
            <Button 
              onClick={testRootEndpoint}
              isLoading={isLoading}
              disabled={isLoading}
              variant="secondary"
              size="sm"
            >
              Test Root Endpoint
            </Button>

            <Button 
              onClick={testCreateAccount}
              isLoading={isLoading}
              disabled={isLoading}
              variant="primary"
              size="sm"
            >
              Test Create Account
            </Button>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Manual Test Result:</h3>
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{result}</pre>
            </div>
          )}
        </div>

        {/* React Query Tests */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">React Query Tests</h2>
          
          {/* Health Check */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Health Check</h3>
            {healthLoading && <p className="text-blue-600">Loading...</p>}
            {!!healthError && <p className="text-red-600">Error occurred</p>}
            {healthData && (
              <pre className="text-sm bg-green-50 p-2 rounded">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            )}
          </div>

          {/* Dashboard Stats */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Dashboard Stats</h3>
            {statsLoading && <p className="text-blue-600">Loading...</p>}
            {!!statsError && <p className="text-red-600">Error occurred</p>}
            {statsData && (
              <pre className="text-sm bg-green-50 p-2 rounded">
                {JSON.stringify(statsData, null, 2)}
              </pre>
            )}
          </div>

          {/* Use Cases */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Use Cases</h3>
            {useCasesLoading && <p className="text-blue-600">Loading...</p>}
            {!!useCasesError && <p className="text-red-600">Error occurred</p>}
            {useCasesData && (
              <pre className="text-sm bg-green-50 p-2 rounded">
                {JSON.stringify(useCasesData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
      
      {/* API Configuration Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2">API Configuration:</h3>
        <div className="text-sm space-y-1">
          <p><strong>Base URL:</strong> http://localhost:8000</p>
          <p><strong>API Version:</strong> /api/v1</p>
          <p><strong>Available Endpoints:</strong></p>
          <ul className="ml-4 list-disc space-y-1">
            <li>GET /health - Health check</li>
            <li>GET / - Root endpoint</li>
            <li>POST /api/v1/accounts - Create account</li>
            <li>GET /api/v1/dashboard/stats - Dashboard stats</li>
            <li>GET /api/v1/use-cases - Available use cases</li>
            <li>POST /api/v1/batches/chile/debt_collection - Create Chile batch</li>
            <li>GET /api/v1/batches - List batches</li>
            <li>GET /api/v1/jobs - List jobs</li>
          </ul>
        </div>
      </div>

      {/* CORS Information */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium mb-2">⚠️ CORS Information:</h3>
        <p className="text-sm">
          If you see CORS errors, your backend needs to allow requests from http://localhost:3000. 
          Add CORS middleware to your FastAPI app with:
        </p>
        <pre className="text-sm bg-yellow-100 p-2 rounded mt-2">
{`from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)`}
        </pre>
      </div>
    </div>
  );
};