import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, ExternalLink, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CmsBlock, CmsBlockType, CmsPage, NavItemConfig, NavigationConfig } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { AdminCard, AdminConfirmModal, AdminFeedbackBanner, StatusLabel, formatShortDate } from './AdminShared';

const BLOCK_TYPES: CmsBlockType[] = [
  'heading',
  'paragraph',
  'image',
  'image-text',
  'button',
  'banner',
  'video',
  'feature-showcase',
  'faq',
  'divider',
  'card-grid',
];

export const AdminPagesNavView: React.FC<{ mode: 'pages' | 'navigation' }> = ({ mode }) => {
  const { adminFetch, hasPermission } = useAdminAuth();
  const { refreshPlatformConfig } = usePlatformConfig();

  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CmsPage | null>(null);
  const [nav, setNav] = useState<NavigationConfig | null>(null);
  const [navGroup, setNavGroup] = useState<
    'headerMenu' | 'sidebarCategories' | 'dashboardQuickLinks' | 'footerAcademic' | 'footerSupport'
  >('headerMenu');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (mode === 'pages') {
      adminFetch<{ pages: CmsPage[] }>('/api/admin/pages')
        .then((d) => {
          setPages(d.pages || []);
          if (d.pages?.length) setSelectedPage(d.pages[0]);
        })
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    } else {
      adminFetch<{ navigation: NavigationConfig }>('/api/admin/navigation')
        .then((d) => setNav(d.navigation))
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    }
  }, [mode, adminFetch]);

  const createNewPage = async () => {
    try {
      const res = await adminFetch<{ page: CmsPage; pages: CmsPage[] }>('/api/admin/pages', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Campus Information Page',
          pageType: 'standard',
          status: 'Draft',
          visibility: 'Public',
        }),
      });
      setPages(res.pages);
      setSelectedPage(res.page);
      setNotice({ kind: 'success', message: `Created page "/page/${res.page.slug}".` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to create page.' });
    }
  };

  const savePage = async () => {
    if (!selectedPage) return;
    try {
      const res = await adminFetch<{ page: CmsPage; pages: CmsPage[] }>(`/api/admin/pages/${selectedPage.id}`, {
        method: 'PUT',
        body: JSON.stringify(selectedPage),
      });
      setPages(res.pages);
      setSelectedPage(res.page);
      await refreshPlatformConfig();
      setNotice({ kind: 'success', message: `Saved page "${res.page.title}" (${res.page.status}).` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to save page.' });
    }
  };

  const duplicatePage = async (source: CmsPage) => {
    try {
      const res = await adminFetch<{ page: CmsPage; pages: CmsPage[] }>('/api/admin/pages', {
        method: 'POST',
        body: JSON.stringify({
          title: `${source.title} (Copy)`,
          slug: `${source.slug}-copy`,
          pageType: source.pageType,
          status: 'Draft',
          visibility: source.visibility,
          seoTitle: source.seoTitle,
          seoDescription: source.seoDescription,
          coverImageUrl: source.coverImageUrl,
          blocks: source.blocks.map((b, i) => ({ ...b, id: `blk-${Date.now()}-${i}` })),
        }),
      });
      setPages(res.pages);
      setSelectedPage(res.page);
      setNotice({ kind: 'success', message: `Duplicated "${source.title}" as draft "/page/${res.page.slug}".` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to duplicate page.' });
    }
  };

  const deletePage = async (id: string) => {
    try {
      const res = await adminFetch<{ pages: CmsPage[] }>(`/api/admin/pages/${id}`, { method: 'DELETE' });
      setPages(res.pages);
      setSelectedPage(res.pages[0] || null);
      setDeleteConfirmId(null);
      await refreshPlatformConfig();
      setNotice({ kind: 'info', message: 'Page deleted.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Delete failed.' });
    }
  };

  const addBlock = (type: CmsBlockType) => {
    if (!selectedPage) return;
    const block: CmsBlock = {
      id: `blk-${Date.now()}`,
      type,
      title: type === 'divider' ? '' : `${type.toUpperCase()} Block`,
      body: type === 'divider' ? '' : 'Edit block text here.',
      items:
        type === 'faq' || type === 'card-grid' || type === 'feature-showcase'
          ? [{ title: 'Item Title', detail: 'Item description', link: '/' }]
          : undefined,
    };
    setSelectedPage({ ...selectedPage, blocks: [...selectedPage.blocks, block] });
  };

  const updateBlock = (blkId: string, patch: Partial<CmsBlock>) => {
    if (!selectedPage) return;
    setSelectedPage({
      ...selectedPage,
      blocks: selectedPage.blocks.map((b) => (b.id === blkId ? { ...b, ...patch } : b)),
    });
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    if (!selectedPage) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= selectedPage.blocks.length) return;
    const nextBlocks = [...selectedPage.blocks];
    const [moved] = nextBlocks.splice(idx, 1);
    nextBlocks.splice(nextIdx, 0, moved);
    setSelectedPage({ ...selectedPage, blocks: nextBlocks });
  };

  const saveNavigation = async () => {
    if (!nav) return;
    try {
      const res = await adminFetch<{ navigation: NavigationConfig }>('/api/admin/navigation', {
        method: 'PUT',
        body: JSON.stringify(nav),
      });
      setNav(res.navigation);
      await refreshPlatformConfig();
      setNotice({ kind: 'success', message: 'Navigation updated across Header, Sidebar, Quick Links, and Footer.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to update navigation.' });
    }
  };

  if (mode === 'navigation') {
    if (!nav) return <div className="py-12 text-center text-xs text-slate-500">Loading navigation trees...</div>;
    const items = nav[navGroup] || [];
    const updateItem = (idx: number, patch: Partial<NavItemConfig>) => {
      const updated = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
      setNav({ ...nav, [navGroup]: updated });
    };
    const addNavItem = () => {
      const newItem: NavItemConfig = {
        id: `nav-${Date.now()}`,
        label: 'New Link',
        destination: '/page/about-kampus',
        visible: true,
        order: items.length + 1,
      };
      setNav({ ...nav, [navGroup]: [...items, newItem] });
    };
    const removeNavItem = (idx: number) => {
      setNav({ ...nav, [navGroup]: items.filter((_, i) => i !== idx) });
    };
    const moveNavItem = (idx: number, dir: -1 | 1) => {
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= items.length) return;
      const copy = [...items];
      const [moved] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, moved);
      setNav({ ...nav, [navGroup]: copy.map((it, i) => ({ ...it, order: i + 1 })) });
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Navigation Manager
            </h1>
            <p className="text-xs text-slate-500">
              Manage header links, sidebar categories, quick links, and footer columns live.
            </p>
          </div>
          <button
            type="button"
            disabled={!hasPermission('edit')}
            onClick={saveNavigation}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5" />
            Save Navigation
          </button>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['headerMenu', 'Header Menu'],
              ['sidebarCategories', 'Sidebar Categories'],
              ['dashboardQuickLinks', 'Dashboard Quick Links'],
              ['footerAcademic', 'Footer: Academic'],
              ['footerSupport', 'Footer: Support'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setNavGroup(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                navGroup === key
                  ? 'bg-[#172554] text-white border-[#172554]'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <AdminCard
          title="Menu Items"
          action={
            <button
              type="button"
              onClick={addNavItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Link
            </button>
          }
        >
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 items-center"
              >
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Label</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Destination Route / URL</label>
                  <input
                    type="text"
                    value={item.destination}
                    onChange={(e) => updateItem(idx, { destination: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="md:col-span-3 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveNavItem(idx, -1)}
                    className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveNavItem(idx, 1)}
                    className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateItem(idx, { visible: !item.visible })}
                    className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1"
                  >
                    {item.visible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    {item.visible ? 'Visible' : 'Hidden'}
                  </button>
                  {!item.protected && (
                    <button
                      type="button"
                      onClick={() => removeNavItem(idx)}
                      className="p-1.5 rounded text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            CMS Page Management
          </h1>
          <p className="text-xs text-slate-500">
            Create, edit, publish, and organize dynamic CMS pages using 11 structured content blocks.
          </p>
        </div>
        <button
          type="button"
          disabled={!hasPermission('create')}
          onClick={createNewPage}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          New CMS Page
        </button>
      </div>

      <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pages Index */}
        <AdminCard className="lg:col-span-4" title={`All Pages (${pages.length})`}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[540px] overflow-y-auto">
            {pages.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPage(p)}
                className={`py-3 px-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 ${
                  selectedPage?.id === p.id ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{p.title}</div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">/page/{p.slug}</div>
                  <div className="text-[10px] text-slate-400">Updated {formatShortDate(p.updatedAt)}</div>
                </div>
                <StatusLabel status={p.status} />
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Page Editor */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPage ? (
            <>
              <AdminCard
                title={`Editing: ${selectedPage.title}`}
                action={
                  <div className="flex items-center gap-2">
                    {selectedPage.status === 'Published' && (
                      <Link
                        to={`/page/${selectedPage.slug}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-600"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open /page/{selectedPage.slug}
                      </Link>
                    )}
                    {hasPermission('create') && (
                      <button
                        type="button"
                        onClick={() => duplicatePage(selectedPage)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600"
                        title="Duplicate page"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!hasPermission('delete')}
                      onClick={() => setDeleteConfirmId(selectedPage.id)}
                      className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={!hasPermission('edit')}
                      onClick={savePage}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Page
                    </button>
                  </div>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Page Title</label>
                    <input
                      type="text"
                      value={selectedPage.title}
                      onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">URL Slug</label>
                    <input
                      type="text"
                      value={selectedPage.slug}
                      onChange={(e) => setSelectedPage({ ...selectedPage, slug: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Page Type</label>
                    <select
                      value={selectedPage.pageType}
                      onChange={(e) =>
                        setSelectedPage({ ...selectedPage, pageType: e.target.value as CmsPage['pageType'] })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="standard">Standard Content</option>
                      <option value="about">About KAMPUS</option>
                      <option value="contact">Contact</option>
                      <option value="help">Help Center</option>
                      <option value="terms">Terms of Service</option>
                      <option value="privacy">Privacy Policy</option>
                      <option value="landing">Custom Landing Page</option>
                      <option value="promo">Promotional Page</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Publish Status</label>
                    <select
                      value={selectedPage.status}
                      onChange={(e) =>
                        setSelectedPage({ ...selectedPage, status: e.target.value as CmsPage['status'] })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Unpublished">Unpublished</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Visibility</label>
                    <select
                      value={selectedPage.visibility}
                      onChange={(e) =>
                        setSelectedPage({
                          ...selectedPage,
                          visibility: e.target.value as CmsPage['visibility'],
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Public">Public</option>
                      <option value="Authenticated">Authenticated Students</option>
                      <option value="Admins Only">Admins Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Scheduled Publish At (Optional)</label>
                    <input
                      type="datetime-local"
                      value={selectedPage.scheduledPublishAt || ''}
                      onChange={(e) => setSelectedPage({ ...selectedPage, scheduledPublishAt: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">SEO Meta Title</label>
                    <input
                      type="text"
                      value={selectedPage.seoTitle || ''}
                      onChange={(e) => setSelectedPage({ ...selectedPage, seoTitle: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Cover Image URL</label>
                    <input
                      type="text"
                      placeholder="/api/admin/media/file/..."
                      value={selectedPage.coverImageUrl || ''}
                      onChange={(e) => setSelectedPage({ ...selectedPage, coverImageUrl: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1">SEO Meta Description</label>
                    <input
                      type="text"
                      value={selectedPage.seoDescription}
                      onChange={(e) => setSelectedPage({ ...selectedPage, seoDescription: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </AdminCard>

              <AdminCard title="Page Content Blocks" subtitle="Modular block stack">
                <div className="space-y-3 mb-4">
                  {selectedPage.blocks.map((blk, i) => (
                    <div
                      key={blk.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase text-blue-600">
                          Block {i + 1}: {blk.type}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(i, -1)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Move block up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(i, 1)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Move block down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPage({
                                ...selectedPage,
                                blocks: selectedPage.blocks.filter((b) => b.id !== blk.id),
                              })
                            }
                            className="text-red-600 hover:underline text-[11px] ml-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {blk.type !== 'divider' && (
                        <>
                          <input
                            type="text"
                            placeholder="Block Title / Heading"
                            value={blk.title || ''}
                            onChange={(e) => updateBlock(blk.id, { title: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                          <textarea
                            rows={2}
                            placeholder="Block Body / Content"
                            value={blk.body || ''}
                            onChange={(e) => updateBlock(blk.id, { body: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                        </>
                      )}
                      {(blk.type === 'image' || blk.type === 'image-text') && (
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={blk.imageUrl || ''}
                          onChange={(e) => updateBlock(blk.id, { imageUrl: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      )}
                      {blk.type === 'video' && (
                        <input
                          type="text"
                          placeholder="Safe Video Embed URL (https://www.youtube.com/embed/...)"
                          value={blk.videoUrl || ''}
                          onChange={(e) => updateBlock(blk.id, { videoUrl: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      )}
                      {(blk.type === 'button' || blk.type === 'banner' || blk.type === 'image-text') && (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Button Label"
                            value={blk.buttonLabel || ''}
                            onChange={(e) => updateBlock(blk.id, { buttonLabel: e.target.value })}
                            className="px-2.5 py-1.5 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                          <input
                            type="text"
                            placeholder="Button Route (/...)"
                            value={blk.buttonLink || ''}
                            onChange={(e) => updateBlock(blk.id, { buttonLink: e.target.value })}
                            className="px-2.5 py-1.5 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      )}
                      {(blk.type === 'faq' || blk.type === 'card-grid' || blk.type === 'feature-showcase') && (
                        <div className="space-y-1.5 pt-1">
                          {(blk.items || []).map((item, itemIdx) => (
                            <div key={itemIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 items-center">
                              <input
                                type="text"
                                placeholder="Item Title / Question"
                                value={item.title}
                                onChange={(e) => {
                                  const next = [...(blk.items || [])];
                                  next[itemIdx] = { ...next[itemIdx], title: e.target.value };
                                  updateBlock(blk.id, { items: next });
                                }}
                                className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                              />
                              <input
                                type="text"
                                placeholder="Detail / Answer"
                                value={item.detail}
                                onChange={(e) => {
                                  const next = [...(blk.items || [])];
                                  next[itemIdx] = { ...next[itemIdx], detail: e.target.value };
                                  updateBlock(blk.id, { items: next });
                                }}
                                className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                              />
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  placeholder="Route (/...)"
                                  value={item.link || ''}
                                  onChange={(e) => {
                                    const next = [...(blk.items || [])];
                                    next[itemIdx] = { ...next[itemIdx], link: e.target.value };
                                    updateBlock(blk.id, { items: next });
                                  }}
                                  className="flex-1 px-2 py-1 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBlock(blk.id, { items: (blk.items || []).filter((_, x) => x !== itemIdx) })
                                  }
                                  className="px-2 text-red-600 text-xs font-semibold"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(blk.id, {
                                items: [...(blk.items || []), { title: 'New Entry', detail: 'Description', link: '/' }],
                              })
                            }
                            className="text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            + Add Item Row
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  {BLOCK_TYPES.map((bt) => (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => addBlock(bt)}
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      + {bt}
                    </button>
                  ))}
                </div>
              </AdminCard>
            </>
          ) : (
            <AdminCard title="Select a Page">
              <p className="text-xs text-slate-500">Choose a CMS page from the left or create a new one.</p>
            </AdminCard>
          )}
        </div>
      </div>

      <AdminConfirmModal
        open={Boolean(deleteConfirmId)}
        title="Delete CMS Page"
        description="Deleting this CMS page permanently removes it from public /page/:slug access. Navigation links referencing this slug should be updated."
        confirmLabel="Delete Page"
        danger
        onConfirm={() => deleteConfirmId && deletePage(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
