import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Bookmark,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FilePlus2,
  Flag,
  Lock,
  MapPin,
  MessageSquare,
  PackageCheck,
  PackageSearch,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCampusPulse } from '../../context/CampusPulseContext';
import {
  containsPrivateContactPattern,
  formatPulseDateTime,
  formatPulseFileSize,
  formatPulseShortDate,
  getPulseCategoryLabel,
  LOST_FOUND_CATEGORIES,
  POLL_PURPOSES,
  PULSE_CATEGORIES,
  SUBMISSION_POST_TYPES,
} from '../../data/campusPulseData';
import type {
  CampusAnnouncement,
  LostFoundCategory,
  LostFoundPost,
  PollPurpose,
  PulseAttachment,
  PulseCategoryId,
  StudentSubmission,
  SubmissionPostType,
} from '../../types/campusPulse';

export const LostFoundView: React.FC<{
  onOpenReport: (target: {
    targetType: 'lost-found';
    targetId: string;
    targetTitle: string;
  }) => void;
}> = ({ onOpenReport }) => {
  const {
    selectedInstitution,
    lostFound,
    currentUserId,
    roleInfo,
    createLostFoundPost,
    updateLostFoundStatus,
    contactPosterInChat,
    uploadAttachment,
  } = useCampusPulse();

  const [typeFilter, setTypeFilter] = useState<'all' | 'Lost Item' | 'Found Item'>('all');
  const [catFilter, setCatFilter] = useState<LostFoundCategory | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailItem, setDetailItem] = useState<LostFoundPost | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [postType, setPostType] = useState<'Lost Item' | 'Found Item'>('Lost Item');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<LostFoundCategory>('ID Cards');
  const [description, setDescription] = useState('');
  const [approximateLocation, setApproximateLocation] = useState('');
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10));
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const instId = selectedInstitution?.id || 'inst_iitb';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lostFound.filter((p) => {
      if (p.institutionId !== instId) return false;
      if (typeFilter !== 'all' && p.postType !== typeFilter) return false;
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (dateFilter && p.dateISO < dateFilter) return false;
      if (!q) return true;
      return (
        p.itemName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.approximateLocation.toLowerCase().includes(q)
      );
    });
  }, [lostFound, instId, typeFilter, catFilter, dateFilter, search]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFormError(null);
    const res = await uploadAttachment(file);
    setUploading(false);
    if (res.error) {
      setFormError(res.error);
    } else if (res.attachment) {
      setImageUrl(res.attachment.url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const combined = `${itemName} ${description} ${approximateLocation}`;
    if (containsPrivateContactPattern(combined)) {
      setFormError(
        'Do not include phone numbers or email addresses for privacy. Peers contact you safely via KAMPUS Chat.'
      );
      return;
    }
    setSubmitting(true);
    const res = await createLostFoundPost({
      institutionId: instId,
      postType,
      itemName,
      category,
      description,
      approximateLocation,
      dateISO,
      imageUrl,
    });
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'Could not publish post.');
      return;
    }
    setItemName('');
    setDescription('');
    setApproximateLocation('');
    setImageUrl(undefined);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Campus Lost & Found
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Report lost or found campus items safely. All peer contact routes through KAMPUS Chat
            without exposing personal phone numbers.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post Lost / Found Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or location..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as 'all' | 'Lost Item' | 'Found Item')
          }
          aria-label="Filter by lost or found"
          className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
        >
          <option value="all">Lost & Found Items</option>
          <option value="Lost Item">Lost Items Only</option>
          <option value="Found Item">Found Items Only</option>
        </select>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as LostFoundCategory | 'all')}
          aria-label="Filter by item category"
          className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
        >
          <option value="all">All Item Categories</option>
          {LOST_FOUND_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter items on or after date"
          className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <PackageSearch className="w-6 h-6 text-slate-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No Lost & Found posts match your filters.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((post) => {
            const canRecover =
              post.posterId === currentUserId || roleInfo.role === 'Institutional Admin';
            return (
              <div
                key={post.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          post.postType === 'Lost Item'
                            ? 'text-[#F97316]'
                            : 'text-[#2563EB]'
                        }`}
                      >
                        {post.postType}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 dark:text-slate-300">{post.category}</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        post.status === 'Recovered'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.itemName}
                      className="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                    />
                  )}

                  <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                    {post.itemName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {post.description}
                  </p>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{post.approximateLocation}</span>
                    </div>
                    <div className="tabular-nums">
                      Date: {formatPulseShortDate(post.dateISO)} · Posted by {post.posterName}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailItem(post)}
                      className="px-3 py-1.5 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Details
                    </button>
                    {post.posterId !== currentUserId && post.status === 'Open' && (
                      <button
                        onClick={() => contactPosterInChat(post)}
                        className="px-3 py-1.5 rounded-lg font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>KAMPUS Chat</span>
                      </button>
                    )}
                    {canRecover && (
                      <button
                        onClick={() =>
                          updateLostFoundStatus(
                            post.id,
                            post.status === 'Open' ? 'Recovered' : 'Open'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>
                          {post.status === 'Open' ? 'Mark Recovered' : 'Reopen'}
                        </span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      onOpenReport({
                        targetType: 'lost-found',
                        targetId: post.id,
                        targetTitle: `${post.postType}: ${post.itemName}`,
                      })
                    }
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"
                    aria-label="Report suspicious post"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-[#2563EB]">
                  {detailItem.postType} · {detailItem.category} · {detailItem.status}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {detailItem.itemName}
                </h3>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {detailItem.imageUrl && (
              <img
                src={detailItem.imageUrl}
                alt={detailItem.itemName}
                className="w-full max-h-60 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
              />
            )}
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {detailItem.description}
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div>Approximate Location: {detailItem.approximateLocation}</div>
              <div>Date: {formatPulseShortDate(detailItem.dateISO)}</div>
              <div>
                Posted by: {detailItem.posterName} ({detailItem.posterDepartment})
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {detailItem.posterId !== currentUserId && detailItem.status === 'Open' && (
                <button
                  onClick={() => {
                    const p = detailItem;
                    setDetailItem(null);
                    contactPosterInChat(p);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact via KAMPUS Chat</span>
                </button>
              )}
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Lost/Found Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl my-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Post Lost or Found Item
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  For safety, never enter phone numbers, emails, or hostel room numbers.
                </p>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {(['Lost Item', 'Found Item'] as const).map((pt) => (
                  <button
                    type="button"
                    key={pt}
                    onClick={() => setPostType(pt)}
                    className={`py-2 rounded-xl font-semibold border ${
                      postType === pt
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold block mb-1">Item Name</label>
                  <input
                    required
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g., Blue Laptop Charger / Student ID"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LostFoundCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  >
                    {LOST_FOUND_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold block mb-1">Approximate Location</label>
                  <input
                    required
                    type="text"
                    value={approximateLocation}
                    onChange={(e) => setApproximateLocation(e.target.value)}
                    placeholder="e.g., LHC Lobby / Central Library 2F"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Date Lost or Found</label>
                  <input
                    required
                    type="date"
                    value={dateISO}
                    onChange={(e) => setDateISO(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe identifying color, marks, or pickup desk..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Optional Photo (Max 5 MB)
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{uploading ? 'Uploading...' : imageUrl ? 'Photo Attached' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagePick}
                    className="hidden"
                  />
                </label>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-4 py-2 rounded-xl font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const CampusPollsView: React.FC = () => {
  const { selectedInstitution, polls, currentUserId, votePoll, createPoll } =
    useCampusPulse();

  const [createOpen, setCreateOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [purpose, setPurpose] = useState<PollPurpose>('Student Preferences');
  const [optionsText, setOptionsText] = useState('Option A\nOption B');
  const [closesAt, setClosesAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [voteErr, setVoteErr] = useState<string | null>(null);

  const instId = selectedInstitution?.id || 'inst_iitb';
  const instPolls = polls.filter((p) => p.institutionId === instId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const opts = optionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await createPoll({
      institutionId: instId,
      question,
      purpose,
      options: opts,
      closesAt: `${closesAt}T23:59:00.000Z`,
      isAnonymous,
    });
    if (res.ok) {
      setQuestion('');
      setCreateOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">Campus Polls</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Share feedback on campus facilities, schedules, and student initiatives. Counts reflect
            actual submitted votes only.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Poll</span>
        </button>
      </div>

      {voteErr && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
          {voteErr}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {instPolls.map((poll) => {
          const totalVotes = poll.options.reduce((acc, o) => acc + o.voteCount, 0);
          const hasVoted = poll.votedUserIds.includes(currentUserId);
          const isClosed = new Date(poll.closesAt).getTime() < Date.now();

          return (
            <div
              key={poll.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-[#2563EB]">{poll.purpose}</span>
                  <span className="tabular-nums">
                    {isClosed ? 'Closed' : `Closes ${formatPulseShortDate(poll.closesAt)}`}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                  {poll.question}
                </h3>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Created by {poll.createdByName} ({poll.createdByRole}) ·{' '}
                  {poll.isAnonymous ? 'Anonymous Voting' : 'Verified Student Vote'}
                </div>
              </div>

              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const pct =
                    totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                  return (
                    <button
                      key={opt.id}
                      disabled={hasVoted || isClosed}
                      onClick={async () => {
                        setVoteErr(null);
                        const r = await votePoll(poll.id, opt.id);
                        if (!r.ok && r.error) setVoteErr(r.error);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-colors relative overflow-hidden ${
                        hasVoted || isClosed
                          ? 'border-slate-200 dark:border-slate-800 cursor-default'
                          : 'border-slate-200 dark:border-slate-700 hover:border-[#2563EB]'
                      }`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-50 dark:bg-blue-950/40 transition-all"
                        style={{ width: `${hasVoted || isClosed ? pct : 0}%` }}
                      />
                      <div className="relative flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {opt.text}
                        </span>
                        <span className="font-bold text-[#2563EB] tabular-nums shrink-0">
                          {opt.voteCount} ({pct}%)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{totalVotes} total votes submitted</span>
                </span>
                {hasVoted && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Vote Recorded</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {createOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Create Campus Poll
              </h3>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Poll Question</label>
                <input
                  required
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a clear campus question..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as PollPurpose)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  >
                    {POLL_PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Closing Date</label>
                  <input
                    type="date"
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">
                  Options (one per line, minimum 2)
                </label>
                <textarea
                  required
                  rows={4}
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="accent-[#2563EB]"
                />
                <span>Configure as anonymous poll</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold"
                >
                  Publish Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentSubmissionsView: React.FC = () => {
  const {
    selectedInstitution,
    departments,
    submissions,
    currentUserId,
    saveSubmission,
    uploadAttachment,
  } = useCampusPulse();

  const instId = selectedInstitution?.id || 'inst_iitb';
  const instDepts = departments.filter((d) => d.institutionId === instId);

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [postType, setPostType] = useState<SubmissionPostType>('Student Update');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<PulseCategoryId>('student-information');
  const [departmentId, setDepartmentId] = useState(instDepts[0]?.id || 'dept_cse');
  const [description, setDescription] = useState('');
  const [supportingInfo, setSupportingInfo] = useState('');
  const [attachments, setAttachments] = useState<PulseAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const mySubmissions = submissions.filter((s) => s.authorId === currentUserId);

  const loadForEdit = (s: StudentSubmission) => {
    setEditingId(s.id);
    setPostType(s.postType);
    setTitle(s.title);
    setCategoryId(s.categoryId);
    setDepartmentId(s.departmentId);
    setDescription(s.description);
    setSupportingInfo(s.supportingInfo);
    setAttachments(s.attachments);
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const res = await uploadAttachment(f);
    if (res.attachment) {
      setAttachments((prev) => [...prev, res.attachment!]);
    }
  };

  const handleSave = async (asDraft: boolean) => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    const res = await saveSubmission({
      id: editingId,
      institutionId: instId,
      postType,
      title,
      categoryId,
      departmentId,
      description,
      supportingInfo,
      attachments,
      saveAsDraft: asDraft,
    });
    setSubmitting(false);
    if (res.ok) {
      setEditingId(undefined);
      setTitle('');
      setDescription('');
      setSupportingInfo('');
      setAttachments([]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
          Student Campus Submissions
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Submit helpful campus updates, facility observations, or suggestions. Approved posts
          always display clearly as Student Submissions and never appear as official circulars.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <FilePlus2 className="w-4 h-4 text-[#2563EB]" />
              <span>{editingId ? 'Edit Submission' : 'New Campus Submission'}</span>
            </div>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(undefined);
                  setTitle('');
                  setDescription('');
                  setSupportingInfo('');
                  setAttachments([]);
                }}
                className="text-xs text-slate-500 hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="font-semibold block mb-1">Post Type</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as SubmissionPostType)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                {SUBMISSION_POST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value as PulseCategoryId)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                {PULSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Relevant Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                {instDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Clear summary of the campus update..."
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide accurate location, timing, and helpful context..."
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">
              Supporting Verification Info
            </label>
            <input
              type="text"
              value={supportingInfo}
              onChange={(e) => setSupportingInfo(e.target.value)}
              placeholder="Where did you observe or confirm this detail?"
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Attach PDF or Image (max 5 MB)</span>
              <input type="file" onChange={handleAttach} className="hidden" />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting || !title.trim() || !description.trim()}
                onClick={() => handleSave(true)}
                className="px-3.5 py-2 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={submitting || !title.trim() || !description.trim()}
                onClick={() => handleSave(false)}
                className="px-4 py-2 rounded-xl font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Moderation</span>
              </button>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-[11px]">
                  <span>
                    {a.fileName} ({formatPulseFileSize(a.sizeBytes)})
                  </span>
                  <button
                    onClick={() =>
                      setAttachments((prev) => prev.filter((x) => x.id !== a.id))
                    }
                    className="text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Submissions Moderation Status List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
              My Submissions ({mySubmissions.length})
            </h3>
            <span className="text-[11px] text-slate-500">Unverified until approved</span>
          </div>

          {mySubmissions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              You have not created any student submissions yet.
            </div>
          ) : (
            mySubmissions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">
                    {s.postType} · {s.departmentName}
                  </span>
                  <span
                    className={`font-bold ${
                      s.moderationStatus === 'Approved'
                        ? 'text-emerald-600'
                        : s.moderationStatus === 'Rejected'
                          ? 'text-red-600'
                          : s.moderationStatus === 'Draft'
                            ? 'text-slate-500'
                            : 'text-[#F97316]'
                    }`}
                  >
                    {s.moderationStatus}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {s.title}
                </div>
                <div className="text-slate-600 dark:text-slate-300 line-clamp-2">
                  {s.description}
                </div>
                {s.moderatorNote && (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300">
                    Moderator Note: {s.moderatorNote}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    Updated {formatPulseDateTime(s.updatedAt)}
                  </span>
                  {(s.moderationStatus === 'Draft' || s.moderationStatus === 'Rejected') && (
                    <button
                      onClick={() => loadForEdit(s)}
                      className="text-[#2563EB] font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const SavedInformationView: React.FC<{
  onOpenNotice: (notice: CampusAnnouncement) => void;
}> = ({ onOpenNotice }) => {
  const {
    announcements,
    deadlines,
    savedNoticeIds,
    savedDeadlineIds,
    readingHistory,
    toggleSavedNotice,
    toggleSavedDeadline,
  } = useCampusPulse();

  const savedNotices = announcements.filter((a) => savedNoticeIds.includes(a.id));
  const savedDeadlines = deadlines.filter((d) => savedDeadlineIds.includes(d.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
          Saved Information & Reading History
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Quickly access bookmarked official notices, saved deadlines synced with KAMPUS Planner,
          and recently opened circulars.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Notices */}
        <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Bookmark className="w-4 h-4 text-[#2563EB]" />
            <span>Saved Notices ({savedNotices.length})</span>
          </div>
          {savedNotices.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No saved notices yet. Bookmark any official circular or campus update to keep it here.
            </p>
          ) : (
            savedNotices.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-start justify-between gap-3"
              >
                <button onClick={() => onOpenNotice(n)} className="text-left min-w-0">
                  <div className="text-[11px] text-slate-500">
                    {getPulseCategoryLabel(n.categoryId)} · {formatPulseShortDate(n.publishedAt)}
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {n.title}
                  </div>
                </button>
                <button
                  onClick={() => toggleSavedNotice(n.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 shrink-0"
                  aria-label="Remove saved notice"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </section>

        {/* Saved Deadlines */}
        <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Clock className="w-4 h-4 text-[#F97316]" />
            <span>Saved Deadlines ({savedDeadlines.length})</span>
          </div>
          {savedDeadlines.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No saved deadlines yet. Save items in the Academic Calendar to sync with KAMPUS
              Planner.
            </p>
          ) : (
            savedDeadlines.map((dl) => (
              <div
                key={dl.id}
                className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="text-[11px] text-[#2563EB] font-semibold tabular-nums">
                    {formatPulseShortDate(dl.dateISO)}
                    {dl.timeLabel ? ` · ${dl.timeLabel}` : ''}
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {dl.title}
                  </div>
                  <div className="text-[11px] text-slate-500">{dl.departmentName}</div>
                </div>
                <button
                  onClick={() => toggleSavedDeadline(dl)}
                  className="p-1.5 text-slate-400 hover:text-red-600 shrink-0"
                  aria-label="Remove saved deadline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Recently Viewed & Reading History */}
      <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Eye className="w-4 h-4 text-[#2563EB]" />
          <span>Recently Viewed & Reading History ({readingHistory.length})</span>
        </div>
        {readingHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            Notices you open will appear here for quick follow-up reference.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {readingHistory.map((h) => {
              const target = announcements.find((a) => a.id === h.announcementId);
              return (
                <button
                  key={`${h.announcementId}_${h.viewedAt}`}
                  disabled={!target}
                  onClick={() => target && onOpenNotice(target)}
                  className="text-left p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-[#2563EB]"
                >
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {getPulseCategoryLabel(h.categoryId)} · Opened {formatPulseDateTime(h.viewedAt)}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5 line-clamp-1">
                    {h.title}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
