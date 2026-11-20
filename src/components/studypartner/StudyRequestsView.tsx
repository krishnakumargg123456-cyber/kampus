import React, { useState } from 'react';
import {
  Check,
  Clock,
  Inbox,
  Send,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useStudyPartner } from '../../context/StudyPartnerContext';

type RequestSubTab = 'received' | 'sent' | 'accepted' | 'declined';

export const StudyRequestsView: React.FC = () => {
  const {
    state,
    acceptStudyRequest,
    declineStudyRequest,
    cancelSentRequest,
    setSelectedPeerId,
    setActiveTab,
  } = useStudyPartner();

  const [subTab, setSubTab] = useState<RequestSubTab>('received');

  const received = state.requests.filter(
    (r) => r.direction === 'received' && r.status === 'pending'
  );
  const sent = state.requests.filter(
    (r) => r.direction === 'sent' && r.status === 'pending'
  );
  const accepted = state.requests.filter((r) => r.status === 'accepted');
  const declined = state.requests.filter((r) => r.status === 'declined');

  const list =
    subTab === 'received'
      ? received
      : subTab === 'sent'
      ? sent
      : subTab === 'accepted'
      ? accepted
      : declined;

  const subTabs: Array<{ id: RequestSubTab; label: string; count: number }> = [
    { id: 'received', label: 'Received Requests', count: received.length },
    { id: 'sent', label: 'Sent Requests', count: sent.length },
    { id: 'accepted', label: 'Accepted', count: accepted.length },
    { id: 'declined', label: 'Declined', count: declined.length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {subTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              subTab === t.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{t.label}</span>
            <span className="tabular-nums opacity-80">({t.count})</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5">
          <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            No {subTab} study requests
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Browse compatible peers in Find Partners to send a personalized study collaboration invitation.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className="mt-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
          >
            Find Study Partners
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((req) => {
            const peer = state.peers.find((p) => p.id === req.peerId);
            if (!peer) return null;

            return (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={peer.avatarUrl}
                        alt={peer.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {peer.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {peer.course} · {peer.semester}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {peer.college} · {req.dateLabel}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                        req.status === 'accepted'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : req.status === 'declined'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      {req.status === 'pending'
                        ? req.direction === 'sent'
                          ? 'Pending Reply'
                          : 'Awaiting Action'
                        : req.status}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    &ldquo;{req.message}&rdquo;
                  </p>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Shared Interests:{' '}
                    </span>
                    {req.sharedInterests.join(' · ')}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPeerId(peer.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    View Profile
                  </button>

                  {req.direction === 'received' && req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => declineStudyRequest(req.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => acceptStudyRequest(req.id)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                    </div>
                  )}

                  {req.direction === 'sent' && req.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => cancelSentRequest(req.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Request</span>
                    </button>
                  )}

                  {req.status === 'accepted' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Connected Partner</span>
                    </span>
                  )}

                  {req.status === 'declined' && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Closed</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
