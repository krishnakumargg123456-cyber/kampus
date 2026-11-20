import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, ExternalLink, FileWarning, HelpCircle, PlayCircle, Sparkles } from 'lucide-react';
import type { CmsBlock, CmsPage } from '../../types/superAdmin';
import { useAuth } from '../../context/AuthContext';
import { resolveAssetUrl } from '../../utils/assetResolver';

export const CmsPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetch(`/api/public/pages/${encodeURIComponent(slug || '')}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Page not found');
        if (active) {
          setPage(data.page);
          if (data.page?.seoTitle || data.page?.title) {
            document.title = data.page.seoTitle || data.page.title;
          }
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load page');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center text-sm text-slate-500">
        Loading published page...
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <FileWarning className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Page Unavailable</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {error || 'This page does not exist or has not been published yet.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Return Home
        </Link>
      </div>
    );
  }

  if (page.visibility === 'Authenticated' && !isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{page.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please sign in with your KAMPUS student account to view this restricted page.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          Sign In to Continue
        </Link>
      </div>
    );
  }

  const renderBlock = (block: CmsBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <div key={block.id} className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {block.title}
            </h2>
            {block.body && <p className="text-sm text-slate-500 dark:text-slate-400">{block.body}</p>}
          </div>
        );
      case 'paragraph':
        return (
          <div key={block.id} className="space-y-2">
            {block.title && (
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{block.title}</h3>
            )}
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {block.body}
            </p>
          </div>
        );
      case 'image':
        return (
          <figure key={block.id} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            {block.imageUrl && (
              <img src={resolveAssetUrl(block.imageUrl)} alt={block.title || page.title} className="w-full max-h-[420px] object-cover" />
            )}
            {(block.title || block.body) && (
              <figcaption className="p-4 text-xs text-slate-500 dark:text-slate-400">
                {block.title && <span className="font-semibold text-slate-800 dark:text-slate-200 mr-2">{block.title}</span>}
                {block.body}
              </figcaption>
            )}
          </figure>
        );
      case 'image-text':
        return (
          <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {block.imageUrl && (
              <img src={resolveAssetUrl(block.imageUrl)} alt={block.title || ''} className="w-full h-56 object-cover rounded-xl" />
            )}
            <div className="space-y-3">
              {block.title && <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{block.title}</h3>}
              {block.body && <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{block.body}</p>}
              {block.buttonLabel && block.buttonLink && (
                <Link
                  to={block.buttonLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  {block.buttonLabel}
                </Link>
              )}
            </div>
          </div>
        );
      case 'button':
        return (
          <div key={block.id} className="py-1">
            {block.buttonLink?.startsWith('http') ? (
              <a
                href={block.buttonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold"
              >
                <span>{block.buttonLabel || block.title || 'Open Link'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <Link
                to={block.buttonLink || '/'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold"
              >
                {block.buttonLabel || block.title || 'Continue'}
              </Link>
            )}
          </div>
        );
      case 'banner':
        return (
          <div key={block.id} className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Campus Highlight</span>
              </div>
              {block.title && <h3 className="text-lg font-bold">{block.title}</h3>}
              {block.body && <p className="text-xs sm:text-sm text-slate-300">{block.body}</p>}
            </div>
            {block.buttonLabel && block.buttonLink && (
              <Link
                to={block.buttonLink}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0"
              >
                {block.buttonLabel}
              </Link>
            )}
          </div>
        );
      case 'video':
        return (
          <div key={block.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>{block.title || 'Media Resource'}</span>
            </div>
            {block.body && <p className="text-xs text-slate-600 dark:text-slate-400">{block.body}</p>}
            {block.videoUrl && (
              <a
                href={block.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                Watch Resource Video <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        );
      case 'feature-showcase':
      case 'card-grid':
        return (
          <div key={block.id} className="space-y-4">
            {block.title && <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{block.title}</h3>}
            {block.body && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{block.body}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(block.items || []).map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.detail}</p>
                  {item.link && (
                    <Link to={item.link} className="inline-block text-xs font-semibold text-blue-600 hover:underline pt-1">
                      Open Module
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'faq':
        return (
          <div key={block.id} className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>{block.title || 'Frequently Asked Questions'}</span>
            </div>
            <div className="space-y-2.5">
              {(block.items || []).map((faq, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{faq.title}</div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">{faq.detail}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'divider':
        return <hr key={block.id} className="border-slate-200 dark:border-slate-800 my-4" />;
      default:
        return null;
    }
  };

  return (
    <article className="max-w-4xl mx-auto py-4 space-y-8">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to KAMPUS
        </Link>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">{page.pageType}</span>
          <span className="flex items-center gap-1 font-mono tabular-nums">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(page.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {page.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-72">
          <img src={resolveAssetUrl(page.coverImageUrl)} alt={page.title} className="w-full h-72 object-cover" />
        </div>
      )}

      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {page.title}
        </h1>
        {page.seoDescription && (
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">{page.seoDescription}</p>
        )}
      </header>

      <div className="space-y-6">{page.blocks.map(renderBlock)}</div>
    </article>
  );
};
