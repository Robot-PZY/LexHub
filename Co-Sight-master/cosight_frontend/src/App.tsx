import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/app/ProtectedRoute';

const AdminLayout = lazy(() => import('./components/layout/AdminShell'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const WorkspaceRunPage = lazy(() => import('./pages/WorkspaceRunPage'));
const WorkspaceResultPage = lazy(() => import('./pages/WorkspaceResultPage'));
const MaterialsPage = lazy(() => import('./pages/MaterialsPage'));
const MembershipPage = lazy(() => import('./pages/MembershipPage'));
const ReplayPage = lazy(() => import('./pages/ReplayPage'));
const CasesPage = lazy(() => import('./pages/CasesPage'));
const EvidencePage = lazy(() => import('./pages/EvidencePage'));
const ResearchPage = lazy(() => import('./pages/ResearchPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ProfilesPage = lazy(() => import('./pages/ProfilesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminConnectionsPage = lazy(() => import('./pages/admin/AdminConnectionsPage'));
const AdminKnowledgePage = lazy(() => import('./pages/admin/AdminKnowledgePage'));
const AdminPoliciesPage = lazy(() => import('./pages/admin/AdminPoliciesPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

function App() {
  const location = useLocation();

  return (
    <div className="page-transition-stage" key={`${location.pathname}${location.search}`}>
      <Suspense fallback={<div className="route-loading" role="status">正在加载工作台…</div>}>
      <Routes location={location}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/workspace"
        element={(
          <ProtectedRoute role="user">
            <WorkspacePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/workspace/run"
        element={(
          <ProtectedRoute role="user">
            <WorkspaceRunPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/workspace/result"
        element={(
          <ProtectedRoute role="user">
            <WorkspaceResultPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/materials"
        element={(
          <ProtectedRoute role="user">
            <MaterialsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/membership"
        element={(
          <ProtectedRoute role="user">
            <MembershipPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/cases"
        element={(
          <ProtectedRoute role="user">
            <CasesPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/agents"
        element={(
          <ProtectedRoute role="user">
            <AgentsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/evidence"
        element={(
          <ProtectedRoute role="user">
            <EvidencePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/research"
        element={(
          <ProtectedRoute role="user">
            <ResearchPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/review"
        element={(
          <ProtectedRoute role="user">
            <Navigate to="/workspace/result" replace />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/documents"
        element={(
          <ProtectedRoute role="user">
            <DocumentsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/reports"
        element={(
          <ProtectedRoute role="user">
            <ReportsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/profiles"
        element={(
          <ProtectedRoute role="user">
            <ProfilesPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/analytics"
        element={(
          <ProtectedRoute role="user">
            <AnalyticsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/replay"
        element={(
          <ProtectedRoute role="user">
            <ReplayPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin"
        element={(
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="connections" element={<AdminConnectionsPage />} />
        <Route path="knowledge" element={<AdminKnowledgePage />} />
        <Route path="policies" element={<AdminPoliciesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="models" element={<Navigate to="/admin/connections?tab=models" replace />} />
        <Route path="apis" element={<Navigate to="/admin/connections?tab=apis" replace />} />
        <Route path="routing" element={<Navigate to="/admin/policies?tab=routing" replace />} />
        <Route path="review-rules" element={<Navigate to="/admin/policies?tab=review" replace />} />
        <Route path="analytics" element={<Navigate to="/admin" replace />} />
        <Route path="agents" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </div>
  );
}

export default App;
