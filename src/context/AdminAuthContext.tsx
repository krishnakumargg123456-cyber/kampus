import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AdminPermission, AdminSessionRecord, AdminTeamMember } from '../types/superAdmin';

interface AdminAuthContextValue {
  token: string | null;
  admin: AdminTeamMember | null;
  roleName: string;
  permissions: AdminPermission[];
  session: AdminSessionRecord | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  hasPermission: (perm: AdminPermission) => boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  adminFetch: <T = any>(url: string, init?: RequestInit) => Promise<T>;
}

const TOKEN_STORAGE_KEY = 'kampus_admin_token';

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [admin, setAdmin] = useState<AdminTeamMember | null>(null);
  const [roleName, setRoleName] = useState<string>('');
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [session, setSession] = useState<AdminSessionRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clearAuth = useCallback(() => {
    setToken(null);
    setAdmin(null);
    setRoleName('');
    setPermissions([]);
    setSession(null);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const verifySession = useCallback(
    async (tok: string) => {
      try {
        const res = await fetch('/api/admin/auth/session', {
          headers: { 'X-Admin-Token': tok },
        });
        if (!res.ok) {
          clearAuth();
          return;
        }
        const data = await res.json();
        setAdmin(data.admin);
        setRoleName(data.roleName || data.admin?.roleId || 'Administrator');
        setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
        setSession(data.session || null);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    },
    [clearAuth]
  );

  useEffect(() => {
    if (token) {
      verifySession(token);
    } else {
      setLoading(false);
    }
  }, [token, verifySession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data?.message || 'Authentication failed.' };
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setAdmin(data.admin);
      setRoleName(data.roleName || data.admin?.roleId || 'Administrator');
      setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
      setSession(data.session || null);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unable to reach admin server.' };
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { 'X-Admin-Token': token },
        });
      } catch {
        // ignore network failures during logout
      }
    }
    clearAuth();
  }, [token, clearAuth]);

  const adminFetch = useCallback(
    async <T = any>(url: string, init: RequestInit = {}): Promise<T> => {
      const headers = new Headers(init.headers || {});
      if (token) headers.set('X-Admin-Token', token);
      if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const res = await fetch(url, { ...init, headers });
      if (res.status === 401) {
        clearAuth();
        throw new Error('Admin session expired. Please sign in again.');
      }
      const text = await res.text();
      let parsed: any = null;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { message: text };
      }
      if (!res.ok) {
        throw new Error(parsed?.message || `Request failed (${res.status})`);
      }
      return parsed as T;
    },
    [token, clearAuth]
  );

  const hasPermission = useCallback(
    (perm: AdminPermission) => permissions.includes(perm),
    [permissions]
  );

  return (
    <AdminAuthContext.Provider
      value={{
        token,
        admin,
        roleName,
        permissions,
        session,
        loading,
        isAuthenticated: Boolean(token && admin),
        isSuperAdmin: admin?.roleId === 'super_admin',
        hasPermission,
        login,
        logout,
        adminFetch,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }
  return ctx;
}
