import React, { useState } from 'react';
import {
  ChevronRight,
  FileText,
  Lock,
  Megaphone,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { ANNOUNCEMENT_CATEGORIES, formatRelativeTimestamp } from '../../data/notificationsData';
import type {
  AnnouncementAudienceType,
  AnnouncementCategory,
} from '../../types/notifications';

interface Props {
  mode: 'announcements' | 'admin';
}

export const AnnouncementsAndAdminView: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const {
    announcements,
    roleInfo,
    switchRoleSession,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    engageAnnouncement,
  } = useNotifications();

  const [catFilter, setCatFilter] = useState<'All' | AnnouncementCategory>('All');

  // Role auth state
  const [passkey, setPasskey] = useState('');
  const [roleError, setRoleError] = useState<string | null>(null);

  // Admin Create Announcement Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('KAMPUS');
  const [targetAudience, setTargetAudience] = useState<AnnouncementAudienceType>('All Students');
  const [targetValue, setTargetValue] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [linkRoute, setLinkRoute] = useState('/account/notifications');
  const [scheduledFor, setScheduledFor] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (mode === 'announcements') {
    const published = announcements.filter(
      (a) => a.status === 'Published' && (catFilter === 'All' || a.category === catFilter)
    );

    return (
      <div className="space-y-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <span>Official Announcements</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Verified KAMPUS, college, club, academic, and system announcements published exclusively by authorized publishers.
            </p>
          </div>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as 'All' | AnnouncementCategory)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Categories</option>
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {published.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center">
            <Megaphone className="w-9 h-9 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No official announcements published yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Official notices from authorized campus publishers and KAMPUS administrators appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {published.map((ann) => (
              <div
                key={ann.id}
                onMouseEnter={() => engageAnnouncement(ann.id, 'read')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Official {ann.category} Announcement</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-slate-500 dark:text-slate-400">{ann.targetAudience}</span>
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {formatRelativeTimestamp(ann.createdAt)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">{ann.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{ann.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    Published by <strong className="text-slate-800 dark:text-slate-200">{ann.publisherName}</strong> ({ann.publisherRole})
                  </div>
                  <div className="flex items-center gap-3">
                    {ann.attachmentName && (
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <FileText className="w-3.5 h-3.5" />
                        {ann.attachmentName}
                      </span>
                    )}
                    {ann.linkRoute && (
                      <button
                        onClick={async () => {
                          await engageAnnouncement(ann.id, 'click');
                          navigate(ann.linkRoute!);
                        }}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        <span>View Related</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ADMIN ANNOUNCEMENT CONSOLE
  const isAdmin = roleInfo.role === 'Publisher Admin';

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError(null);
    const res = await switchRoleSession(passkey.trim(), false);
    if (!res.ok) {
      setRoleError(res.error || 'Authorization denied.');
    } else {
      setPasskey('');
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const res = await createAnnouncement({
      title: title.trim(),
      description: description.trim(),
      category,
      targetAudience,
      targetValue: targetValue.trim() || undefined,
      attachmentName: attachmentName.trim() || undefined,
      linkRoute: linkRoute.trim() || '/account/notifications',
      scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    });
    if (!res.ok) {
      setFormError(res.error || 'Could not publish announcement.');
      return;
    }
    setTitle('');
    setDescription('');
    setTargetValue('');
    setAttachmentName('');
    setScheduledFor('');
  };

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-xl space-y-4">
        <div className="flex items-center gap-2.5 text-blue-950 dark:text-white">
          <Lock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold">Authorized Publisher Console</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Official KAMPUS, college, club, and system announcements are role-protected so unauthorized accounts cannot broadcast official notices.
        </p>
        <form onSubmit={handleUnlockAdmin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Publisher Authorization Passkey
            </label>
            <input
              type="password"
              required
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Enter authorized publisher passkey..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Authorized staff/publisher demo passkey: <span className="font-mono">KAMPUS_PUBLISHER_2026</span>
            </p>
          </div>
          {roleError && <p className="text-xs text-rose-600 font-semibold">{roleError}</p>}
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            Verify Publisher Role
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Authorized Role: {roleInfo.label || 'Publisher Admin'}
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Admin Announcement & Targeting Console
          </h2>
        </div>
        <button
          onClick={() => switchRoleSession(undefined, true)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          Return to Student View
        </button>
      </div>

      {/* Create / Schedule Official Announcement */}
      <form
        onSubmit={handlePublish}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Publish or Schedule Official Announcement
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Semester Examination Schedule Published"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            >
              {ANNOUNCEMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Target Audience</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as AnnouncementAudienceType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            >
              <option value="All Students">All Students</option>
              <option value="Selected Colleges">Selected Colleges</option>
              <option value="Selected Courses">Selected Courses</option>
              <option value="Selected Groups">Selected Groups</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Target Filter Value (Optional)
            </label>
            <input
              type="text"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="e.g., IIT Bombay or Computer Science"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Schedule Date/Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Attachment Label (Optional)
            </label>
            <input
              type="text"
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="e.g., Exam_Circular_2026.pdf"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Related Route</label>
            <input
              type="text"
              value={linkRoute}
              onChange={(e) => setLinkRoute(e.target.value)}
              placeholder="/tools/planner"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Description *</label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write clear official guidance..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
        </div>
        {formError && <p className="text-xs text-rose-600 font-semibold">{formError}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>{scheduledFor ? 'Schedule Announcement' : 'Publish Official Announcement'}</span>
          </button>
        </div>
      </form>

      {/* Managed Announcements & Genuine Engagement Analytics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Published & Scheduled Announcements ({announcements.length})
        </h3>
        {announcements.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">No announcements created yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{ann.status}</span>
                    <span>·</span>
                    <span>{ann.category}</span>
                    <span>·</span>
                    <span>{ann.targetAudience}{ann.targetValue ? ` (${ann.targetValue})` : ''}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{ann.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Genuine Engagement: {ann.readByUserIds.length} read(s) · {ann.clickedByUserIds.length} click(s)
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ann.status !== 'Published' && (
                    <button
                      onClick={() => updateAnnouncement(ann.id, { status: 'Published' })}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      Publish Now
                    </button>
                  )}
                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
