import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/app/ProtectedRoute';
import AdminLayout from './components/layout/AdminShell';
import LandingPage from './pages/LandingPage';
import BoardPage from './pages/BoardPage';
import LoginPage from './pages/LoginPage';
import WorkspacePage from './pages/WorkspacePage';
import WorkspaceRunPage from './pages/WorkspaceRunPage';
import WorkspaceResultPage from './pages/WorkspaceResultPage';
import MaterialsPage from './pages/MaterialsPage';
import MembershipPage from './pages/MembershipPage';
import ReplayPage from './pages/ReplayPage';
import CasesPage from './pages/CasesPage';
import EvidencePage from './pages/EvidencePage';
import ResearchPage from './pages/ResearchPage';
import DocumentsPage from './pages/DocumentsPage';
import AgentsPage from './pages/AgentsPage';
import ReviewPage from './pages/ReviewPage';
import ReportsPage from './pages/ReportsPage';
import ProfilesPage from './pages/ProfilesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminConnectionsPage from './pages/admin/AdminConnectionsPage';
import AdminKnowledgePage from './pages/admin/AdminKnowledgePage';
import AdminPoliciesPage from './pages/admin/AdminPoliciesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

function App() {
  return (
    <Routes>
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
            <ReviewPage />
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
  );
}

export default App;
