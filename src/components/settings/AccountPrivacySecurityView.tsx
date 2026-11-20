import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MonitorSmartphone,
  Phone,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccountProfileSettings } from '../../context/AccountProfileSettingsContext';
import { useAuth } from '../../context/AuthContext';
import type { ProfileVisibility } from '../../types/accountProfileSettings';

interface Props {
  activeSection: 'account' | 'profile' | 'privacy' | 'security' | 'danger';
}

function getPasswordStrengthLabel(pw: string): { label: string; tone: string } {
  if (!pw) return { label: 'Enter a password', tone: 'text-slate-400' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score <= 1) return { label: 'Weak', tone: 'text-rose-600' };
  if (score === 2) return { label: 'Fair', tone: 'text-amber-600' };
  if (score === 3) return { label: 'Good', tone: 'text-blue-600' };
  return { label: 'Strong', tone: 'text-emerald-600' };
}

export const AccountPrivacySecurityView: React.FC<Props> = ({ activeSection }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const {
    settings,
    profileSummary,
    sessions,
    securityAudit,
    deletionRequest,
    saving,
    saveSettingsPatch,
    performSensitiveAccountAction,
    revokeSessions,
    submitDeletionRequest,
  } = useAccountProfileSettings();

  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Sensitive action modal state
  const [sensitiveMode, setSensitiveMode] = useState<
    null | 'update-email' | 'update-phone' | 'update-username' | 'change-password'
  >(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Account deletion multi-step modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Account deactivation confirmation modal
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');

  if (!settings) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
        Loading account settings...
      </div>
    );
  }

  const handleSensitiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sensitiveMode) return;
    if (sensitiveMode === 'change-password' && newPassword !== confirmPassword) {
      setNotice({ type: 'err', text: 'New password and confirmation do not match.' });
      return;
    }

    const res = await performSensitiveAccountAction({
      currentPassword,
      action: sensitiveMode,
      email: sensitiveMode === 'update-email' ? fieldValue : undefined,
      phone: sensitiveMode === 'update-phone' ? fieldValue : undefined,
      username: sensitiveMode === 'update-username' ? fieldValue : undefined,
      newPassword: sensitiveMode === 'change-password' ? newPassword : undefined,
    });

    if (res.ok) {
      setSensitiveMode(null);
      setCurrentPassword('');
      setFieldValue('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice({ type: 'ok', text: 'Account credential updated and logged in Security Audit.' });
    } else {
      setNotice({ type: 'err', text: res.error || 'Could not update credential.' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const strength = getPasswordStrengthLabel(newPassword);

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
            notice.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: ACCOUNT */}
      {activeSection === 'account' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>Account Credentials & Verification</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage your sign-in email, phone number, username, and password. Sensitive updates require re-authentication.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 self-start">
                Status: {settings.account.status}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email Address</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        settings.account.emailVerified ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {settings.account.emailVerified ? '· Verified' : '· Unverified'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{profileSummary?.email || 'Not configured'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue(profileSummary?.email || '');
                    setSensitiveMode('update-email');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 self-start cursor-pointer"
                >
                  Change Email
                </button>
              </div>

              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Phone Number</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        settings.account.phoneVerified ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {settings.account.phoneVerified ? '· Verified' : '· Unverified'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {profileSummary?.phone || 'Not configured'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue(profileSummary?.phone || '');
                    setSensitiveMode('update-phone');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 self-start cursor-pointer"
                >
                  Change Phone
                </button>
              </div>

              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Unique Username</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    @{profileSummary?.username || 'student'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue(profileSummary?.username || '');
                    setSensitiveMode('update-username');
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 self-start cursor-pointer"
                >
                  Update Username
                </button>
              </div>

              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    <span>Account Password</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {settings.account.passwordLastChangedAt
                      ? `Last changed ${settings.account.passwordLastChangedAt.slice(0, 10)}`
                      : 'Password change timestamp not recorded yet'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSensitiveMode('change-password')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 self-start cursor-pointer"
                >
                  Change Password
                </button>
              </div>

              <div className="pt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
                <span>Login Method: {settings.account.loginMethods.join(', ')}</span>
                <span>Account Created: {settings.account.createdAt.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PROFILE SHORTCUTS (NO DUPLICATE EDITOR) */}
      {activeSection === 'profile' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Student Profile Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Your bio, photo, academic history, skills, achievements, and portfolio projects are managed in the unified Student Profile module so there are no duplicate editors.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              to="/account/profile"
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-400 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Edit Student Profile</p>
                <p className="text-xs text-slate-500 mt-0.5">Personal info, avatar, bio, and goals</p>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </Link>

            <Link
              to="/account/profile?tab=academic"
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-400 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Academic & Portfolio Records</p>
                <p className="text-xs text-slate-500 mt-0.5">Education timeline, skills, projects</p>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </Link>
          </div>
        </div>
      )}

      {/* SECTION 3: PRIVACY */}
      {activeSection === 'privacy' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>Privacy & Discovery Controls</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control who can view your student profile, activity, and reach you across KAMPUS.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Profile Visibility</p>
              <div className="flex flex-wrap gap-2">
                {(['Public', 'KAMPUS Members', 'Private'] as ProfileVisibility[]).map((vis) => (
                  <button
                    key={vis}
                    type="button"
                    onClick={async () => {
                      const res = await saveSettingsPatch({
                        privacy: { ...settings.privacy, profileVisibility: vis },
                      });
                      if (res.ok) setNotice({ type: 'ok', text: `Profile visibility updated to ${vis}.` });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      settings.privacy.profileVisibility === vis
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {vis}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Activity Visibility</p>
                {(
                  [
                    ['community', 'Community Posts & Discussions'],
                    ['notes', 'Notes Exchange Contributions'],
                    ['achievements', 'Achievements & Badges'],
                    ['events', 'Campus Events Participation'],
                    ['projects', 'Portfolio Projects'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between text-xs sm:text-sm cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-200">{label}</span>
                    <input
                      type="checkbox"
                      checked={settings.privacy.activityVisibility[key]}
                      onChange={() =>
                        saveSettingsPatch({
                          privacy: {
                            ...settings.privacy,
                            activityVisibility: {
                              ...settings.privacy.activityVisibility,
                              [key]: !settings.privacy.activityVisibility[key],
                            },
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Search & Discovery</p>
                {(
                  [
                    ['searchableByStudents', 'Searchable in Student Directory'],
                    ['studyPartnerDiscovery', 'Include in Study Partner Matching'],
                    ['allowProfileSharing', 'Allow Public Share Link & QR Code'],
                    ['allowMentions', 'Allow @Mentions in Community & Chat'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between text-xs sm:text-sm cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-200">{label}</span>
                    <input
                      type="checkbox"
                      checked={settings.privacy.discovery[key]}
                      onChange={() =>
                        saveSettingsPatch({
                          privacy: {
                            ...settings.privacy,
                            discovery: {
                              ...settings.privacy.discovery,
                              [key]: !settings.privacy.discovery[key],
                            },
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Who Can Send Message Requests (Syncs with Chat)
                </label>
                <select
                  value={settings.privacy.messaging.messageRequestsFrom}
                  onChange={(e) =>
                    saveSettingsPatch({
                      privacy: {
                        ...settings.privacy,
                        messaging: {
                          ...settings.privacy.messaging,
                          messageRequestsFrom: e.target.value as 'Everyone' | 'College Peers' | 'Connections Only',
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Everyone">Everyone on KAMPUS</option>
                  <option value="College Peers">Same College Peers</option>
                  <option value="Connections Only">Study Partners & Connections Only</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Who Can Interact With Posts
                </label>
                <select
                  value={settings.privacy.messaging.postInteractionsFrom}
                  onChange={(e) =>
                    saveSettingsPatch({
                      privacy: {
                        ...settings.privacy,
                        messaging: {
                          ...settings.privacy.messaging,
                          postInteractionsFrom: e.target.value as 'Everyone' | 'KAMPUS Members',
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Everyone">Everyone</option>
                  <option value="KAMPUS Members">Verified KAMPUS Members Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Blocked Users ({settings.privacy.blockedUsers.length})
              </h3>
              {settings.privacy.blockedUsers.length === 0 ? (
                <p className="text-slate-500">You have not blocked any users.</p>
              ) : (
                settings.privacy.blockedUsers.map((u) => (
                  <div key={u.id} className="flex justify-between py-1">
                    <span>{u.name}</span>
                  </div>
                ))
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Muted Users ({settings.privacy.mutedUsers.length})
              </h3>
              {settings.privacy.mutedUsers.length === 0 ? (
                <p className="text-slate-500">You have not muted any users.</p>
              ) : (
                settings.privacy.mutedUsers.map((u) => (
                  <div key={u.id} className="flex justify-between py-1">
                    <span>{u.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SECURITY */}
      {activeSection === 'security' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Active Sessions & Devices ({sessions.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Only real authenticated sessions are listed below.
                </p>
              </div>
              {sessions.some((s) => !s.isCurrent) && (
                <button
                  type="button"
                  onClick={() => revokeSessions({ revokeAllOther: true })}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 text-xs font-semibold cursor-pointer"
                >
                  Sign Out Other Devices
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <MonitorSmartphone className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {s.deviceLabel} · {s.browserLabel}{' '}
                        {s.isCurrent && (
                          <span className="text-emerald-600 font-semibold">(Current Session)</span>
                        )}
                      </p>
                      <p className="text-slate-500 tabular-nums">
                        Last active: {s.lastActiveAt.replace('T', ' ').slice(0, 16)} UTC
                      </p>
                    </div>
                  </div>
                  {!s.isCurrent && (
                    <button
                      type="button"
                      onClick={() => revokeSessions({ sessionId: s.id })}
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-rose-600"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security Audit Log</h3>
            {securityAudit.length === 0 ? (
              <p className="text-xs text-slate-500">
                No security events recorded yet. Password changes, email updates, and session revocations are logged here automatically.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {securityAudit.slice(0, 15).map((ev) => (
                  <div key={ev.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{ev.eventType}</p>
                      <p className="text-slate-500">{ev.description}</p>
                    </div>
                    <span className="text-slate-400 tabular-nums shrink-0">
                      {ev.timestamp.replace('T', ' ').slice(0, 16)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: DANGER ZONE */}
      {activeSection === 'danger' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span>Account Session & Danger Zone</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sign out, temporarily deactivate your account, or submit a verified account deletion request.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Sign Out of This Device</p>
                  <p className="text-xs text-slate-500">End your current active KAMPUS session cleanly.</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold cursor-pointer self-start"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Sign Out From Other Devices</p>
                  <p className="text-xs text-slate-500">Revoke all sessions other than your active browser.</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await revokeSessions({ revokeAllOther: true });
                    setNotice({ type: 'ok', text: 'All other active sessions revoked.' });
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold self-start cursor-pointer"
                >
                  Sign Out Other Devices
                </button>
              </div>

              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {settings.account.status === 'Deactivated' ? 'Reactivate Account' : 'Deactivate Account'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Temporarily hide your profile and pause discovery without erasing data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeactivatePassword('');
                    setDeactivateOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-amber-300 text-amber-700 dark:text-amber-400 text-xs font-semibold self-start cursor-pointer"
                >
                  {settings.account.status === 'Deactivated' ? 'Reactivate Account' : 'Deactivate Temporarily'}
                </button>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-rose-600">Permanent Account Deletion Request</p>
                  <p className="text-xs text-slate-500">
                    {deletionRequest
                      ? `Deletion request ${deletionRequest.id} is currently ${deletionRequest.status}.`
                      : 'Requires multi-step confirmation, re-authentication, and typing DELETE MY ACCOUNT.'}
                  </p>
                </div>
                {deletionRequest ? (
                  <button
                    type="button"
                    onClick={() => submitDeletionRequest({ cancel: true })}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold self-start"
                  >
                    Cancel Deletion Request
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep(1);
                      setDeleteOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold self-start cursor-pointer"
                  >
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SENSITIVE RE-AUTH MODAL */}
      {sensitiveMode && (
        <div
          onClick={() => setSensitiveMode(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSensitiveSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Re-Authenticate & Update</span>
              </h3>
              <button type="button" onClick={() => setSensitiveMode(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {sensitiveMode === 'update-email' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Email Address</label>
                <input
                  type="email"
                  required
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            )}

            {sensitiveMode === 'update-phone' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Phone Number</label>
                <input
                  type="tel"
                  required
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            )}

            {sensitiveMode === 'update-username' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Username</label>
                <input
                  type="text"
                  required
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
            )}

            {sensitiveMode === 'change-password' && (
              <>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">New Password (min 8 chars)</label>
                    <span className={`font-bold ${strength.tone}`}>{strength.label}</span>
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password (Required)
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Enter current password (min 6 characters)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSensitiveMode(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                {saving ? 'Updating...' : 'Confirm & Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MULTI-STEP ACCOUNT DELETION MODAL */}
      {deleteOpen && (
        <div
          onClick={() => setDeleteOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Account Deletion · Step {deleteStep} of 3</span>
              </h3>
              <button type="button" onClick={() => setDeleteOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {deleteStep === 1 && (
              <div className="space-y-3">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Requesting permanent deletion schedules removal of your Student Profile, Settings, Planner records, and Digital Locker documents. We strongly recommend exporting your JSON archive first.
                </p>
                <textarea
                  rows={2}
                  placeholder="Optional: Tell us why you are leaving KAMPUS"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 2 && (
              <div className="space-y-3">
                <p className="text-slate-600 dark:text-slate-300">
                  Re-enter your account password to verify identity ownership.
                </p>
                <input
                  type="password"
                  placeholder="Current password (min 6 chars)"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={deletePassword.length < 6}
                    onClick={() => setDeleteStep(3)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 3 && (
              <div className="space-y-3">
                <p className="text-slate-600 dark:text-slate-300">
                  Type <strong className="font-mono text-rose-600">DELETE MY ACCOUNT</strong> exactly below to submit your deletion request.
                </p>
                <input
                  type="text"
                  placeholder="DELETE MY ACCOUNT"
                  value={deletePhrase}
                  onChange={(e) => setDeletePhrase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={saving || deletePhrase.trim() !== 'DELETE MY ACCOUNT'}
                    onClick={async () => {
                      const res = await submitDeletionRequest({
                        reauthPassword: deletePassword,
                        confirmationPhrase: deletePhrase,
                        reason: deleteReason,
                      });
                      setDeleteOpen(false);
                      setNotice(
                        res.ok
                          ? { type: 'ok', text: 'Account deletion request submitted.' }
                          : { type: 'err', text: res.error || 'Deletion request failed.' }
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold disabled:opacity-50"
                  >
                    Submit Deletion Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEACTIVATE / REACTIVATE ACCOUNT MODAL */}
      {deactivateOpen && (
        <div
          onClick={() => setDeactivateOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await performSensitiveAccountAction({
                currentPassword: deactivatePassword,
                action: 'toggle-deactivate',
              });
              setDeactivateOpen(false);
              setDeactivatePassword('');
              if (res.ok) {
                setNotice({ type: 'ok', text: 'Account status updated.' });
              } else {
                setNotice({ type: 'err', text: res.error || 'Could not update account status.' });
              }
            }}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>
                  {settings.account.status === 'Deactivated' ? 'Reactivate Account' : 'Deactivate Account'}
                </span>
              </h3>
              <button type="button" onClick={() => setDeactivateOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Enter your current password to confirm changing your account status.
            </p>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Current password (min 6 chars)"
              value={deactivatePassword}
              onChange={(e) => setDeactivatePassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeactivateOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
