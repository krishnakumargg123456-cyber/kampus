import React, { useMemo, useState } from 'react';
import {
  BellPlus,
  BookmarkCheck,
  Check,
  Copy,
  FolderPlus,
  GitCompare,
  History,
  Plus,
  Save,
  Share2,
  Trash2,
} from 'lucide-react';
import { useCollegeExplorer } from '../../context/CollegeExplorerContext';
import {
  formatExplorerDate,
  resolveCollegePhoto,
} from '../../data/collegeExplorerData';
import type { CollegeRecord } from '../../types/collegeExplorer';

interface CollegeCompareAndShortlistViewProps {
  mode: 'compare' | 'shortlist';
  sharedBanner?: { title: string; shareCode: string } | null;
  onDismissSharedBanner?: () => void;
  onOpenCollegeDetail: (collegeId: string) => void;
  onSwitchToCompare: () => void;
}

export const CollegeCompareAndShortlistView: React.FC<CollegeCompareAndShortlistViewProps> = ({
  mode,
  sharedBanner,
  onDismissSharedBanner,
  onOpenCollegeDetail,
  onSwitchToCompare,
}) => {
  const {
    colleges,
    compareIds,
    comparisonHistory,
    collections,
    savedColleges,
    toggleCompareCollege,
    setCompareCollegeIds,
    saveComparison,
    createCollection,
    saveOrUpdateShortlist,
    scheduleDeadlineReminder,
    showToast,
  } = useCollegeExplorer();

  // Compare State
  const [highlightDiffs, setHighlightDiffs] = useState(true);
  const [compareTitle, setCompareTitle] = useState('');
  const [addCompareId, setAddCompareId] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Shortlist State
  const [activeCollection, setActiveCollection] = useState<string>('ALL');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [reminderDrafts, setReminderDrafts] = useState<Record<string, string>>({});

  const comparedColleges = useMemo(
    () =>
      compareIds
        .map((id) => colleges.find((c) => c.id === id))
        .filter((c): c is CollegeRecord => Boolean(c)),
    [compareIds, colleges]
  );

  const availableToAddCompare = useMemo(
    () => colleges.filter((c) => !compareIds.includes(c.id)),
    [colleges, compareIds]
  );

  const handleSaveComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await saveComparison(compareTitle.trim() || undefined);
    if (created) {
      setCompareTitle('');
    }
  };

  const copyShareUrl = async (shareCode: string) => {
    const url = `${window.location.origin}/#/campus/college-explorer?cmp=${shareCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(shareCode);
      showToast('success', 'Shareable comparison link copied to clipboard.');
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      showToast('info', `Share link: ${url}`);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    const ok = await createCollection(newCollectionName.trim());
    if (ok) {
      setActiveCollection(newCollectionName.trim());
      setNewCollectionName('');
    }
  };

  const filteredShortlist = useMemo(() => {
    return savedColleges
      .filter((s) => activeCollection === 'ALL' || s.collectionName === activeCollection)
      .map((entry) => ({
        entry,
        college: colleges.find((c) => c.id === entry.collegeId),
      }))
      .filter((item): item is { entry: typeof item.entry; college: CollegeRecord } =>
        Boolean(item.college)
      );
  }, [savedColleges, activeCollection, colleges]);

  if (mode === 'compare') {
    const rows: Array<{ label: string; getVal: (c: CollegeRecord) => string }> = [
      { label: 'Institution Category', getVal: (c) => c.primaryCategory },
      { label: 'Location', getVal: (c) => `${c.city}, ${c.state}` },
      { label: 'Affiliated University', getVal: (c) => c.affiliatedUniversity },
      { label: 'Accreditation', getVal: (c) => c.accreditation },
      {
        label: 'Courses Offered',
        getVal: (c) => c.courses.map((cr) => cr.degreeShort).join(', ') || 'Check official portal',
      },
      {
        label: 'Entrance Exams',
        getVal: (c) => c.entranceExams.join(', ') || 'Check portal',
      },
      { label: 'Admission Status', getVal: (c) => c.admissionStatus },
      {
        label: 'Next Published Target Date',
        getVal: (c) => (c.nextDeadlineISO ? formatExplorerDate(c.nextDeadlineISO) : 'Check official portal'),
      },
      {
        label: 'Annual Tuition Fee Range',
        getVal: (c) => c.feeInfo.tuitionRangeLabel,
      },
      { label: 'Hostel Facility', getVal: (c) => (c.facilities.hostel ? `Yes (${c.feeInfo.hostelFeeLabel})` : 'Not listed') },
      {
        label: 'Scholarship Support',
        getVal: (c) => (c.scholarshipAvailable ? 'Yes — verify scheme eligibility' : 'Check aid office'),
      },
      {
        label: 'Published Avg Package',
        getVal: (c) => c.placementInfo.averagePackageLabel || 'Not published in record',
      },
      {
        label: 'Data Provenance',
        getVal: (c) => `${c.dataVerificationStatus} (${c.dataSourceLabel})`,
      },
    ];

    return (
      <div className="space-y-6">
        {sharedBanner && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-blue-800 dark:text-blue-200">
                Loaded Shared Comparison: {sharedBanner.title}
              </span>
              <span className="text-blue-600 dark:text-blue-300 ml-2 font-mono">
                ({sharedBanner.shareCode})
              </span>
            </div>
            {onDismissSharedBanner && (
              <button
                type="button"
                onClick={onDismissSharedBanner}
                className="font-semibold text-blue-700 dark:text-blue-300 hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Controls Bar */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-blue-600" />
                <span>Side-by-Side College Comparison ({comparedColleges.length} / 4)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compare up to 4 institutions honestly without fabricated missing metrics
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highlightDiffs}
                  onChange={(e) => setHighlightDiffs(e.target.checked)}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Highlight Differences
                </span>
              </label>

              {compareIds.length < 4 && availableToAddCompare.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={addCompareId}
                    onChange={(e) => setAddCompareId(e.target.value)}
                    aria-label="Add college to comparison"
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">+ Add institution...</option>
                    {availableToAddCompare.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.shortName} — {c.city}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!addCompareId}
                    onClick={() => {
                      if (addCompareId) {
                        toggleCompareCollege(addCompareId);
                        setAddCompareId('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 disabled:opacity-40 text-white font-semibold"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSaveComparison}
            className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2 text-xs"
          >
            <input
              type="text"
              value={compareTitle}
              onChange={(e) => setCompareTitle(e.target.value)}
              placeholder="Optional title (e.g., Engineering Shortlist — Mumbai vs Pune)..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              disabled={comparedColleges.length < 2}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-40 font-semibold inline-flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Generate Share Link</span>
            </button>
          </form>
        </section>

        {/* Matrix Table */}
        {comparedColleges.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Your comparison tray is empty
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select up to 4 colleges from Dashboard or Explore Colleges to compare side by side.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 w-48">
                    Comparison Dimension
                  </th>
                  {comparedColleges.map((col) => (
                    <th key={col.id} className="p-4 min-w-[220px] align-top">
                      <div className="space-y-2">
                        <img
                          src={resolveCollegePhoto(col.photoKey)}
                          alt={col.name}
                          className="w-full h-24 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => onOpenCollegeDetail(col.id)}
                          className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 text-left block"
                        >
                          {col.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCompareCollege(col.id)}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => {
                  const vals = comparedColleges.map((c) => row.getVal(c));
                  const hasDiff = vals.length > 1 && new Set(vals).size > 1;
                  return (
                    <tr
                      key={row.label}
                      className={
                        highlightDiffs && hasDiff
                          ? 'bg-orange-50/40 dark:bg-orange-950/15'
                          : undefined
                      }
                    >
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-300 align-top">
                        <span>{row.label}</span>
                        {highlightDiffs && hasDiff && (
                          <span className="block text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                            Differs
                          </span>
                        )}
                      </td>
                      {comparedColleges.map((col, idx) => (
                        <td
                          key={col.id}
                          className="p-4 text-slate-800 dark:text-slate-200 align-top tabular-nums"
                        >
                          {vals[idx]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Saved Comparison History */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <History className="w-4 h-4 text-blue-600" />
            <span>Saved Comparison History ({comparisonHistory.length})</span>
          </h4>
          {comparisonHistory.length === 0 ? (
            <p className="text-xs text-slate-500">
              No saved comparisons yet. Save any comparison above to generate a shareable link and history record.
            </p>
          ) : (
            <div className="space-y-2">
              {comparisonHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {item.collegeIds.length} colleges · Saved {formatExplorerDate(item.createdAt)} · Code: {item.shareCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCompareCollegeIds(item.collegeIds);
                        showToast('info', `Loaded "${item.title}" into comparison table.`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      Load Comparison
                    </button>
                    <button
                      type="button"
                      onClick={() => copyShareUrl(item.shareCode)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold inline-flex items-center gap-1"
                    >
                      {copiedCode === item.shareCode ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode === item.shareCode ? 'Copied' : 'Copy Share Link'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // SHORTLIST MODE
  return (
    <div className="space-y-6">
      {/* Collections Bar + Create Custom Collection */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-blue-600" />
              <span>My College Shortlist & Custom Collections</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organize colleges into lists, keep research notes, and set application reminders
            </p>
          </div>

          <form onSubmit={handleCreateCollection} className="flex items-center gap-2 text-xs">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="New list name..."
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold inline-flex items-center gap-1"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create List</span>
            </button>
          </form>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveCollection('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
              activeCollection === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Saved ({savedColleges.length})
          </button>
          {collections.map((col) => {
            const cnt = savedColleges.filter((s) => s.collectionName === col.name).length;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setActiveCollection(col.name)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
                  activeCollection === col.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {col.name} ({cnt})
              </button>
            );
          })}
        </div>
      </section>

      {/* Saved Items */}
      {filteredShortlist.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No colleges in this shortlist collection yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click &quot;Save&quot; on any college across the dashboard or Explore tab to add it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShortlist.map(({ entry, college }) => {
            const noteVal =
              noteDrafts[college.id] !== undefined ? noteDrafts[college.id] : entry.personalNote;
            const reminderVal =
              reminderDrafts[college.id] !== undefined
                ? reminderDrafts[college.id]
                : entry.reminderDateISO || college.nextDeadlineISO || '';
            const compared = compareIds.includes(college.id);

            return (
              <article
                key={college.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {entry.collectionName}
                      </span>
                      <span>·</span>
                      <span>
                        {college.city}, {college.state}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenCollegeDetail(college.id)}
                      className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 text-left mt-0.5"
                    >
                      {college.name}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select
                      value={entry.collectionName}
                      onChange={(e) =>
                        saveOrUpdateShortlist({
                          collegeId: college.id,
                          action: 'save',
                          collectionName: e.target.value,
                        })
                      }
                      aria-label="Move shortlist list"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      {collections.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        if (!compared) toggleCompareCollege(college.id);
                        onSwitchToCompare();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
                    >
                      <GitCompare className="w-3.5 h-3.5 text-blue-600" />
                      <span>{compared ? 'View Compare' : 'Quick Compare'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        saveOrUpdateShortlist({ collegeId: college.id, action: 'remove' })
                      }
                      className="px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 inline-flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                  <div className="lg:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block">
                      Personal Notes
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteVal}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({ ...prev, [college.id]: e.target.value }))
                        }
                        placeholder="Add cutoff target, scholarship note, or pros/cons..."
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          saveOrUpdateShortlist({
                            collegeId: college.id,
                            action: 'save',
                            personalNote: noteVal,
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block">
                      Deadline Alert Date
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={reminderVal}
                        onChange={(e) =>
                          setReminderDrafts((prev) => ({
                            ...prev,
                            [college.id]: e.target.value,
                          }))
                        }
                        className="flex-1 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const targetDate = reminderVal || new Date().toISOString().slice(0, 10);
                          await saveOrUpdateShortlist({
                            collegeId: college.id,
                            action: 'save',
                            reminderDateISO: targetDate,
                          });
                          scheduleDeadlineReminder({
                            title: 'Shortlist Application Alert',
                            collegeName: college.name,
                            dateISO: targetDate,
                            notes: noteVal || undefined,
                          });
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-semibold inline-flex items-center gap-1"
                      >
                        <BellPlus className="w-3.5 h-3.5 text-orange-500" />
                        <span>Alert</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
