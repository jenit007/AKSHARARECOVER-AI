import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from './CommonUI';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#101614] flex items-center justify-center pt-20">
        <LoadingSpinner size="lg" text="Verifying archive session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    const nextUrl = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${nextUrl}`} replace />;
  }

  return children;
}
