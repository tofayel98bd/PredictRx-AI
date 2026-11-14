import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const PrescriptionAnalysisPage = lazy(() =>
  import('@/features/prescription-analysis/PrescriptionAnalysisPage').then((m) => ({
    default: m.PrescriptionAnalysisPage,
  }))
);
const PrescriptionListPage = lazy(() =>
  import('@/features/prescriptions/PrescriptionListPage').then((m) => ({
    default: m.PrescriptionListPage,
  }))
);
const PatientListPage = lazy(() =>
  import('@/features/patients/PatientListPage').then((m) => ({ default: m.PatientListPage }))
);
const PatientDetailPage = lazy(() =>
  import('@/features/patients/PatientDetailPage').then((m) => ({
    default: m.PatientDetailPage,
  }))
);
const DrugInteractionPage = lazy(() =>
  import('@/features/drug-interactions/DrugInteractionPage').then((m) => ({
    default: m.DrugInteractionPage,
  }))
);
const ClinicalRiskAnalysisPage = lazy(() =>
  import('@/features/risk-analysis/ClinicalRiskAnalysisPage').then((m) => ({
    default: m.ClinicalRiskAnalysisPage,
  }))
);
const ClinicalReportPage = lazy(() =>
  import('@/features/reports/ClinicalReportPage').then((m) => ({
    default: m.ClinicalReportPage,
  }))
);
const BanglaCompanionPage = lazy(() =>
  import('@/features/bangla-companion/BanglaCompanionPage').then((m) => ({
    default: m.BanglaCompanionPage,
  }))
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const PageLoader = () => (
  <div className="space-y-4 p-4 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-8 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <Skeleton className="h-80 w-full" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'analyze',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrescriptionAnalysisPage />
          </Suspense>
        ),
      },
      {
        path: 'prescriptions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrescriptionListPage />
          </Suspense>
        ),
      },
      {
        path: 'patients',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PatientListPage />
          </Suspense>
        ),
      },
      {
        path: 'patients/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PatientDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'drug-interactions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DrugInteractionPage />
          </Suspense>
        ),
      },
      {
        path: 'risk-analysis',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ClinicalRiskAnalysisPage />
          </Suspense>
        ),
      },
      {
        path: 'risk-analysis/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ClinicalRiskAnalysisPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ClinicalReportPage />
          </Suspense>
        ),
      },
      {
        path: 'reports/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ClinicalReportPage />
          </Suspense>
        ),
      },
      {
        path: 'bangla-companion',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BanglaCompanionPage />
          </Suspense>
        ),
      },
      {
        path: 'bangla-companion/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BanglaCompanionPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
