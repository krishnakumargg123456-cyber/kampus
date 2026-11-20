import React from 'react';
import { StudyHubProvider, useStudyHub } from '../../context/StudyHubContext';
import { StudyHubHeader } from '../../components/studyhub/StudyHubHeader';
import { StudyHubDashboard } from '../../components/studyhub/StudyHubDashboard';
import { SubjectsExplorerView } from '../../components/studyhub/SubjectsExplorerView';
import { StudyLibraryView } from '../../components/studyhub/StudyLibraryView';
import { NotesWorkspaceView } from '../../components/studyhub/NotesWorkspaceView';
import { PyqPapersView } from '../../components/studyhub/PyqPapersView';
import { QuestionBankView } from '../../components/studyhub/QuestionBankView';
import { PracticeTestView } from '../../components/studyhub/PracticeTestView';
import { StudyAnalyticsView } from '../../components/studyhub/StudyAnalyticsView';
import { BookmarksAndUploadsView } from '../../components/studyhub/BookmarksAndUploadsView';
import { StudyRemindersView } from '../../components/studyhub/StudyRemindersView';

interface StudyHubPageProps {
  onOpenAi?: (query?: string) => void;
  onOpenNotifications?: () => void;
}

const StudyHubWorkspace: React.FC<StudyHubPageProps> = ({
  onOpenAi,
  onOpenNotifications,
}) => {
  const { activeTab } = useStudyHub();

  return (
    <div className="space-y-6">
      <StudyHubHeader onOpenNotifications={onOpenNotifications} />

      {activeTab === 'dashboard' && <StudyHubDashboard onOpenAi={onOpenAi} />}
      {activeTab === 'subjects' && <SubjectsExplorerView onOpenAi={onOpenAi} />}
      {activeTab === 'library' && <StudyLibraryView onOpenAi={onOpenAi} />}
      {activeTab === 'notes' && <NotesWorkspaceView />}
      {activeTab === 'pyqs' && <PyqPapersView />}
      {activeTab === 'qbank' && <QuestionBankView onOpenAi={onOpenAi} />}
      {activeTab === 'tests' && <PracticeTestView />}
      {activeTab === 'analytics' && <StudyAnalyticsView />}
      {activeTab === 'saved' && <BookmarksAndUploadsView />}
      {activeTab === 'reminders' && <StudyRemindersView />}
    </div>
  );
};

export const StudyHubPage: React.FC<StudyHubPageProps> = ({
  onOpenAi,
  onOpenNotifications,
}) => {
  return (
    <StudyHubProvider>
      <StudyHubWorkspace
        onOpenAi={onOpenAi}
        onOpenNotifications={onOpenNotifications}
      />
    </StudyHubProvider>
  );
};
