import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { CommunityProvider, useCommunity } from '../../context/CommunityContext';
import {
  CommunityPost,
  CommunityPostDraft,
  CommunityWorkspaceTab,
  SafetyReport,
} from '../../types/community';
import { CommunityHeader } from '../../components/community/CommunityHeader';
import { CommunityHomeFeed } from '../../components/community/CommunityHomeFeed';
import { QuestionsAndAnswersView } from '../../components/community/QuestionsAndAnswersView';
import { ExploreCommunitiesView } from '../../components/community/ExploreCommunitiesView';
import { CommunityDetailView } from '../../components/community/CommunityDetailView';
import { PollsAndResourcesView } from '../../components/community/PollsAndResourcesView';
import { ContributorsView } from '../../components/community/ContributorsView';
import { MyActivityView } from '../../components/community/MyActivityView';
import { CreatePostModal } from '../../components/community/CreatePostModal';
import { DiscussionThreadModal } from '../../components/community/DiscussionThreadModal';
import { PublicStudentProfileModal } from '../../components/community/PublicStudentProfileModal';
import { ReportSafetyModal } from '../../components/community/ReportSafetyModal';

interface CommunityPageProps {
  onOpenNotifications?: () => void;
}

const CommunityWorkspace: React.FC<CommunityPageProps> = ({ onOpenNotifications }) => {
  const { toastMessage, addRecentSearch } = useCommunity();
  const [searchParams] = useSearchParams();

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<CommunityWorkspaceTab>('feed');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<'discussion' | 'question'>('discussion');
  const [composerCommunityId, setComposerCommunityId] = useState<string | undefined>(undefined);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [resumingDraft, setResumingDraft] = useState<CommunityPostDraft | null>(null);

  const [activeThreadPostId, setActiveThreadPostId] = useState<string | null>(null);
  const [activeStudentProfileId, setActiveStudentProfileId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    targetType: SafetyReport['targetType'];
    targetId: string;
    targetTitle: string;
  } | null>(null);

  // Support deep link ?post=post_id
  useEffect(() => {
    const deepPost = searchParams.get('post');
    if (deepPost) {
      setActiveThreadPostId(deepPost);
    }
  }, [searchParams]);

  const openComposer = (
    mode: 'discussion' | 'question',
    communityId?: string,
    editPost?: CommunityPost,
    draft?: CommunityPostDraft
  ) => {
    setComposerMode(mode);
    setComposerCommunityId(communityId);
    setEditingPost(editPost || null);
    setResumingDraft(draft || null);
    setComposerOpen(true);
  };

  const openCommunityDetail = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setActiveWorkspaceTab('communities');
  };

  const handleWorkspaceTabChange = (tab: CommunityWorkspaceTab) => {
    setSelectedCommunityId(null);
    setActiveWorkspaceTab(tab);
  };

  const handleTagFilter = (tag: string) => {
    setSearchQuery(tag);
    addRecentSearch(tag);
    setSelectedCommunityId(null);
    setActiveWorkspaceTab('feed');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      <CommunityHeader
        activeWorkspaceTab={activeWorkspaceTab}
        onSelectWorkspaceTab={handleWorkspaceTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenComposer={(mode) => openComposer(mode, selectedCommunityId || undefined)}
        onOpenNotifications={onOpenNotifications}
        onSelectPost={(postId) => setActiveThreadPostId(postId)}
        onSelectCommunity={openCommunityDetail}
        onSelectStudent={(studentId) => setActiveStudentProfileId(studentId)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeWorkspaceTab === 'feed' && (
          <CommunityHomeFeed
            searchQuery={searchQuery}
            onSearchTag={handleTagFilter}
            onOpenThread={(postId) => setActiveThreadPostId(postId)}
            onOpenCommunity={openCommunityDetail}
            onOpenStudentProfile={(studentId) => setActiveStudentProfileId(studentId)}
            onEditPost={(post) => openComposer('discussion', post.communityId, post)}
            onReportPost={(post) =>
              setReportTarget({
                targetType: 'post',
                targetId: post.id,
                targetTitle: post.title,
              })
            }
            onExploreCommunities={() => handleWorkspaceTabChange('communities')}
            onOpenContributors={() => handleWorkspaceTabChange('contributors')}
          />
        )}

        {activeWorkspaceTab === 'qa' && (
          <QuestionsAndAnswersView
            searchQuery={searchQuery}
            onOpenComposer={() => openComposer('question')}
            onOpenThread={(postId) => setActiveThreadPostId(postId)}
            onOpenCommunity={openCommunityDetail}
            onOpenStudentProfile={(studentId) => setActiveStudentProfileId(studentId)}
            onEditPost={(post) => openComposer('question', post.communityId, post)}
            onReportPost={(post) =>
              setReportTarget({
                targetType: 'post',
                targetId: post.id,
                targetTitle: post.title,
              })
            }
          />
        )}

        {activeWorkspaceTab === 'communities' &&
          (selectedCommunityId ? (
            <CommunityDetailView
              communityId={selectedCommunityId}
              onBack={() => setSelectedCommunityId(null)}
              onOpenComposer={(mode, cid) => openComposer(mode, cid)}
              onOpenThread={(postId) => setActiveThreadPostId(postId)}
              onOpenStudentProfile={(studentId) => setActiveStudentProfileId(studentId)}
              onEditPost={(post) => openComposer('discussion', post.communityId, post)}
              onReportPost={(post) =>
                setReportTarget({
                  targetType: 'post',
                  targetId: post.id,
                  targetTitle: post.title,
                })
              }
            />
          ) : (
            <ExploreCommunitiesView onSelectCommunity={openCommunityDetail} />
          ))}

        {activeWorkspaceTab === 'polls-resources' && (
          <PollsAndResourcesView
            onOpenComposer={() => openComposer('discussion')}
            onOpenThread={(postId) => setActiveThreadPostId(postId)}
            onOpenCommunity={openCommunityDetail}
            onOpenStudentProfile={(studentId) => setActiveStudentProfileId(studentId)}
            onEditPost={(post) => openComposer('discussion', post.communityId, post)}
            onReportPost={(post) =>
              setReportTarget({
                targetType: 'post',
                targetId: post.id,
                targetTitle: post.title,
              })
            }
          />
        )}

        {activeWorkspaceTab === 'contributors' && (
          <ContributorsView
            onOpenStudentProfile={(studentId) => setActiveStudentProfileId(studentId)}
          />
        )}

        {activeWorkspaceTab === 'activity' && (
          <MyActivityView
            onOpenThread={(postId) => setActiveThreadPostId(postId)}
            onOpenCommunity={openCommunityDetail}
            onOpenStudentProfile={(studentId) => setActiveStudentProfileId(studentId)}
            onEditPost={(post) => openComposer('discussion', post.communityId, post)}
            onReportPost={(post) =>
              setReportTarget({
                targetType: 'post',
                targetId: post.id,
                targetTitle: post.title,
              })
            }
            onResumeDraft={(draft) =>
              openComposer(
                draft.type === 'Ask a Question' ? 'question' : 'discussion',
                draft.communityId,
                undefined,
                draft
              )
            }
          />
        )}
      </main>

      {/* Modals */}
      <CreatePostModal
        isOpen={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditingPost(null);
          setResumingDraft(null);
        }}
        defaultMode={composerMode}
        defaultCommunityId={composerCommunityId}
        editingPost={editingPost}
        loadingDraft={resumingDraft}
      />

      <DiscussionThreadModal
        postId={activeThreadPostId}
        onClose={() => setActiveThreadPostId(null)}
        onOpenCommunity={openCommunityDetail}
        onOpenStudentProfile={(studentId) => setActiveStudentProfileId(studentId)}
        onEditPost={(post) => openComposer('discussion', post.communityId, post)}
        onReportTarget={(target) => setReportTarget(target)}
      />

      <PublicStudentProfileModal
        studentId={activeStudentProfileId}
        onClose={() => setActiveStudentProfileId(null)}
        onOpenThread={(postId) => setActiveThreadPostId(postId)}
        onReportStudent={(id, name) =>
          setReportTarget({ targetType: 'student', targetId: id, targetTitle: name })
        }
      />

      <ReportSafetyModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType={reportTarget?.targetType || 'post'}
        targetId={reportTarget?.targetId || ''}
        targetTitle={reportTarget?.targetTitle || ''}
      />

      {/* Non-blocking Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 text-xs font-semibold shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const CommunityPage: React.FC<CommunityPageProps> = ({ onOpenNotifications }) => (
  <CommunityProvider>
    <CommunityWorkspace onOpenNotifications={onOpenNotifications} />
  </CommunityProvider>
);
