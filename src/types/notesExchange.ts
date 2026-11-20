export type NoteFormat =
  | 'Handwritten PDF'
  | 'Digital Notes'
  | 'Formula Sheet'
  | 'Lecture Summary'
  | 'PYQ Solutions';

export type NoteEducationLevel =
  | 'Undergraduate'
  | 'Class 11–12'
  | 'Postgraduate'
  | 'Competitive Exam';

export type NotesExchangeTab = 'explore' | 'requests' | 'saved' | 'contributions';

export type NotesSortOption = 'top-rated' | 'most-downloaded' | 'recent';

export interface NoteReview {
  id: string;
  authorName: string;
  authorCollege: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpfulCount: number;
}

export interface SharedNoteAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string;
}

export interface SharedNoteItem {
  id: string;
  title: string;
  course: string;
  subjectArea: string;
  semesterOrTerm: string;
  level: NoteEducationLevel;
  format: NoteFormat;
  summary: string;
  content: string;
  tags: string[];
  pagesCount: number;
  authorName: string;
  authorCollege: string;
  authorAvatar: string;
  isOwnUpload?: boolean;
  isVerified: boolean;
  createdAt: string;
  dateLabel: string;
  rating: number;
  reviews: NoteReview[];
  downloads: number;
  karmaReward: number;
  coverImage: string;
  attachment?: SharedNoteAttachment;
  fulfilledRequestId?: string;
}

export interface NoteRequestItem {
  id: string;
  title: string;
  course: string;
  semesterOrTerm: string;
  level: NoteEducationLevel;
  details: string;
  requesterName: string;
  requesterCollege: string;
  bountyKarma: number;
  upvotes: number;
  upvotedByUser?: boolean;
  status: 'open' | 'fulfilled';
  fulfilledNoteId?: string;
  createdAt: string;
  dateLabel: string;
}

export interface KarmaActivityItem {
  id: string;
  event: string;
  points: number;
  createdAt: string;
  dateLabel: string;
}

export interface NotesExchangeState {
  notes: SharedNoteItem[];
  requests: NoteRequestItem[];
  savedNoteIds: string[];
  downloadedNoteIds: string[];
  karmaPoints: number;
  karmaHistory: KarmaActivityItem[];
  reportedNoteIds: string[];
}
