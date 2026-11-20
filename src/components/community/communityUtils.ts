import { BadgeName, CommunityAttachment } from '../../types/community';

export function formatRelativeTime(isoDate: string): string {
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return 'Recently';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(isoDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4 MB

export async function readAttachmentFile(file: File): Promise<{ attachment?: CommunityAttachment; error?: string }> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { error: `File "${file.name}" exceeds the 4 MB limit.` };
  }
  const isImage = file.type.startsWith('image/');
  const isDoc =
    file.type === 'application/pdf' ||
    file.type.startsWith('text/') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.pptx');

  if (!isImage && !isDoc) {
    return { error: 'Unsupported file type. Upload an image, PDF, TXT, MD, DOCX, or PPTX file.' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        attachment: {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          kind: isImage ? 'image' : 'document',
          sizeBytes: file.size,
          dataUrl: String(reader.result || ''),
        },
      });
    };
    reader.onerror = () => resolve({ error: 'Could not read the selected file.' });
    reader.readAsDataURL(file);
  });
}

export const BADGE_DESCRIPTIONS: Record<BadgeName, string> = {
  'Helpful Member': 'Earned for receiving 2+ helpful votes or an accepted answer.',
  'Knowledge Sharer': 'Earned for contributing both community posts and peer answers.',
  'Discussion Starter': 'Earned for publishing 2+ academic discussions or questions.',
  'Community Supporter': 'Earned for receiving 3+ upvotes across helpful contributions.',
  'Top Contributor': 'Earned by reaching a community contribution score of 12+.',
};
