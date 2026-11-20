import React, { useEffect, useState } from 'react';
import { Plus, Search, ShieldCheck, UserCheck, UserX, X } from 'lucide-react';
import type { AdminPermission, AdminRoleDefinition, AdminRoleId, AdminTeamMember, AdminUserRecord } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminCard, AdminConfirmModal, AdminFeedbackBanner, StatusLabel, formatShortDate } from './AdminShared';

export const AdminUsersTeamView: React.FC<{ mode: 'users' | 'team' }> = ({ mode }) => {
  const { adminFetch, hasPermission, isSuperAdmin } = useAdminAuth();

  // Users state
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Suspended' | 'Verified' | 'Unverified'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'points'>('recent');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerUser, setDrawerUser] = useState<AdminUserRecord | null>(null);
  const [editCollege, setEditCollege] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editSemester, setEditSemester] = useState('');
  const [editRole, setEditRole] = useState<'Student' | 'Moderator Admin'>('Student');
  const [noteInput, setNoteInput] = useState('');
  const [suspendConfirmUser, setSuspendConfirmUser] = useState<AdminUserRecord | null>(null);

  // Team RBAC state
  const [roles, setRoles] = useState<AdminRoleDefinition[]>([]);
  const [members, setMembers] = useState<AdminTeamMember[]>([]);
  const [allPerms, setAllPerms] = useState<AdminPermission[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRoleId>('moderator');
  const [newPassword, setNewPassword] = useState('');

  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (mode === 'users') {
      adminFetch<{ users: AdminUserRecord[] }>('/api/admin/users')
        .then((d) => setUsers(d.users || []))
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    } else {
      adminFetch<{ roles: AdminRoleDefinition[]; members: AdminTeamMember[]; allPermissions: AdminPermission[] }>(
        '/api/admin/team'
      )
        .then((d) => {
          setRoles(d.roles || []);
          setMembers(d.members || []);
          setAllPerms(d.allPermissions || []);
        })
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    }
  }, [mode, adminFetch]);

  const updateUser = async (uid: string, patch: Record<string, unknown>) => {
    try {
      const res = await adminFetch<{ users: AdminUserRecord[] }>(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setUsers(res.users);
      if (drawerUser?.userId === uid) {
        setDrawerUser(res.users.find((u) => u.userId === uid) || null);
      }
      setNotice({ kind: 'success', message: 'User account updated and synchronized.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Update failed.' });
    }
  };

  const runBulkAction = async (action: 'suspend' | 'restore' | 'verify') => {
    try {
      const res = await adminFetch<{ users: AdminUserRecord[] }>('/api/admin/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ userIds: selectedIds, action }),
      });
      setUsers(res.users);
      setSelectedIds([]);
      setNotice({ kind: 'success', message: `Bulk action "${action}" applied.` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Bulk action failed.' });
    }
  };

  const addUserNote = async () => {
    if (!drawerUser || !noteInput.trim()) return;
    try {
      const res = await adminFetch<{ users: AdminUserRecord[] }>(`/api/admin/users/${drawerUser.userId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: noteInput }),
      });
      setUsers(res.users);
      setDrawerUser(res.users.find((u) => u.userId === drawerUser.userId) || null);
      setNoteInput('');
      setNotice({ kind: 'success', message: 'Internal admin note logged.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to save note.' });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminFetch<{ members: AdminTeamMember[] }>('/api/admin/team/member', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          roleId: newRole,
          password: newPassword,
        }),
      });
      setMembers(res.members);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNotice({ kind: 'success', message: 'Administrator team member created.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to add team member.' });
    }
  };

  const toggleRolePermission = async (role: AdminRoleDefinition, perm: AdminPermission) => {
    if (role.id === 'super_admin') return;
    const next = role.permissions.includes(perm)
      ? role.permissions.filter((p) => p !== perm)
      : [...role.permissions, perm];
    try {
      const res = await adminFetch<{ roles: AdminRoleDefinition[] }>(`/api/admin/team/roles/${role.id}`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: next }),
      });
      setRoles(res.roles);
      setNotice({ kind: 'success', message: `Updated permission matrix for ${role.name}.` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Permission update failed.' });
    }
  };

  const updateMemberStatus = async (m: AdminTeamMember, status: 'Active' | 'Suspended') => {
    try {
      const res = await adminFetch<{ members: AdminTeamMember[] }>(`/api/admin/team/member/${m.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setMembers(res.members);
      setNotice({ kind: 'success', message: `${m.email} is now ${status}.` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Member update failed.' });
    }
  };

  if (mode === 'team') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Admin Team & RBAC Permissions
          </h1>
          <p className="text-xs text-slate-500">
            Configure granular role-based permissions, prevent privilege escalation, and manage administrator accounts.
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <AdminCard className="lg:col-span-7" title={`Admin Team (${members.length})`}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m) => (
                <div key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{m.name}</span>
                      <StatusLabel status={m.status} />
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {m.email} · role: {m.roleId}
                    </div>
                  </div>
                  {isSuperAdmin && m.roleId !== 'super_admin' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateMemberStatus(m, m.status === 'Active' ? 'Suspended' : 'Active')}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50"
                      >
                        {m.status === 'Active' ? 'Suspend' : 'Restore'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="lg:col-span-5" title="Add Administrator Account">
            {!isSuperAdmin ? (
              <p className="text-xs text-slate-500">Only Super Admins can create new admin team members.</p>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="email"
                  required
                  placeholder="Admin Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRoleId)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="admin">Admin</option>
                  <option value="content_manager">Content Manager</option>
                  <option value="moderator">Moderator</option>
                  <option value="support_admin">Support Admin</option>
                </select>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Admin Account
                </button>
              </form>
            )}
          </AdminCard>
        </div>

        <AdminCard title="Role Permission Matrix (10 Granular Permissions)">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                  <th className="py-2 pr-4">Role</th>
                  {allPerms.map((p) => (
                    <th key={p} className="py-2 px-2 text-center font-mono">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-4 font-bold">{r.name}</td>
                    {allPerms.map((p) => (
                      <td key={p} className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={!isSuperAdmin || r.id === 'super_admin'}
                          checked={r.permissions.includes(p)}
                          onChange={() => toggleRolePermission(r, p)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    );
  }

  const openUserDrawer = (u: AdminUserRecord) => {
    setDrawerUser(u);
    setEditCollege(u.college || '');
    setEditCourse(u.course || '');
    setEditSemester(u.semester || '');
    setEditRole(u.role === 'Moderator Admin' ? 'Moderator Admin' : 'Student');
  };

  const filteredUsers = users
    .filter((u) => {
      if (statusFilter === 'Active' && u.accountStatus !== 'Active') return false;
      if (statusFilter === 'Suspended' && u.accountStatus !== 'Suspended') return false;
      if (statusFilter === 'Verified' && !u.isVerified) return false;
      if (statusFilter === 'Unverified' && u.isVerified) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.enrollmentNo.toLowerCase().includes(q) ||
        u.college.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'points') return b.activitySummary.rewardPoints - a.activitySummary.rewardPoints;
      return b.registeredAt.localeCompare(a.registeredAt);
    });

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            User & Account Management
          </h1>
          <p className="text-xs text-slate-500">
            Search student profiles, inspect activity counts, edit permitted fields, suspend/restore accounts, and log internal notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, roll..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">All Accounts</option>
            <option value="Active">Active Only</option>
            <option value="Suspended">Suspended Only</option>
            <option value="Verified">Verified Students</option>
            <option value="Unverified">Unverified Students</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            <option value="recent">Sort: Newest Joined</option>
            <option value="name">Sort: Name (A–Z)</option>
            <option value="points">Sort: Rewards Points</option>
          </select>
        </div>
      </div>

      <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

      {selectedIds.length > 0 && hasPermission('manage_users') && (
        <div className="px-4 py-2.5 rounded-xl bg-[#172554] text-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold tabular-nums">{selectedIds.length} user(s) selected</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => runBulkAction('verify')} className="px-2.5 py-1 rounded bg-blue-600 font-semibold">
              Bulk Verify
            </button>
            <button type="button" onClick={() => runBulkAction('restore')} className="px-2.5 py-1 rounded bg-emerald-600 font-semibold">
              Bulk Restore
            </button>
            <button type="button" onClick={() => runBulkAction('suspend')} className="px-2.5 py-1 rounded bg-red-600 font-semibold">
              Bulk Suspend
            </button>
          </div>
        </div>
      )}

      <AdminCard title={`Student Directory (${filteredUsers.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                <th className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? filteredUsers.map((u) => u.userId) : [])
                    }
                  />
                </th>
                <th className="py-2 pr-3">Student</th>
                <th className="py-2 pr-3">College & Course</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right">Rewards Pts</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pagedUsers.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 pr-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(u.userId)}
                      onChange={(e) =>
                        setSelectedIds((prev) =>
                          e.target.checked ? [...prev, u.userId] : prev.filter((id) => id !== u.userId)
                        )
                      }
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {u.email || u.enrollmentNo}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="truncate max-w-[220px]">{u.college || '—'}</div>
                    <div className="text-[11px] text-slate-500">
                      {u.course} {u.semester}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-1.5">
                      <StatusLabel status={u.accountStatus} />
                      {u.isVerified && <StatusLabel status="Verified" />}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                    {u.activitySummary.rewardPoints}
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openUserDrawer(u)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Inspect
                      </button>
                      {hasPermission('manage_users') && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateUser(u.userId, { isVerified: !u.isVerified })}
                            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:text-blue-600"
                            title="Toggle Verified Badge"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                          {u.accountStatus === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => setSuspendConfirmUser(u)}
                              className="p-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50"
                              title="Suspend account"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateUser(u.userId, { accountStatus: 'Active' })}
                              className="p-1.5 rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              title="Restore account"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 tabular-nums">
            Page {safePage} of {totalPages} · {filteredUsers.length} matching accounts
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </AdminCard>

      {/* User Inspection Drawer */}
      {drawerUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold">{drawerUser.name}</h2>
                <div className="text-xs font-mono text-slate-500">
                  {drawerUser.enrollmentNo} · {drawerUser.email || drawerUser.userId}
                </div>
              </div>
              <button type="button" onClick={() => setDrawerUser(null)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-slate-500">Status</div>
                <div className="mt-1"><StatusLabel status={drawerUser.accountStatus} /></div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-slate-500">Joined</div>
                <div className="mt-1 font-mono tabular-nums">{formatShortDate(drawerUser.registeredAt)}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="font-bold">Cross-Module Activity Summary</div>
              <div className="grid grid-cols-3 gap-2 tabular-nums">
                <div>Events: <b>{drawerUser.activitySummary.events}</b></div>
                <div>Listings: <b>{drawerUser.activitySummary.listings}</b></div>
                <div>Posts: <b>{drawerUser.activitySummary.posts}</b></div>
                <div>Tickets: <b>{drawerUser.activitySummary.supportTickets}</b></div>
                <div>Reports: <b>{drawerUser.reportedCount}</b></div>
                <div>Points: <b>{drawerUser.activitySummary.rewardPoints}</b></div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Private Locker file contents remain strictly shielded from admin inspection.
              </p>
            </div>

            {hasPermission('manage_users') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="font-bold">Edit Permitted Academic Details</div>
                <input
                  type="text"
                  placeholder="College / Institution"
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Course"
                    value={editCourse}
                    onChange={(e) => setEditCourse(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="Semester"
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Student">Student</option>
                  <option value="Moderator Admin">Moderator Admin</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    updateUser(drawerUser.userId, {
                      college: editCollege,
                      course: editCourse,
                      semester: editSemester,
                      role: editRole,
                    })
                  }
                  className="w-full py-1.5 rounded-lg bg-[#172554] text-white font-semibold"
                >
                  Save Permitted Changes
                </button>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-bold">Internal Admin Notes</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add moderation or support note..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={addUserNote}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Log
                </button>
              </div>
              <div className="space-y-2 pt-2">
                {drawerUser.internalNotes.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                    <div>{n.note}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {n.author} · {formatShortDate(n.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(suspendConfirmUser)}
        title="Suspend Student Account"
        description={`Suspending ${suspendConfirmUser?.name || ''} will block student portal login until restored by an administrator.`}
        confirmLabel="Suspend User"
        danger
        onConfirm={() => {
          if (suspendConfirmUser) updateUser(suspendConfirmUser.userId, { accountStatus: 'Suspended' });
          setSuspendConfirmUser(null);
        }}
        onCancel={() => setSuspendConfirmUser(null)}
      />
    </div>
  );
};
