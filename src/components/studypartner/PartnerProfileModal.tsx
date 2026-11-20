import React, { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Flag,
  MessageSquare,
  Send,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudyPartner } from '../../context/StudyPartnerContext';

export const PartnerProfileModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    selectedPeerProfile,
    setSelectedPeerId,
    getMatchForPeer,
    canSendRequestToPeer,
    sendStudyRequest,
    invitePartnerToGroup,
    blockUser,
    reportSafetyIssue,
    prepareChatHandoff,
    showToast,
  } = useStudyPartner();

  const [personalMessage, setPersonalMessage] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(
    state.groups[0]?.id || ''
  );
  const [showInvitePicker, setShowInvitePicker] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('Spam or unsolicited messages');
  const [reportDetails, setReportDetails] = useState('');
  const [confirmBlock, setConfirmBlock] = useState(false);

  if (!selectedPeerProfile) return null;

  const isConnected = state.connectedPartnerIds.includes(
    selectedPeerProfile.id
  );
  const match = getMatchForPeer(selectedPeerProfile);
  const perm = canSendRequestToPeer(selectedPeerProfile);

  const handleSendRequest = () => {
    sendStudyRequest(
      selectedPeerProfile.id,
      personalMessage ||
        `Hi ${(selectedPeerProfile?.name || 'Student').trim().split(/\s+/)[0]}, I'd love to collaborate on ${match.commonSubjects[0] || selectedPeerProfile.subjects[0]}.`
    );
    setPersonalMessage('');
  };

  const handleStartChat = () => {
    if (!isConnected) {
      showToast(
        'Connect as Study Partners first before opening direct chat.',
        'warning'
      );
      return;
    }
    prepareChatHandoff(
      selectedPeerProfile.name,
      selectedPeerProfile.avatarUrl,
      `Connected Study Partner Â· ${selectedPeerProfile.subjects.slice(0, 2).join(', ')}`,
      false
    );
    setSelectedPeerId(null);
    navigate('/connect/chat');
  };

  const handleInviteGroup = () => {
    if (!selectedGroupId) return;
    invitePartnerToGroup(selectedGroupId, selectedPeerProfile.id);
    setShowInvitePicker(false);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    reportSafetyIssue(
      'profile',
      selectedPeerProfile.id,
      selectedPeerProfile.name,
      reportReason,
      reportDetails || 'Reported from Study Partner profile view'
    );
    setShowReportForm(false);
    setReportDetails('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-profile-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-900">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={selectedPeerProfile.avatarUrl}
              alt={selectedPeerProfile.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
            />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="partner-profile-title"
                  className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100"
                >
                  {selectedPeerProfile.name}
                </h2>
                {isConnected && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected Partner
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {selectedPeerProfile.course} Â· {selectedPeerProfile.semester}
              </p>
              <p className="text-xs text-slate-400">
                {selectedPeerProfile.college} Â· {selectedPeerProfile.lastActiveLabel}
                {selectedPeerProfile.isDemoProfile ? ' Â· Demo Student Profile' : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPeerId(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Profile Details */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Privacy Assurance Banner */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Private email, phone number, and address are hidden by KAMPUS privacy rules. Direct chat unlocks only after mutual connection.
            </span>
          </div>

          {/* Match Reasons */}
          {match.hasEnoughData && match.score !== null && (
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-blue-800 dark:text-blue-200">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>{match.score}% Rule-Based Compatibility</span>
                </span>
                <span>{selectedPeerProfile.examPreparation}</span>
              </div>
              <ul className="text-xs text-blue-900/90 dark:text-blue-200/90 space-y-0.5">
                {match.reasons.map((r, i) => (
                  <li key={i}>Â· {r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Intro */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Introduction
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {selectedPeerProfile.intro}
            </p>
          </div>

          {/* Structured Academic & Study Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Subjects of Interest
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedPeerProfile.subjects.join(' Â· ')}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Learning Goals
              </div>
              <ul className="text-slate-600 dark:text-slate-300 space-y-0.5">
                {selectedPeerProfile.learningGoals.map((g, i) => (
                  <li key={i}>Â· {g}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Preferred Schedule & Modes
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {selectedPeerProfile.preferredTimes.join(', ')} Â·{' '}
                {selectedPeerProfile.studyModes.join(', ')}
              </p>
              <p className="text-slate-400">{selectedPeerProfile.availability}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Learning Style & Language
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {selectedPeerProfile.learningStyles.join(', ')}
              </p>
              <p className="text-slate-400">
                Language: {selectedPeerProfile.preferredLanguage} Â· Collaboration:{' '}
                {selectedPeerProfile.collaborationInterests.join(', ')}
              </p>
            </div>
          </div>

          {/* Send Request Box if not connected */}
          {!isConnected && perm.allowed && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Include a personal message with your study request (optional)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder={`Hi ${(selectedPeerProfile?.name || 'Student').trim().split(/\s+/)[0]}, let's prepare for ${selectedPeerProfile.subjects[0]} together...`}
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleSendRequest}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </button>
              </div>
            </div>
          )}

          {/* Invite to Study Group Picker */}
          {showInvitePicker && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="flex-1 w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                {state.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleInviteGroup}
                disabled={!selectedGroupId}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Add to Group
              </button>
            </div>
          )}

          {/* Report Form */}
          {showReportForm && (
            <form
              onSubmit={handleSubmitReport}
              className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-3"
            >
              <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Report Safety or Community Guideline Issue
              </div>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-xs text-slate-900 dark:text-slate-100"
              >
                <option>Spam or unsolicited messages</option>
                <option>Harassment or disrespectful conduct</option>
                <option>Misleading academic information</option>
                <option>Fake or impersonated student profile</option>
              </select>
              <input
                type="text"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Additional context (optional)..."
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-xs text-slate-900 dark:text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleStartChat}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                isConnected
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isConnected ? 'Open KAMPUS Chat' : 'Connect to Chat'}</span>
            </button>

            {isConnected && state.groups.length > 0 && (
              <button
                type="button"
                onClick={() => setShowInvitePicker((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Invite to Study Group</span>
              </button>
            )}

            {!isConnected && !perm.allowed && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                <UserPlus className="w-3.5 h-3.5" />
                <span>{perm.reason}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReportForm((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>

            {confirmBlock ? (
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    blockUser(selectedPeerProfile.id);
                    setConfirmBlock(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Confirm Block
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmBlock(false)}
                  className="px-2 py-1.5 text-xs text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmBlock(true)}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Block</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

