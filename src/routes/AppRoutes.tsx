import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { AccountsPage } from '@/pages/Accounts/AccountsPage';
import { BatchesPage } from '@/pages/Batches/BatchesPage';
import { BatchDetailPage } from '@/pages/Batches/BatchDetailPage';
import { NewBatchWizard } from '@/pages/Batches/NewBatchWizard';
import { JobsPage } from '@/pages/Jobs/JobsPage';
import { ReportsPage } from '@/pages/Reports/ReportsPage';
import { ApiTestPage } from '@/pages/Test/ApiTestPage';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />
        <Route path="batches/new" element={<NewBatchWizard />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="test-api" element={<ApiTestPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};