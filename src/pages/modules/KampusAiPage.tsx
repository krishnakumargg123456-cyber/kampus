import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Home,
  MessageSquare,
  Lightbulb,
  PenTool,
  ClipboardCheck,
  Calculator,
  FileSearch,
  Layers,
  GraduationCap,
  CalendarClock,
  NotebookText,
  History,
  Bookmark,
  Search,
  Plus,
  Bell,
} from 'lucide-react';
import { KampusAiProvider, useKampusAi } from '../../context/KampusAiContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { AiToolId } from '../../types/kampusAi';
import { AiHomeDashboard } from '../../components/kampusai/AiHomeDashboard';
import { AiChatWorkspace } from '../../components/kampusai/AiChatWorkspace';
import { TopicExplainerTool } from '../../components/kampusai/TopicExplainerTool';
import { NotesGeneratorTool } from '../../components/kampusai/NotesGeneratorTool';
import { QuizGeneratorTool } from '../../components/kampusai/QuizGeneratorTool';
import { QuestionSolverTool } from '../../components/kampusai/QuestionSolverTool';
import { DocumentAiTool } from '../../components/kampusai/DocumentAiTool';
import { FlashcardStudioTool } from '../../components/kampusai/FlashcardStudioTool';
import { ExamPrepTool } from '../../components/kampusai/ExamPrepTool';
import { StudyPlannerTool } from '../../components/kampusai/StudyPlannerTool';
import { AskFromNotesTool } from '../../components/kampusai/AskFromNotesTool';
import { AiHistoryAndSavedView } from '../../components/kampusai/AiHistoryAndSavedView';

interface KampusAiPageProps {
  onOpenNotifications?: () => void;
}

const NAV_ITEMS: Array<{ id: AiToolId; label: string; icon: React.ReactNode }> = [
  { id: 'home', label: 'AI Home', icon: <Home className="w-4 h-4" /> },
  { id: 'chat', label: 'AI Chat', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'explain', label: 'Topic Explainer', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'notes', label: 'Notes Generator', icon: <PenTool className="w-4 h-4" /> },
  { id: 'quiz', label: 'Quiz Generator', icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: 'solver', label: 'Question Solver', icon: <Calculator className="w-4 h-4" /> },
  { id: 'documents', label: 'Document AI', icon: <FileSearch className="w-4 h-4" /> },
  { id: 'flashcards', label: 'Flashcards', icon: <Layers className="w-4 h-4" /> },
  { id: 'exam-prep', label: 'Exam Prep', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'planner', label: 'Study Planner', icon: <CalendarClock className="w-4 h-4" /> },
  { id: 'ask-notes', label: 'Ask My Notes', icon: <NotebookText className="w-4 h-4" /> },
  { id: 'history', label: 'AI History', icon: <History className="w-4 h-4" /> },
  { id: 'saved', label: 'Saved Items', icon: <Bookmark className="w-4 h-4" /> },
];

const KampusAiWorkspaceShell: React.FC<KampusAiPageProps> = ({ onOpenNotifications }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    activeTool,
    setActiveTool,
    conversations,
    setActiveConversationId,
    createNewConversation,
    history,
    savedItems,
  } = useKampusAi();

  const [headerSearch, setHeaderSearch] = useState('');

  const matchingConversations = headerSearch.trim()
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(headerSearch.toLowerCase()) ||
          c.messages.some((m) =>
            m.content.toLowerCase().includes(headerSearch.toLowerCase())
          )
      )
    : [];

  const handleNewChat = () => {
    createNewConversation('New Study Conversation');
    setActiveTool('chat');
  };

  return (
    <div className="space-y-5">
      {/* KAMPUS AI Module Header */}
      <header className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <span>LEARN Â· Module 02</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                KAMPUS AI Workspace
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
            {/* Search Conversations */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:border-blue-600"
              />
              {headerSearch.trim() && (
                <div className="absolute left-0 right-0 top-10 z-30 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg p-1.5 max-h-56 overflow-y-auto">
                  {matchingConversations.length === 0 ? (
                    <div className="p-2 text-xs text-slate-400">No matching conversations</div>
                  ) : (
                    matchingConversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveConversationId(c.id);
                          setActiveTool('chat');
                          setHeaderSearch('');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-xs cursor-pointer"
                      >
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.messages.length} messages
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('history')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenNotifications
                  ? onOpenNotifications()
                  : navigate('/account/notifications')
              }
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/account/profile')}
              className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer shrink-0"
            >
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-lg object-cover"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:inline">
                {(profile?.name || 'Student').trim().split(/\s+/)[0]}
              </span>
            </button>
          </div>
        </div>

        {/* Compact Tool Strip for Mobile / Tablet */}
        <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const active = activeTool === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTool(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Split Workspace: Desktop Left Tool Nav + Active AI Tool View */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <aside className="hidden xl:block xl:col-span-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs space-y-4 sticky top-20">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = activeTool === item.id;
              const badge =
                item.id === 'history' && history.length > 0
                  ? history.length
                  : item.id === 'saved' && savedItems.length > 0
                  ? savedItems.length
                  : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTool(item.id)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {badge !== null && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Recent Chats */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 px-1">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Recent Chats
            </div>
            {conversations.slice(0, 3).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveConversationId(c.id);
                  setActiveTool('chat');
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 truncate cursor-pointer"
              >
                {c.title}
              </button>
            ))}
          </div>
        </aside>

        <div className="xl:col-span-9 min-w-0">
          {activeTool === 'home' && <AiHomeDashboard />}
          {activeTool === 'chat' && <AiChatWorkspace />}
          {activeTool === 'explain' && <TopicExplainerTool />}
          {activeTool === 'notes' && <NotesGeneratorTool />}
          {activeTool === 'quiz' && <QuizGeneratorTool />}
          {activeTool === 'solver' && <QuestionSolverTool />}
          {activeTool === 'documents' && <DocumentAiTool />}
          {activeTool === 'flashcards' && <FlashcardStudioTool />}
          {activeTool === 'exam-prep' && <ExamPrepTool />}
          {activeTool === 'planner' && <StudyPlannerTool />}
          {activeTool === 'ask-notes' && <AskFromNotesTool />}
          {activeTool === 'history' && <AiHistoryAndSavedView mode="history" />}
          {activeTool === 'saved' && <AiHistoryAndSavedView mode="saved" />}
        </div>
      </div>
    </div>
  );
};

export const KampusAiPage: React.FC<KampusAiPageProps> = ({ onOpenNotifications }) => {
  return (
    <KampusAiProvider>
      <KampusAiWorkspaceShell onOpenNotifications={onOpenNotifications} />
    </KampusAiProvider>
  );
};

