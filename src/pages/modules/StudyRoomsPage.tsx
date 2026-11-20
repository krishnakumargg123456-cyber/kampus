import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { StudyRoomsProvider, useStudyRooms } from '../../context/StudyRoomsContext';
import {
  SessionSummaryRecord,
  StudyRoom,
  StudyRoomsReport,
} from '../../types/studyRooms';
import { StudyRoomsDashboard } from '../../components/studyrooms/StudyRoomsDashboard';
import { LiveStudyRoomWorkspace } from '../../components/studyrooms/LiveStudyRoomWorkspace';
import {
  CreateStudyRoomModal,
  JoinByCodeModal,
  RequestJoinModal,
  RoomSafetyReportModal,
  SessionSummaryModal,
} from '../../components/studyrooms/CreateAndJoinRoomModals';

interface StudyRoomsPageProps {
  onOpenNotifications?: () => void;
}

const StudyRoomsWorkspaceInner: React.FC<StudyRoomsPageProps> = ({
  onOpenNotifications,
}) => {
  const {
    loading,
    activeRoom,
    toastMessage,
    lastSessionSummary,
    clearLastSessionSummary,
    joinByCodeOrToken,
    showToast,
  } = useStudyRooms();

  const [searchParams, setSearchParams] = useSearchParams();
  const handledInviteRef = useRef(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [defaultScheduleLater, setDefaultScheduleLater] = useState(false);
  const [editingRoom, setEditingRoom] = useState<StudyRoom | null>(null);
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [requestJoinRoomTarget, setRequestJoinRoomTarget] = useState<StudyRoom | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<SessionSummaryRecord | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    roomId: string;
    targetType: StudyRoomsReport['targetType'];
    targetId: string;
    targetSummary: string;
  } | null>(null);

  // Support deep link ?invite=token_or_code
  useEffect(() => {
    const inviteParam = searchParams.get('invite');
    if (!inviteParam || loading || handledInviteRef.current) return;
    handledInviteRef.current = true;
    (async () => {
      const res = await joinByCodeOrToken(inviteParam);
      if (!res.ok) {
        showToast(res.error || 'Invitation link is invalid or expired.');
      }
      setSearchParams({}, { replace: true });
    })();
  }, [searchParams, loading, joinByCodeOrToken, showToast, setSearchParams]);

  const displayedSummary = selectedSummary || lastSessionSummary;

  return (
    <>
      {activeRoom ? (
        <LiveStudyRoomWorkspace
          room={activeRoom}
          onEditRoom={(r) => {
            setEditingRoom(r);
            setDefaultScheduleLater(Boolean(r.scheduledStartAt));
            setCreateModalOpen(true);
          }}
          onReportTarget={(target) => setReportTarget(target)}
        />
      ) : (
        <StudyRoomsDashboard
          onOpenNotifications={onOpenNotifications}
          onOpenCreate={(scheduleLater) => {
            setEditingRoom(null);
            setDefaultScheduleLater(scheduleLater);
            setCreateModalOpen(true);
          }}
          onEditRoom={(r) => {
            setEditingRoom(r);
            setDefaultScheduleLater(Boolean(r.scheduledStartAt));
            setCreateModalOpen(true);
          }}
          onOpenJoinCode={() => setJoinCodeOpen(true)}
          onOpenRequestJoin={(r) => setRequestJoinRoomTarget(r)}
          onOpenSummary={(s) => setSelectedSummary(s)}
        />
      )}

      <CreateStudyRoomModal
        isOpen={createModalOpen}
        defaultScheduleLater={defaultScheduleLater}
        editingRoom={editingRoom}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingRoom(null);
        }}
      />

      <JoinByCodeModal
        isOpen={joinCodeOpen}
        onClose={() => setJoinCodeOpen(false)}
      />

      <RequestJoinModal
        room={requestJoinRoomTarget}
        onClose={() => setRequestJoinRoomTarget(null)}
      />

      <SessionSummaryModal
        summary={displayedSummary}
        onClose={() => {
          setSelectedSummary(null);
          clearLastSessionSummary();
        }}
      />

      <RoomSafetyReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export const StudyRoomsPage: React.FC<StudyRoomsPageProps> = ({
  onOpenNotifications,
}) => {
  return (
    <StudyRoomsProvider>
      <StudyRoomsWorkspaceInner onOpenNotifications={onOpenNotifications} />
    </StudyRoomsProvider>
  );
};
