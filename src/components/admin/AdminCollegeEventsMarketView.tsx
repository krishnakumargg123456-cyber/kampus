import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminCard, AdminFeedbackBanner, StatusLabel } from './AdminShared';

export const AdminCollegeEventsMarketView: React.FC<{ mode: 'colleges' | 'events' | 'marketplace' }> = ({ mode }) => {
  const { adminFetch, hasPermission } = useAdminAuth();

  // Colleges
  const [colleges, setColleges] = useState<any[]>([]);
  const [colName, setColName] = useState('');
  const [colCity, setColCity] = useState('');
  const [colWebsite, setColWebsite] = useState('');
  const [colFeeNote, setColFeeNote] = useState('Unverified / Refer to official website');
  const [colVerified, setColVerified] = useState(false);

  // Events & Clubs
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [evTitle, setEvTitle] = useState('');
  const [evVenue, setEvVenue] = useState('Main Auditorium');

  // Marketplace
  const [listings, setListings] = useState<any[]>([]);
  const [marketRules, setMarketRules] = useState({
    maxActiveListingsPerStudent: 8,
    requireCollegeVerification: true,
    prohibitedKeywords: [] as string[],
    escrowGuidance: '',
  });

  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (mode === 'colleges') {
      adminFetch<any>('/api/admin/colleges')
        .then((d) => setColleges(d.colleges || []))
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    } else if (mode === 'events') {
      adminFetch<any>('/api/admin/events-clubs')
        .then((d) => {
          setEvents(d.events || []);
          setClubs(d.clubs || []);
        })
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    } else {
      adminFetch<any>('/api/admin/market')
        .then((d) => {
          setListings(d.listings || []);
          if (d.rules) setMarketRules(d.rules);
        })
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    }
  }, [mode, adminFetch]);

  const addCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) return;
    try {
      const res = await adminFetch<any>('/api/admin/colleges', {
        method: 'POST',
        body: JSON.stringify({
          name: colName,
          city: colCity,
          website: colWebsite,
          feeNote: colFeeNote,
          verified: colVerified,
        }),
      });
      setColleges(res.colleges);
      setColName('');
      setColCity('');
      setColWebsite('');
      setNotice({ kind: 'success', message: 'Institution record saved.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to save college.' });
    }
  };

  const deleteCollege = async (id: string) => {
    try {
      const res = await adminFetch<any>(`/api/admin/colleges/${id}`, { method: 'DELETE' });
      setColleges(res.colleges);
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Delete failed.' });
    }
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    try {
      const res = await adminFetch<any>('/api/admin/events-clubs/create-event', {
        method: 'POST',
        body: JSON.stringify({ title: evTitle, venue: evVenue, status: 'Published' }),
      });
      setEvents(res.events);
      setEvTitle('');
      setNotice({ kind: 'success', message: 'Campus event created and published.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Event creation failed.' });
    }
  };

  const updateEventStatus = async (id: string, status: string) => {
    try {
      const res = await adminFetch<any>('/api/admin/events-clubs/update-event-status', {
        method: 'POST',
        body: JSON.stringify({ id, status }),
      });
      setEvents(res.events);
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed.' });
    }
  };

  const moderateListing = async (id: string, action: 'approve' | 'flag' | 'remove') => {
    try {
      const res = await adminFetch<any>('/api/admin/market/action', {
        method: 'POST',
        body: JSON.stringify({ id, action }),
      });
      setListings(res.listings);
      setNotice({ kind: 'success', message: `Listing updated (${action}).` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Moderation failed.' });
    }
  };

  const saveMarketRules = async () => {
    try {
      const res = await adminFetch<any>('/api/admin/market/rules', {
        method: 'PUT',
        body: JSON.stringify(marketRules),
      });
      setMarketRules(res.rules);
      setNotice({ kind: 'success', message: 'Marketplace policy saved.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed.' });
    }
  };

  if (mode === 'colleges') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            College Directory Management
          </h1>
          <p className="text-xs text-slate-500">
            Verify institutional records explicitly and clearly label unverified fee or cutoff notes.
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        {hasPermission('create') && (
          <AdminCard title="Add Institution Record">
            <form onSubmit={addCollege} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">City</label>
                <input
                  type="text"
                  value={colCity}
                  onChange={(e) => setColCity(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Official Website</label>
                <input
                  type="text"
                  value={colWebsite}
                  onChange={(e) => setColWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add College
              </button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={colVerified}
                  onChange={(e) => setColVerified(e.target.checked)}
                />
                Source Verified Record
              </label>
              <input
                type="text"
                value={colFeeNote}
                onChange={(e) => setColFeeNote(e.target.value)}
                className="flex-1 min-w-[240px] px-3 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </AdminCard>
        )}

        <AdminCard title={`Indexed Institutions (${colleges.length})`}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto">
            {colleges.map((c) => (
              <div key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {c.city} {c.state} · {c.feeNote || 'Refer to official portal'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusLabel status={c.verificationStatus === 'Verified' ? 'Verified' : 'Unverified'} />
                  {hasPermission('delete') && (
                    <button
                      type="button"
                      onClick={() => deleteCollege(c.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    );
  }

  if (mode === 'events') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Events & Clubs Management
          </h1>
          <p className="text-xs text-slate-500">
            Publish official campus events, moderate student club listings, and manage registration availability.
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        {hasPermission('create') && (
          <AdminCard title="Publish New Campus Event">
            <form onSubmit={createEvent} className="flex flex-wrap gap-3">
              <input
                type="text"
                required
                placeholder="Event Title"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="Venue"
                value={evVenue}
                onChange={(e) => setEvVenue(e.target.value)}
                className="w-48 px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Publish Event
              </button>
            </form>
          </AdminCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard title={`Campus Events (${events.length})`}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {events.map((ev) => (
                <div key={ev.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold">{ev.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {ev.venue} · {ev.dateISO}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusLabel status={ev.status || 'Published'} />
                    <button
                      type="button"
                      onClick={() =>
                        updateEventStatus(ev.id, ev.status === 'Cancelled' ? 'Published' : 'Cancelled')
                      }
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      {ev.status === 'Cancelled' ? 'Reopen' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title={`Registered Student Clubs (${clubs.length})`}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {clubs.map((cl) => (
                <div key={cl.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold">{cl.name}</div>
                    <div className="text-[11px] text-slate-500">{cl.category}</div>
                  </div>
                  <StatusLabel status={cl.status || 'Active'} />
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Marketplace Governance & Listings
          </h1>
          <p className="text-xs text-slate-500">
            Moderate student marketplace listings, enforce listing caps, and review flagged items.
          </p>
        </div>
        <button
          type="button"
          onClick={saveMarketRules}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          <Save className="w-3.5 h-3.5" />
          Save Policy Rules
        </button>
      </div>

      <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

      <AdminCard title="Marketplace Policy Rules">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Max Active Listings Per Student</label>
            <input
              type="number"
              value={marketRules.maxActiveListingsPerStudent}
              onChange={(e) =>
                setMarketRules({ ...marketRules, maxActiveListingsPerStudent: Number(e.target.value) })
              }
              className="w-full px-3 py-1.5 font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-semibold">
            <span>Require Verified Campus Profile</span>
            <input
              type="checkbox"
              checked={marketRules.requireCollegeVerification}
              onChange={(e) =>
                setMarketRules({ ...marketRules, requireCollegeVerification: e.target.checked })
              }
            />
          </label>
        </div>
      </AdminCard>

      <AdminCard title={`Marketplace Listings (${listings.length})`}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
          {listings.map((lst) => (
            <div key={lst.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold">{lst.title}</div>
                <div className="text-[11px] text-slate-500">
                  {lst.category} · ₹{lst.price} · Seller: {lst.sellerName || 'Student'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusLabel status={lst.status || 'Available'} />
                {hasPermission('approve') && (
                  <>
                    <button
                      type="button"
                      onClick={() => moderateListing(lst.id, 'approve')}
                      className="px-2 py-1 rounded border border-emerald-200 text-emerald-700 font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateListing(lst.id, 'remove')}
                      className="px-2 py-1 rounded border border-red-200 text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
};
