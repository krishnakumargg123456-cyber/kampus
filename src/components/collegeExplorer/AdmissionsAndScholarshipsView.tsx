import React, { useMemo, useState } from 'react';
import {
  Award,
  BellPlus,
  CheckSquare,
  ExternalLink,
  FileCheck2,
  ListChecks,
  Plus,
  Search,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollegeExplorer } from '../../context/CollegeExplorerContext';
import {
  ALL_SCHOLARSHIP_CATEGORIES,
  ALL_TRACKER_STATUSES,
  formatExplorerDate,
} from '../../data/collegeExplorerData';
import type { TrackerApplicationStatus } from '../../types/collegeExplorer';

interface AdmissionsAndScholarshipsViewProps {
  mode: 'admissions' | 'scholarships';
  onOpenCollegeDetail: (collegeId: string) => void;
}

export const AdmissionsAndScholarshipsView: React.FC<AdmissionsAndScholarshipsViewProps> = ({
  mode,
  onOpenCollegeDetail,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'usr_22b030149';
  const {
    colleges,
    admissions,
    scholarships,
    addToAdmissionTracker,
    updateAdmissionTracker,
    deleteAdmissionTracker,
    uploadAdmissionDoc,
    scheduleDeadlineReminder,
  } = useCollegeExplorer();

  // Admissions Tracker Form State
  const [selectedCollegeId, setSelectedCollegeId] = useState(colleges[0]?.id || '');
  const [courseNameInput, setCourseNameInput] = useState('');
  const [initialStatus, setInitialStatus] = useState<TrackerApplicationStatus>('Interested');
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [newChecklistInput, setNewChecklistInput] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Scholarship Filter State
  const [schQuery, setSchQuery] = useState('');
  const [schCategory, setSchCategory] = useState<string>('all');

  const handleAddTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId) return;
    const ok = await addToAdmissionTracker({
      collegeId: selectedCollegeId,
      courseName: courseNameInput.trim() || undefined,
      status: initialStatus,
    });
    if (ok) setCourseNameInput('');
  };

  const handleFileUpload = async (
    entryId: string,
    existingDocs: Array<{ id: string; fileName: string; url: string; sizeBytes: number }>,
    file?: File
  ) => {
    if (!file) return;
    setUploadingId(entryId);
    const uploaded = await uploadAdmissionDoc(file);
    setUploadingId(null);
    if (uploaded) {
      await updateAdmissionTracker(entryId, {
        documents: [...existingDocs, uploaded],
      });
    }
  };

  const filteredScholarships = useMemo(() => {
    const q = schQuery.trim().toLowerCase();
    return scholarships.filter((s) => {
      if (schCategory !== 'all' && s.category !== schCategory) return false;
      if (!q) return true;
      return `${s.title} ${s.provider} ${s.eligibility} ${s.benefits}`
        .toLowerCase()
        .includes(q);
    });
  }, [scholarships, schQuery, schCategory]);

  if (mode === 'admissions') {
    return (
      <div className="space-y-6">
        {/* Add College to Tracker */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-blue-600" />
              <span>My Admissions & Application Tracker</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track your application stages, document checklists, private file uploads, and Planner reminders
            </p>
          </div>

          <form onSubmit={handleAddTracker} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              aria-label="Select college to track"
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>

            <input
              type="text"
              value={courseNameInput}
              onChange={(e) => setCourseNameInput(e.target.value)}
              placeholder="Target course (optional)..."
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />

            <div className="flex gap-2">
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as TrackerApplicationStatus)}
                aria-label="Initial application status"
                className="flex-1 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {ALL_TRACKER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shrink-0"
              >
                Add
              </button>
            </div>
          </form>
        </section>

        {/* Tracked Applications List */}
        {admissions.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              No admissions currently tracked
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a college above or click &quot;Track Admission&quot; on any institution card to organize your applications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {admissions.map((entry) => {
              const currentNotes =
                notesDraft[entry.id] !== undefined ? notesDraft[entry.id] : entry.notes;
              const newItemText = newChecklistInput[entry.id] || '';
              const completedCount = entry.checklist.filter((c) => c.completed).length;

              return (
                <article
                  key={entry.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenCollegeDetail(entry.collegeId)}
                        className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 text-left"
                      >
                        {entry.collegeName}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Program: {entry.courseName} · Updated {formatExplorerDate(entry.updatedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <select
                        value={entry.status}
                        onChange={(e) =>
                          updateAdmissionTracker(entry.id, {
                            status: e.target.value as TrackerApplicationStatus,
                          })
                        }
                        aria-label="Update application status"
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 font-semibold text-blue-700 dark:text-blue-300"
                      >
                        {ALL_TRACKER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          scheduleDeadlineReminder({
                            title: `Application Follow-up (${entry.status})`,
                            collegeName: entry.collegeName,
                            dateISO:
                              entry.reminderDateISO ||
                              entry.deadlineISO ||
                              new Date().toISOString().slice(0, 10),
                            notes: entry.courseName,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
                      >
                        <BellPlus className="w-3.5 h-3.5 text-orange-500" />
                        <span>Sync Planner Reminder</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteAdmissionTracker(entry.id)}
                        className="px-2.5 py-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Deadlines & Notes */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="space-y-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Application Deadline
                      </span>
                      <input
                        type="date"
                        value={entry.deadlineISO || ''}
                        onChange={(e) =>
                          updateAdmissionTracker(entry.id, { deadlineISO: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
                      />
                    </label>

                    <div className="lg:col-span-2 space-y-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-300 block">
                        Application Notes
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentNotes}
                          onChange={(e) =>
                            setNotesDraft((prev) => ({ ...prev, [entry.id]: e.target.value }))
                          }
                          placeholder="Track portal application ID, counselor notes, or fee receipt status..."
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateAdmissionTracker(entry.id, { notes: currentNotes })
                          }
                          className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Checklist & Document Uploads */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        Requirements Checklist ({completedCount}/{entry.checklist.length})
                      </p>
                      <div className="space-y-1.5">
                        {entry.checklist.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              updateAdmissionTracker(entry.id, {
                                checklist: entry.checklist.map((c) =>
                                  c.id === item.id ? { ...c, completed: !c.completed } : c
                                ),
                              })
                            }
                            className="w-full flex items-center gap-2 text-left py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600"
                          >
                            {item.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={item.completed ? 'line-through text-slate-400' : ''}>
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newItemText}
                          onChange={(e) =>
                            setNewChecklistInput((prev) => ({
                              ...prev,
                              [entry.id]: e.target.value,
                            }))
                          }
                          placeholder="Add checklist item..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newItemText.trim()) return;
                            await updateAdmissionTracker(entry.id, {
                              checklist: [
                                ...entry.checklist,
                                {
                                  id: `chk_${Date.now()}`,
                                  label: newItemText.trim(),
                                  completed: false,
                                },
                              ],
                            });
                            setNewChecklistInput((prev) => ({ ...prev, [entry.id]: '' }));
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                          Private Documents (PDF/PNG/JPG, max 5 MB)
                        </p>
                        <label className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer inline-flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>{uploadingId === entry.id ? 'Uploading...' : 'Upload Doc'}</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => {
                              handleFileUpload(entry.id, entry.documents, e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>

                      {entry.documents.length === 0 ? (
                        <p className="text-slate-400">No documents attached yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {entry.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-2"
                            >
                              <span className="inline-flex items-center gap-1.5 truncate font-medium text-slate-800 dark:text-slate-200">
                                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">{doc.fileName}</span>
                              </span>
                              <a
                                href={`${doc.url}?userId=${encodeURIComponent(currentUserId)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-semibold shrink-0"
                              >
                                Open
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // SCHOLARSHIPS DISCOVERY MODE
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-500" />
              <span>Scholarship & Financial Aid Discovery</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official portals, eligibility criteria, required documents, and transparent last-updated dates
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={schQuery}
              onChange={(e) => setSchQuery(e.target.value)}
              placeholder="Search scholarships or providers..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setSchCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              schCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Categories ({scholarships.length})
          </button>
          {ALL_SCHOLARSHIP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSchCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
                schCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredScholarships.map((sch) => (
          <article
            key={sch.id}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {sch.category} · {sch.provider}
                </span>
                <span className="tabular-nums">{sch.dataVerificationStatus}</span>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {sch.title}
              </h4>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Eligibility:{' '}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">{sch.eligibility}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Benefits:{' '}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">{sch.benefits}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Required Docs:{' '}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {sch.requiredDocuments.join(', ')}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                Deadline: {formatExplorerDate(sch.deadlineISO)} · Updated{' '}
                {formatExplorerDate(sch.lastUpdatedISO)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    scheduleDeadlineReminder({
                      title: `Scholarship Deadline: ${sch.title}`,
                      collegeName: sch.provider,
                      dateISO: sch.deadlineISO,
                      notes: sch.officialSourceUrl,
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
                >
                  <BellPlus className="w-3.5 h-3.5 text-orange-500" />
                  <span>Remind</span>
                </button>
                <a
                  href={sch.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
