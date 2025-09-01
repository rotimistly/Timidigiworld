import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    // Check for special admin session first
    const specialAdminSession = localStorage.getItem('admin_session');
    if (specialAdminSession) {
      try {
        const session = JSON.parse(specialAdminSession);
        if (session.isAdmin && session.timestamp > (Date.now() - 24 * 60 * 60 * 1000)) {
          setIsAdmin(true);
          setChecking(false);
          return;
        } else {
          localStorage.removeItem('admin_session');
        }
      } catch (e) {
        localStorage.removeItem('admin_session');
      }
    }

    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsAdmin(profile?.user_role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check for special admin session
  const specialAdminSession = localStorage.getItem('admin_session');
  const hasSpecialAdminAccess = specialAdminSession && (() => {
    try {
      const session = JSON.parse(specialAdminSession);
      return session.isAdmin && session.timestamp > (Date.now() - 24 * 60 * 60 * 1000);
    } catch {
      return false;
    }
  })();

  if (!hasSpecialAdminAccess && (!user || !isAdmin)) {
    return <Navigate to="/special-admin-login" replace />;
  }

  return <>{children}</>;
}