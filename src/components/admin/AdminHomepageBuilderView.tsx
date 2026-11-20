import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Trash2,
} from 'lucide-react';
import type { HomepageSectionConfig, HomepageSectionType, HomepageVersion } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { AdminCard, AdminFeedbackBanner, StatusLabel, formatDateTime } from './AdminShared';
import { getBundledImage } from '../../utils/assetResolver';

const SECTION_PRESETS: Array<{ type: HomepageSectionType; label: string }> = [
  { type: 'promo-banner', label: 'Announcement / Promo Banner' },
  { type: 'custom-welcome', label: 'Welcome Banner' },
  { type: 'featured-events', label: 'Featured Events' },
  { type: 'featured-colleges', label: 'Featured Colleges' },
  { type: 'featured-market', label: 'Featured Marketplace' },
  { type: 'search-spotlight', label: 'Search Spotlight' },
];

export const AdminHomepageBuilderView: React.FC = () => {
  const { adminFetch, hasPermission } = useAdminAuth();
  const { refreshPlatformConfig } = usePlatformConfig();

  const [draft, setDraft] = useState<HomepageSectionConfig[]>([]);
  const [versions, setVersions] = useState<HomepageVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [publishNote, setPublishNote] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  const load = async () => {
    try {
      const data = await adminFetch<{
        draft: HomepageSectionConfig[];
        published: HomepageSectionConfig[];
        versions: HomepageVersion[];
      }>('/api/admin/homepage');
      setDraft(data.draft || []);
      setVersions(data.versions || []);
      if (!selectedId && data.draft?.length) setSelectedId(data.draft[0].id);
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to load homepage sections.' });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = draft.find((s) => s.id === selectedId) || draft[0] || null;

  const updateSection = (id: string, patch: Partial<HomepageSectionConfig>) => {
    setDraft((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= draft.length) return;
    const copy = [...draft];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    setDraft(copy.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const duplicateSection = (sec: HomepageSectionConfig) => {
    const clone: HomepageSectionConfig = {
      ...sec,
      id: `hp-${sec.type}-${Date.now()}`,
      label: `${sec.label} (Copy)`,
      order: draft.length + 1,
    };
    setDraft((prev) => [...prev, clone]);
    setSelectedId(clone.id);
  };

  const addPresetSection = (type: HomepageSectionType, label: string) => {
    const item: HomepageSectionConfig = {
      id: `hp-${type}-${Date.now()}`,
      type,
      label,
      visible: true,
      order: draft.length + 1,
      heading: label,
      subheading: 'Published from Super Admin Studio',
      description: 'Edit heading, CTA links, and visual tone directly in Homepage Builder.',
      imageUrl: getBundledImage('campus_hackathon_1794407584703.jpg'),
      iconName: 'Sparkles',
      primaryCtaLabel: 'Explore Now',
      primaryCtaLink: '/campus/events-clubs',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: type === 'promo-banner' ? 'blue' : 'default',
    };
    setDraft((prev) => [...prev, item]);
    setSelectedId(item.id);
  };

  const removeSection = (id: string) => {
    if (draft.length <= 1) return;
    const filtered = draft.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }));
    setDraft(filtered);
    if (selectedId === id && filtered.length) setSelectedId(filtered[0].id);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await adminFetch<{ draft: HomepageSectionConfig[] }>('/api/admin/homepage/draft', {
        method: 'PUT',
        body: JSON.stringify({ sections: draft }),
      });
      setDraft(res.draft);
      setNotice({ kind: 'info', message: 'Homepage draft saved without modifying live student view.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Save draft failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const res = await adminFetch<{
        draft: HomepageSectionConfig[];
        versions: HomepageVersion[];
      }>('/api/admin/homepage/publish', {
        method: 'POST',
        body: JSON.stringify({
          sections: draft,
          note: publishNote.trim() || 'Published homepage layout',
        }),
      });
      setDraft(res.draft);
      setVersions(res.versions || []);
      setPublishNote('');
      await refreshPlatformConfig();
      setNotice({ kind: 'success', message: 'Homepage changes published live to KAMPUS student home.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Publish failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (verId: string) => {
    try {
      const res = await adminFetch<{ draft: HomepageSectionConfig[]; versions: HomepageVersion[] }>(
        `/api/admin/homepage/restore/${verId}`,
        { method: 'POST' }
      );
      setDraft(res.draft);
      setVersions(res.versions || []);
      await refreshPlatformConfig();
      setNotice({ kind: 'success', message: 'Restored and published homepage version.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Version restore failed.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Homepage Visual Builder
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reorder sections, toggle visibility, customize text/CTAs, preview desktop & mobile, and publish live.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Release note (optional)"
            value={publishNote}
            onChange={(e) => setPublishNote(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          />
          <button
            type="button"
            disabled={saving || !hasPermission('edit')}
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving || !hasPermission('publish')}
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <Send className="w-3.5 h-3.5" />
            Publish Live
          </button>
        </div>
      </div>

      <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section Stack */}
        <AdminCard
          className="lg:col-span-4"
          title="Homepage Sections"
          subtitle="Ordered top-to-bottom stack"
        >
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {draft.map((sec, idx) => (
              <div
                key={sec.id}
                onClick={() => setSelectedId(sec.id)}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between gap-2 ${
                  selected?.id === sec.id
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {idx + 1}. {sec.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">{sec.type}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => updateSection(sec.id, { visible: !sec.visible })}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={sec.visible ? 'Hide section' : 'Show section'}
                  >
                    {sec.visible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, -1)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 1)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateSection(sec)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(sec.id)}
                    className="p-1 rounded hover:bg-red-100 text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Add Dynamic Section
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_PRESETS.map((p) => (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => addPresetSection(p.type, p.label)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Plus className="w-3 h-3" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </AdminCard>

        {/* Section Property Editor */}
        <div className="lg:col-span-4 space-y-6">
          <AdminCard title={selected ? `Edit: ${selected.label}` : 'Select a Section'}>
            {selected && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Section Visible</span>
                  <input
                    type="checkbox"
                    checked={selected.visible}
                    onChange={(e) => updateSection(selected.id, { visible: e.target.checked })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Admin Label</label>
                  <input
                    type="text"
                    value={selected.label}
                    onChange={(e) => updateSection(selected.id, { label: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Heading</label>
                  <input
                    type="text"
                    value={selected.heading}
                    onChange={(e) => updateSection(selected.id, { heading: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Subheading</label>
                  <input
                    type="text"
                    value={selected.subheading}
                    onChange={(e) => updateSection(selected.id, { subheading: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={selected.description}
                    onChange={(e) => updateSection(selected.id, { description: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Section Image URL</label>
                  <input
                    type="text"
                    value={selected.imageUrl}
                    onChange={(e) => updateSection(selected.id, { imageUrl: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Primary CTA Label</label>
                    <input
                      type="text"
                      value={selected.primaryCtaLabel}
                      onChange={(e) => updateSection(selected.id, { primaryCtaLabel: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Primary CTA Route</label>
                    <input
                      type="text"
                      value={selected.primaryCtaLink}
                      onChange={(e) => updateSection(selected.id, { primaryCtaLink: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Visual Tone</label>
                  <select
                    value={selected.backgroundTone}
                    onChange={(e) =>
                      updateSection(selected.id, {
                        backgroundTone: e.target.value as HomepageSectionConfig['backgroundTone'],
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="default">Clean Surface</option>
                    <option value="navy">Deep Navy (#172554)</option>
                    <option value="blue">Primary Blue (#2563EB)</option>
                    <option value="slate">Subtle Slate</option>
                    <option value="amber">Warm Highlight</option>
                  </select>
                </div>
              </div>
            )}
          </AdminCard>

          <AdminCard title="Published Homepage Versions">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
              {versions.map((v) => (
                <div key={v.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{v.note}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {formatDateTime(v.publishedAt)} · {v.sections.length} sections
                    </div>
                  </div>
                  {hasPermission('publish') && (
                    <button
                      type="button"
                      onClick={() => handleRestoreVersion(v.id)}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:text-blue-600"
                      title="Restore this version"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        {/* Live Layout Wireframe Preview */}
        <AdminCard
          className="lg:col-span-4"
          title="Responsive Layout Preview"
          action={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        >
          <div
            className={`mx-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 p-3 space-y-2.5 max-h-[600px] overflow-y-auto ${
              previewMode === 'mobile' ? 'max-w-[260px]' : 'w-full'
            }`}
          >
            {draft.filter((s) => s.visible).map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  s.backgroundTone === 'navy'
                    ? 'bg-[#172554] text-white border-indigo-900'
                    : s.backgroundTone === 'blue'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : s.backgroundTone === 'amber'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase opacity-75">{s.type}</span>
                  <StatusLabel status="Visible" />
                </div>
                <div className="mt-1 text-xs font-extrabold">{s.heading || s.label}</div>
                {s.subheading && <div className="text-[11px] opacity-80">{s.subheading}</div>}
                {s.primaryCtaLabel && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-black/15 text-[10px] font-semibold">
                    {s.primaryCtaLabel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
};
