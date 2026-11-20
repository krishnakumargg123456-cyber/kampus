import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  RefreshCw,
  Users,
} from 'lucide-react';
import { ChatProvider, useChat } from '../../context/ChatContext';
import { ChatConversation, ChatSafetyReport, MobileChatScreen } from '../../types/chat';
import { ConversationListPanel } from '../../components/chat/ConversationListPanel';
import { ActiveConversationPanel } from '../../components/chat/ActiveConversationPanel';
import { ConversationInfoPanel } from '../../components/chat/ConversationInfoPanel';
import {
  CreateGroupModal,
  MessageRequestsView,
  NewMessageView,
} from '../../components/chat/NewConversationAndGroupModals';
import {
  ChatReportModal,
  ChatSettingsView,
  ConfirmActionModal,
} from '../../components/chat/ChatSettingsAndSafetyModal';

interface ChatPageProps {
  onOpenNotifications?: () => void;
}

type LeftSubView = 'list' | 'new-message' | 'requests' | 'settings';

const ChatWorkspace: React.FC<ChatPageProps> = ({ onOpenNotifications }) => {
  const {
    loading,
    error,
    toastMessage,
    conversations,
    activeConversationId,
    setActiveConversationId,
    refreshBootstrap,
    updateConversationAction,
    showToast,
  } = useChat();

  const [leftSubView, setLeftSubView] = useState<LeftSubView>('list');
  const [mobileScreen, setMobileScreen] = useState<MobileChatScreen>('list');
  const [infoPanelOpen, setInfoPanelOpen] = useState<boolean>(false);
  const [createGroupOpen, setCreateGroupOpen] = useState<boolean>(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const [reportTarget, setReportTarget] = useState<{
    targetType: ChatSafetyReport['targetType'];
    targetId: string;
    targetSummary: string;
  } | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'clear' | 'delete';
    conversation: ChatConversation;
  } | null>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  useEffect(() => {
    if (!activeConversation && (mobileScreen === 'conversation' || mobileScreen === 'info')) {
      setMobileScreen('list');
    }
  }, [activeConversation, mobileScreen]);

  const handleSelectConversation = (convId: string, jumpMessageId?: string) => {
    setActiveConversationId(convId);
    setLeftSubView('list');
    setMobileScreen('conversation');
    if (jumpMessageId) {
      setHighlightedMessageId(jumpMessageId);
      window.setTimeout(() => setHighlightedMessageId(null), 2600);
    }
  };

  const handleJumpToMessage = (msgId: string) => {
    setHighlightedMessageId(msgId);
    if (mobileScreen === 'info') {
      setMobileScreen('conversation');
    }
    window.setTimeout(() => setHighlightedMessageId(null), 2600);
  };

  const handleExecuteConfirm = async () => {
    if (!confirmAction) return;
    const { type, conversation } = confirmAction;
    if (type === 'clear') {
      const ok = await updateConversationAction(conversation.id, { action: 'clearLocal' });
      if (ok) showToast('Local chat history cleared for your account.');
    } else {
      const ok = await updateConversationAction(conversation.id, { action: 'deleteLocal' });
      if (ok) {
        if (activeConversationId === conversation.id) {
          setActiveConversationId(null);
          setInfoPanelOpen(false);
          setMobileScreen('list');
        }
        showToast('Conversation removed from your inbox.');
      }
    }
    setConfirmAction(null);
  };

  if (loading) {
    return (
      <div className="h-[calc(100dvh-9rem)] lg:h-[calc(100vh-8.25rem)] min-h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Connecting to KAMPUS Chat...
        </p>
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <div className="h-[calc(100dvh-9rem)] lg:h-[calc(100vh-8.25rem)] min-h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <div className="space-y-1 max-w-md">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Unable to load KAMPUS Chat
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => refreshBootstrap()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* DESKTOP & TABLET (lg+) 3-PANEL SHELL */}
      <div className="hidden lg:flex h-[calc(100vh-8.25rem)] min-h-[460px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Left Panel: Conversations or Sub-view */}
        <div className="w-80 xl:w-92 shrink-0 h-full overflow-hidden">
          {leftSubView === 'list' && (
            <ConversationListPanel
              onSelectConversation={handleSelectConversation}
              onOpenNewMessage={() => setLeftSubView('new-message')}
              onOpenCreateGroup={() => setCreateGroupOpen(true)}
              onOpenRequests={() => setLeftSubView('requests')}
              onOpenSettings={() => setLeftSubView('settings')}
              onOpenNotifications={onOpenNotifications}
              onRequestDeleteConv={(conv) =>
                setConfirmAction({ type: 'delete', conversation: conv })
              }
            />
          )}

          {leftSubView === 'new-message' && (
            <NewMessageView
              onBack={() => setLeftSubView('list')}
              onOpenedConversation={(cid) => handleSelectConversation(cid)}
            />
          )}

          {leftSubView === 'requests' && (
            <MessageRequestsView
              onBack={() => setLeftSubView('list')}
              onAccepted={(cid) => handleSelectConversation(cid)}
              onOpenSettings={() => setLeftSubView('settings')}
            />
          )}

          {leftSubView === 'settings' && (
            <ChatSettingsView onBack={() => setLeftSubView('list')} />
          )}
        </div>

        {/* Center Panel: Active Conversation */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          {activeConversation ? (
            <ActiveConversationPanel
              conversation={activeConversation}
              highlightedMessageId={highlightedMessageId}
              infoPanelOpen={infoPanelOpen}
              onToggleInfoPanel={() => setInfoPanelOpen((prev) => !prev)}
              onMobileBack={() => setMobileScreen('list')}
              onRequestClearConv={(conv) =>
                setConfirmAction({ type: 'clear', conversation: conv })
              }
              onRequestDeleteConv={(conv) =>
                setConfirmAction({ type: 'delete', conversation: conv })
              }
              onReportTarget={(target) => setReportTarget(target)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Select a conversation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                Choose an existing student chat or group thread, or start a new study conversation.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setLeftSubView('new-message')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" /> New Message
                </button>
                <button
                  type="button"
                  onClick={() => setCreateGroupOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-600" /> Create Group
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Collapsible Info & Shared Hub */}
        {infoPanelOpen && activeConversation && (
          <div className="w-80 xl:w-88 shrink-0 h-full overflow-hidden">
            <ConversationInfoPanel
              conversation={activeConversation}
              onClose={() => setInfoPanelOpen(false)}
              onJumpToMessage={handleJumpToMessage}
              onReport={(target) => setReportTarget(target)}
            />
          </div>
        )}
      </div>

      {/* MOBILE & TABLET (< lg) 6-SCREEN STACK */}
      <div className="lg:hidden h-[calc(100dvh-9.5rem)] min-h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {mobileScreen === 'list' && (
          <ConversationListPanel
            onSelectConversation={handleSelectConversation}
            onOpenNewMessage={() => setMobileScreen('new-message')}
            onOpenCreateGroup={() => setCreateGroupOpen(true)}
            onOpenRequests={() => setMobileScreen('requests')}
            onOpenSettings={() => setMobileScreen('settings')}
            onOpenNotifications={onOpenNotifications}
            onRequestDeleteConv={(conv) =>
              setConfirmAction({ type: 'delete', conversation: conv })
            }
          />
        )}

        {mobileScreen === 'conversation' && activeConversation && (
          <ActiveConversationPanel
            conversation={activeConversation}
            highlightedMessageId={highlightedMessageId}
            infoPanelOpen={false}
            onToggleInfoPanel={() => setMobileScreen('info')}
            onMobileBack={() => setMobileScreen('list')}
            onRequestClearConv={(conv) =>
              setConfirmAction({ type: 'clear', conversation: conv })
            }
            onRequestDeleteConv={(conv) =>
              setConfirmAction({ type: 'delete', conversation: conv })
            }
            onReportTarget={(target) => setReportTarget(target)}
          />
        )}

        {mobileScreen === 'info' && activeConversation && (
          <ConversationInfoPanel
            conversation={activeConversation}
            isMobile
            onClose={() => setMobileScreen('conversation')}
            onJumpToMessage={handleJumpToMessage}
            onReport={(target) => setReportTarget(target)}
          />
        )}

        {mobileScreen === 'new-message' && (
          <NewMessageView
            onBack={() => setMobileScreen('list')}
            onOpenedConversation={(cid) => handleSelectConversation(cid)}
          />
        )}

        {mobileScreen === 'requests' && (
          <MessageRequestsView
            onBack={() => setMobileScreen('list')}
            onAccepted={(cid) => handleSelectConversation(cid)}
            onOpenSettings={() => setMobileScreen('settings')}
          />
        )}

        {mobileScreen === 'settings' && (
          <ChatSettingsView onBack={() => setMobileScreen('list')} />
        )}
      </div>

      {/* Global Modals */}
      <CreateGroupModal
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreated={(cid) => handleSelectConversation(cid)}
      />

      <ChatReportModal target={reportTarget} onClose={() => setReportTarget(null)} />

      {confirmAction && (
        <ConfirmActionModal
          title={
            confirmAction.type === 'clear'
              ? 'Clear Local Chat History'
              : 'Remove Conversation'
          }
          description={
            confirmAction.type === 'clear'
              ? 'This clears earlier messages only from your local KAMPUS Chat view. Other participants still retain their copy.'
              : 'This removes the conversation from your inbox list. Messages remain intact for other group or chat participants.'
          }
          confirmLabel={
            confirmAction.type === 'clear' ? 'Clear History' : 'Remove Conversation'
          }
          onConfirm={handleExecuteConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Non-blocking Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export const ChatPage: React.FC<ChatPageProps> = ({ onOpenNotifications }) => {
  return (
    <ChatProvider>
      <ChatWorkspace onOpenNotifications={onOpenNotifications} />
    </ChatProvider>
  );
};
