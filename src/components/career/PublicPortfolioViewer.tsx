import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import { isSafeHttpUrl } from '../../data/careerData';
import type { PortfolioDocument } from '../../types/career';

interface Props {
  slug: string;
  onExitPublicView: () => void;
}

export const PublicPortfolioViewer: React.FC<Props> = ({ slug, onExitPublicView }) => {
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioDocument | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/career/portfolio/public/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setMessage(data.message || 'Portfolio not found.');
          setIsPublic(false);
        } else if (!data.isPublic) {
          setMessage(data.message || 'This portfolio is set to Private by the student.');
          setIsPublic(false);
        } else {
          setPortfolio(data.portfolio);
          setIsPublic(true);
        }
      } catch {
        if (active) setMessage('Unable to load public portfolio.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onExitPublicView}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to KAMPUS Career</span>
      </button>

      {loading ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
          Loading portfolio...
        </div>
      ) : !isPublic || !portfolio ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Lock className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-[#172033] dark:text-slate-100">
            Portfolio Unavailable or Private
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">{message}</p>
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="text-xs font-semibold text-[#2563EB]">
              Public Student Portfolio · @{portfolio.publicSlug} · {portfolio.theme}
            </div>
            <p className="text-sm font-medium text-[#64748B] dark:text-slate-300 mt-1">
              {portfolio.educationSummary}
            </p>
          </div>

          {portfolio.aboutMe && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">About</h3>
              <p className="text-sm text-[#172033] dark:text-slate-200">{portfolio.aboutMe}</p>
            </div>
          )}

          {portfolio.skills.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Skills</h3>
              <p className="text-sm text-[#172033] dark:text-slate-200">
                {portfolio.skills.join(' · ')}
              </p>
            </div>
          )}

          {portfolio.projects.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio.projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      {p.title}
                    </div>
                    <div className="text-xs text-[#2563EB] font-semibold">
                      {p.role} · {p.technologies.join(', ')}
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-300">{p.description}</p>
                    <p className="text-xs text-[#172033] dark:text-slate-200">{p.outcomes}</p>
                    <div className="flex gap-3 text-xs pt-1">
                      {p.githubUrl && isSafeHttpUrl(p.githubUrl) && (
                        <a
                          href={p.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] inline-flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> GitHub
                        </a>
                      )}
                      {p.liveDemoUrl && isSafeHttpUrl(p.liveDemoUrl) && (
                        <a
                          href={p.liveDemoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] inline-flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {portfolio.showContactLinks && (
            <div className="text-xs text-[#64748B] pt-2 border-t border-slate-100 dark:border-slate-800">
              Contact:{' '}
              {[portfolio.contactEmail, portfolio.githubUrl, portfolio.linkedinUrl]
                .filter(Boolean)
                .join(' · ') || 'No links listed'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
