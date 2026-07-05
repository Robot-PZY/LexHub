import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthedRole, isAuthed, isDemoUserAccount, loadDemoUser, type AuthRole } from '../../lib/storage';

type ProtectedRouteProps = {
  children: ReactNode;
  role?: AuthRole;
};

function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  if (!isAuthed()) {
    return <Navigate to="/login" replace />;
  }

  if (role && getAuthedRole() !== role) {
    if (role === 'admin') {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  if (role === 'user') {
    const profile = loadDemoUser();
    if (!profile?.account || !isDemoUserAccount(profile.account)) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
